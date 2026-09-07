"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { getContract } from "@/lib/data/contracts";
import { FAIL, firstIssue, OK, toUserMessage, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { toCheckConfig } from "@/lib/validations/acceptance-criteria";
import { criteriaSubmissionSchema } from "@/lib/validations/contract";

import { readCriteria } from "./contract-form-data";

// ---------------------------------------------------------------------------
// Acceptance criteria (client-owned)
// ---------------------------------------------------------------------------

/**
 * The client sets what "done" means for a QA_ONLY contract.
 *
 * Replaces the whole set rather than patching individual rows: the RLS
 * insert/delete policies both refuse once either party has signed, so this
 * can only run pre-signature anyway, and a full replace means the form's
 * local add/remove state and the stored rows can never drift out of sync
 * with each other.
 */
export async function addAcceptanceCriteria(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("CLIENT");

  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme eksik.");

  const parsed = criteriaSubmissionSchema.safeParse(readCriteria(formData));
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const contract = await getContract(contractId, session.userId);
  if (!contract) return FAIL("Sözleşme bulunamadı.");
  if (!["DRAFT", "PENDING_REVIEW", "REVISION_REQUESTED"].includes(contract.status)) {
    return FAIL("Sözleşme imzalandığı veya imza sürecinde olduğu için kriterler değiştirilemez.");
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("acceptance_criteria")
    .delete()
    .eq("contract_id", contractId);
  if (deleteError) return FAIL(toUserMessage(deleteError, "Eski kriterler silinemedi."));

  const { error: insertError } = await supabase.from("acceptance_criteria").insert(
    parsed.data.map((c, index) => ({
      contract_id: contractId,
      sequence_no: index + 1,
      description: c.description,
      check_type: "MANUAL",
      check_config: toCheckConfig(c),
    })),
  );
  if (insertError) return FAIL(toUserMessage(insertError, "Kabul kriterleri kaydedilemedi."));

  revalidatePath(`/contracts/${contractId}`);
  return OK("Kabul kriterleri kaydedildi.");
}
