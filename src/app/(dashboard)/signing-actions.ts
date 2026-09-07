"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requireSession } from "@/lib/auth/session";
import { hashDocument, renderContractDocument } from "@/lib/contracts/document";
import { TERMS_VERSION } from "@/lib/contracts/terms";
import { getContract } from "@/lib/data/contracts";
import { FAIL, OK, toUserMessage, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

async function requestOrigin(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    ip: forwarded || h.get("x-real-ip") || "0.0.0.0",
    userAgent: h.get("user-agent") ?? "unknown",
  };
}

export async function signContract(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme eksik.");

  // The terms box is a real gate, not decoration: without it the signature
  // row would record a document hash but no evidence the party accepted
  // Lancerix's own terms, which is the half that covers the platform.
  if (formData.get("acceptTerms") !== "on") {
    return FAIL("Devam etmek için hizmet koşullarını kabul etmelisin.");
  }

  const contract = await getContract(contractId, session.userId);
  if (!contract) return FAIL("Sözleşme bulunamadı.");
  if (contract.freelancer_id !== session.userId && contract.client_id !== session.userId) {
    return FAIL("Bu sözleşmeyi imzalama yetkiniz yok.");
  }

  const document = renderContractDocument(
    contract,
    contract.milestones,
    {
      freelancerName:
        contract.freelancer_id === session.userId
          ? session.fullName
          : contract.counterpartyName,
      clientName:
        contract.client_id === session.userId
          ? session.fullName
          : contract.counterpartyName,
      company: contract.company,
    },
    contract.criteria,
  );

  const { ip, userAgent } = await requestOrigin();
  const supabase = await createClient();

  const { error } = await supabase.rpc("sign_contract", {
    p_contract_id: contractId,
    p_document_sha256: hashDocument(document),
    p_ip: ip,
    p_user_agent: userAgent,
    p_terms_version: TERMS_VERSION,
  });

  if (error) return FAIL(toUserMessage(error, "İmza kaydedilemedi."));

  revalidatePath(`/contracts/${contractId}`);
  return OK("İmzalandı.");
}
