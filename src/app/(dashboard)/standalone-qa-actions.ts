"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, type FormState } from "@/lib/forms";
import { createStandaloneOrderCheckout, payViaPolarCheckout } from "@/lib/polar";
import { createOrderAndRunCheck } from "@/lib/qa/standalone-order";
import { createClient } from "@/lib/supabase/server";
import { standaloneCheckSchema } from "@/lib/validations/standalone-qa";

export type { FormState };

/**
 * Anyone signed in -- freelancer, client, or a brand-new user with no
 * project on the platform -- can pay to check a raw URL. No contract, no
 * acceptance_criteria: requireSession() is the only gate, unlike
 * setQaSelection/submitQaDelivery which requireRole() a specific side of a
 * contract.
 *
 * The scan runs synchronously here, not via after()/a cron sweep like
 * Tier 2 -- axe-core has no multi-step LLM loop whose latency needs hiding
 * from the request, so there's nothing an async trigger would buy.
 *
 * The daily cap exists because this is the one QA codepath with no contract
 * relationship gating who can reach it: every Tier1-4 order requires a real
 * signed contract first, which is itself a natural rate limit. A standalone
 * order needs nothing but a free account, and each one launches a real
 * headless Chromium process (src/lib/qa/standalone.ts) -- real compute cost
 * with no revenue guarantee until the cap exists.
 */
export async function createStandaloneCheck(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = standaloneCheckSchema.safeParse({
    targetUrl: formData.get("targetUrl"),
    packageId: formData.get("packageId") ?? "BASIC",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const result = await createOrderAndRunCheck(supabase, session.userId, parsed.data);
  if (!result.ok) return FAIL(result.error);

  revalidatePath("/site-kontrol");
  return OK("Rapor hazır. Devam etmek için ödeme yapabilirsin.");
}

/**
 * Paying a standalone check's fee. Same shape as payQaOrder() in
 * qa-actions.ts: the fee is fixed at order-creation time
 * (based on package_id), this just hands it to Polar via the shared
 * payViaPolarCheckout() helper.
 *
 * Unlike every contract-bound tier, the *detail* of a standalone report is
 * gated on payment_status (see site-kontrol/page.tsx) -- pre-payment shows
 * only PASS/FAIL/PARTIAL + a violation count, full detail unlocks once this
 * pays. Those tiers have a real contract relationship supplying a reason to
 * pay regardless of report visibility; standalone has none, so paying has to
 * actually unlock something.
 */
export async function payStandaloneCheck(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return FAIL("Sipariş eksik.");

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("standalone_qa_orders")
    .select("id, package_id, check_type, fee_kurus, payment_status")
    .eq("id", orderId)
    .single();

  if (error || !order) return FAIL("Sipariş bulunamadı.");
  if (order.payment_status !== "PENDING") {
    return FAIL("Bu sipariş zaten ödenmiş.");
  }

  const packageLabel = order.package_id ?? order.check_type ?? "BASIC";

  return payViaPolarCheckout((customerIp) =>
    createStandaloneOrderCheckout(order.id, order.fee_kurus, packageLabel, customerIp),
  );
}

