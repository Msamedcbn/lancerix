"use server";

import { revalidatePath } from "next/cache";

import { requireRole, requireSession } from "@/lib/auth/session";
import { getContract } from "@/lib/data/contracts";
import { FAIL, firstIssue, OK, type FormState } from "@/lib/forms";
import { notifyDeliverySubmitted, notifyQaOutcome } from "@/lib/notify/email";
import { createClient } from "@/lib/supabase/server";
import {
  clientDecisionSchema,
  deliverySchema,
  QA_TIER_INFO,
  qaTierSchema,
} from "@/lib/validations/delivery";

export type { FormState };

/**
 * The freelancer hands the work over.
 *
 * Inserting the row and moving its status are separate steps because the row
 * has to exist before transition_delivery() can be called on it -- the
 * function takes an id. The insert lands in SUBMITTED via the column default,
 * which is the one status that needs no ledger row to justify it: the delivery
 * did not move into SUBMITTED, it began there.
 */
export async function submitQaDelivery(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("FREELANCER");

  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme eksik.");

  const parsed = deliverySchema.safeParse({
    stagingUrl: formData.get("stagingUrl"),
    prUrl: formData.get("prUrl") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.from("deliveries").insert({
    contract_id: contractId,
    submitted_by: session.userId,
    staging_url: parsed.data.stagingUrl,
    pr_url: parsed.data.prUrl,
    notes: parsed.data.notes,
  });

  if (error) return FAIL(error.message);

  revalidatePath(`/contracts/${contractId}`);
  return OK("Teslim kaydedildi. Şimdi QA paketini seç.");
}

/**
 * Buying a tier is what starts QA, so it also moves the delivery.
 *
 * Tier 1 buys no run at all -- it is the criteria list plus the client's own
 * check -- so it opens the review window immediately. Tier 3 queues the
 * delivery for the QA desk, and the window opens when the report lands.
 *
 * The transition and the tier-order insert happen inside one RPC
 * (choose_qa_tier(), see 20260901160000_atomic_qa_writes.sql) so a failure
 * partway through cannot leave the delivery moved with no order to explain
 * why.
 */
export async function chooseQaTier(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("FREELANCER");

  const deliveryId = String(formData.get("deliveryId") ?? "");
  const contractId = String(formData.get("contractId") ?? "");
  if (!deliveryId || !contractId) return FAIL("Teslim eksik.");

  const tier = qaTierSchema.safeParse(formData.get("tier"));
  if (!tier.success) return FAIL(firstIssue(tier.error));

  const info = QA_TIER_INFO[tier.data];
  const reviewerId = String(formData.get("reviewerId") ?? "").trim() || null;

  if (info.needsReviewer && !reviewerId) {
    return FAIL("Bir mühendis seç.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("choose_qa_tier", {
    p_delivery_id: deliveryId,
    p_tier: tier.data,
    // The RPC defaults this to null; PostgREST types the optional arg as
    // undefined, so "no reviewer" is an absent key rather than an explicit
    // null. Tier 1/2 take this path.
    ...(reviewerId ? { p_reviewer_id: reviewerId } : {}),
  });

  if (error) return FAIL(error.message);

  let mailNotice = "";
  const contract = await getContract(contractId, session.userId);
  if (contract && tier.data === "TIER1") {
    // Tier 1 opens the client's window right away, so they have to be told
    // now. Tier 3 tells them when the report lands instead.
    const sent = await notifyDeliverySubmitted({
      toUserId: contract.client_id,
      fallbackEmail: contract.client_email,
      contractId,
      contractTitle: contract.title,
      windowDays: contract.objection_window_days,
    });
    if (!sent.ok) {
      mailNotice = ` (Müşteriye e-posta iletilemedi: ${sent.reason})`;
    }
  }

  revalidatePath(`/contracts/${contractId}`);
  return OK(
    tier.data === "TIER1"
      ? `Paket seçildi. Müşterinin kontrol süresi başladı.${mailNotice}`
      : `Paket seçildi. QA masasına iletildi.${mailNotice}`,
  );
}

/**
 * The client answers inside the window.
 *
 * Only the client may call this, which transition_delivery() enforces rather
 * than trusting this function: can_actor_transition_delivery() gives ACCEPTED
 * and REJECTED to the client alone.
 */
export async function decideDelivery(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const deliveryId = String(formData.get("deliveryId") ?? "");
  const contractId = String(formData.get("contractId") ?? "");
  if (!deliveryId || !contractId) return FAIL("Teslim eksik.");

  const parsed = clientDecisionSchema.safeParse({
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_delivery", {
    p_delivery_id: deliveryId,
    p_to_status: parsed.data.decision,
    // The RPC's reason is optional, so "no note" is an absent argument rather
    // than a null the database would have to store.
    p_reason: parsed.data.note ?? undefined,
  });

  if (error) return FAIL(error.message);

  const contract = await getContract(contractId, session.userId);
  if (contract) {
    await notifyQaOutcome({
      toUserId: contract.freelancer_id,
      fallbackEmail: contract.client_email,
      contractId,
      contractTitle: contract.title,
      accepted: parsed.data.decision === "ACCEPTED",
      note: parsed.data.note,
    });
  }

  revalidatePath(`/contracts/${contractId}`);
  return OK(
    parsed.data.decision === "ACCEPTED"
      ? "Teslimat kabul edildi ve kayda geçti."
      : "İtirazın kaydedildi ve karşı tarafa bildirildi.",
  );
}
