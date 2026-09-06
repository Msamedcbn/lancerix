"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requireRole, requireSession } from "@/lib/auth/session";
import { getContract } from "@/lib/data/contracts";
import { FAIL, firstIssue, OK, toUserMessage, type FormState } from "@/lib/forms";
import { createQaOrderCheckout } from "@/lib/lemonsqueezy";
import { notifyDeliverySubmitted, notifyQaOutcome, notifyReviewerAssigned } from "@/lib/notify/email";
import { processTier2Order } from "@/lib/qa/agent";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  clientDecisionSchema,
  deliverySchema,
  QA_TIER_INFO,
  qaTierSchema,
  type QaTier,
} from "@/lib/validations/delivery";

export type { FormState };

/**
 * The client picks the QA package before signing, not the freelancer after
 * delivery -- the party being graded choosing their own grading rigor is a
 * conflict of interest. Same pre-signature gate as acceptance criteria:
 * set_qa_selection() refuses once any signature exists (RPC-side check),
 * and sign_contract() refuses to sign a QA_ONLY contract with none set.
 */
export async function setQaSelection(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("CLIENT");

  const contractId = String(formData.get("contractId") ?? "");
  if (!contractId) return FAIL("Sözleşme eksik.");

  const tier = qaTierSchema.safeParse(formData.get("tier"));
  if (!tier.success) return FAIL(firstIssue(tier.error));

  const info = QA_TIER_INFO[tier.data];
  const reviewerId = String(formData.get("reviewerId") ?? "").trim() || null;

  if (info.needsReviewer && !reviewerId) {
    return FAIL("Bir mühendis seç.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_qa_selection", {
    p_contract_id: contractId,
    p_tier: tier.data,
    // The RPC defaults this to null; PostgREST types the optional arg as
    // undefined, so "no reviewer" is an absent key rather than an explicit
    // null. Tier 1/2 take this path.
    ...(reviewerId ? { p_reviewer_id: reviewerId } : {}),
  });
  if (error) return FAIL(toUserMessage(error, "QA paketi kaydedilemedi."));

  revalidatePath(`/contracts/${contractId}`);
  return OK("QA paketi kaydedildi.");
}

/**
 * The freelancer hands the work over.
 *
 * Folded into one RPC (submit_qa_delivery(), see
 * 20260902070000_client_selects_qa_tier.sql): inserting the delivery row,
 * transitioning it, and creating its qa_tier_orders row against the
 * contract's pre-selected qa_tier/qa_reviewer_id/qa_fee_kurus all happen in
 * one transaction, so a failure partway through cannot strand a delivery
 * with no order to explain why. Submitting IS choosing now, since the
 * choice was already made at signing time.
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

  const contract = await getContract(contractId, session.userId);
  if (!contract) return FAIL("Sözleşme bulunamadı.");
  if (contract.status !== "ACTIVE" || !contract.work_started_at) {
    return FAIL("Teslimat yapabilmek için işin resmi olarak başlamış olması gerekir (başlangıç tarihi onaylanmalı).");
  }

  const supabase = await createClient();
  const { data: delivery, error } = await supabase.rpc("submit_qa_delivery", {
    p_contract_id: contractId,
    p_staging_url: parsed.data.stagingUrl,
    ...(parsed.data.prUrl ? { p_pr_url: parsed.data.prUrl } : {}),
    ...(parsed.data.notes ? { p_notes: parsed.data.notes } : {}),
  });

  if (error) return FAIL(toUserMessage(error, "Teslim gönderilemedi."));

  let mailNotice = "";
  const tier = contract.qa_tier as QaTier | null;
  if (tier === "TIER1") {
    // Tier 1 opens the client's window right away, so they have to be told
    // now. Tier 3+ tells them when the report lands instead.
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

  if (tier === "TIER2" && delivery) {
    // The agent run happens after this response is sent, not before -- the
    // freelancer isn't kept waiting on a Playwright launch + LLM call just
    // to see "gönderildi". A daily cron sweep (process-tier2-qa) catches
    // any order this never got to (a crashed invocation, a deploy mid-request).
    const { data: order } = await supabase
      .from("qa_tier_orders")
      .select("id")
      .eq("delivery_id", delivery.id)
      .eq("tier", "TIER2")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (order) {
      after(() => processTier2Order(order.id));
    }
  }

  const reviewerId = contract.qa_reviewer_id;
  if ((tier === "TIER3" || tier === "TIER4") && reviewerId && delivery) {
    // The token was issued inside submit_qa_delivery() itself (same
    // transaction as the qa_tier_orders row) -- fetched back and emailed
    // here, after the response, via the service-role client only. The
    // freelancer's own session must never see this: it is a write-capable
    // link for a specific reviewer, and qa_reviewer_tokens carries no RLS
    // policy for exactly that reason (2026-09-06 four-role audit, Finding 1).
    const deliveryId = delivery.id;
    after(async () => {
      const admin = createAdminClient();
      const { data: order } = await admin
        .from("qa_tier_orders")
        .select("id")
        .eq("delivery_id", deliveryId)
        .eq("reviewer_id", reviewerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!order) return;

      const [{ data: token }, { data: reviewer }] = await Promise.all([
        admin
          .from("qa_reviewer_tokens")
          .select("token")
          .eq("tier_order_id", order.id)
          .is("used_at", null)
          .maybeSingle(),
        admin
          .from("qa_reviewers")
          .select("profile_id, full_name, email, profile:profiles(full_name, email)")
          .eq("id", reviewerId)
          .single(),
      ]);
      if (!token || !reviewer) return;

      await notifyReviewerAssigned({
        toUserId: reviewer.profile_id,
        fallbackEmail: reviewer.email ?? "",
        contractTitle: contract.title,
        reviewerName: reviewer.profile?.full_name ?? reviewer.full_name ?? "",
        token: token.token,
      });
    });
  }

  revalidatePath(`/contracts/${contractId}`);
  return OK(
    tier === "TIER1"
      ? `Teslim edildi. Müşterinin kontrol süresi başladı.${mailNotice}`
      : `Teslim edildi. QA masasına iletildi.${mailNotice}`,
  );
}

/**
 * Paying a TIER3/TIER4 order's reviewer fee.
 *
 * Anyone party to the contract can trigger this -- RLS on qa_tier_orders
 * already limits the select to contract parties/admin, so there is nothing
 * beyond requireSession() to check here. The fee itself is fixed at
 * choose_qa_tier() time from the reviewer's own rate_kurus, so this never
 * invents an amount; it just hands that stored figure to LemonSqueezy.
 */
export async function payQaOrder(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return FAIL("Sipariş eksik.");

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("qa_tier_orders")
    .select("id, tier, fee_kurus, payment_status")
    .eq("id", orderId)
    .single();

  if (error || !order) return FAIL("Sipariş bulunamadı.");
  if (order.payment_status !== "PENDING") {
    return FAIL("Bu sipariş zaten ödenmiş ya da ücretsiz.");
  }
  if (order.fee_kurus <= 0) {
    return FAIL("Bu sipariş için henüz bir ücret belirlenmemiş.");
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = await createQaOrderCheckout(
      order.id,
      order.fee_kurus,
      QA_TIER_INFO[order.tier as QaTier].label,
    );
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "Ödeme linki oluşturulamadı.");
  }

  // An external LemonSqueezy URL, not an app route -- typedRoutes only knows
  // this app's own routes, so it needs an explicit escape hatch here.
  redirect(checkoutUrl as Route);
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

  if (error) return FAIL(toUserMessage(error, "Karar işlenemedi."));

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

/**
 * Faz E #1 (2026-09-03 CEO strategy review): the freelancer's own opt-in to
 * put a public link to an accepted report in a portfolio or a proposal.
 * toggle_qa_report_share() is the only real gate (freelancer-only, checked
 * against the report's own contract) -- requireRole() here just gives an
 * earlier, cheaper rejection for a client who would never see this control
 * rendered anyway.
 */
export async function toggleQaReportShare(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("FREELANCER");

  const reportId = String(formData.get("reportId") ?? "");
  const contractId = String(formData.get("contractId") ?? "");
  const share = formData.get("share") === "true";
  if (!reportId || !contractId) return FAIL("Rapor eksik.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("toggle_qa_report_share", {
    p_report_id: reportId,
    p_share: share,
  });

  if (error) return FAIL(toUserMessage(error, "Paylaşım ayarı değiştirilemedi."));

  revalidatePath(`/contracts/${contractId}`);
  return OK(share ? "Paylaşım linki oluşturuldu." : "Paylaşım kapatıldı.");
}
