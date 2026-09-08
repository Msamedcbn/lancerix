"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, type FormState } from "@/lib/forms";
import { createStandaloneOrderCheckout, payViaPolarCheckout } from "@/lib/polar";
import { createStandaloneOrder, rescanFailedModules } from "@/lib/qa/standalone-order";
import { createClient } from "@/lib/supabase/server";
import { packageFeeKurus, standaloneCheckSchema } from "@/lib/validations/standalone-qa";

export type { FormState };

/**
 * Anyone signed in -- freelancer, client, or a brand-new user with no
 * project on the platform -- can pay to check a raw URL. No contract, no
 * acceptance_criteria: requireSession() is the only gate, unlike
 * setQaSelection/submitQaDelivery which requireRole() a specific side of a
 * contract.
 *
 * Pay-first (2026-09-08): this used to run the whole scan and only then ask
 * for money, which meant a free account bought real headless-Chromium
 * minutes and saw the verdict before paying for anything. Now it writes a
 * PENDING order and sends the customer straight to Polar; the scan runs off
 * the verified order.paid webhook (runScanForPaidOrder).
 *
 * The daily cap stays, with a narrower job than before: nothing free is
 * handed out any more, so it bounds abandoned PENDING orders rather than
 * free compute.
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
  const result = await createStandaloneOrder(supabase, session.userId, parsed.data);
  if (!result.ok) return FAIL(result.error);

  revalidatePath("/site-kontrol");

  const feeKurus = packageFeeKurus(parsed.data.packageId);
  return payViaPolarCheckout((customerIp) =>
    createStandaloneOrderCheckout(result.orderId, feeKurus, parsed.data.packageId, customerIp),
  );
}

/**
 * Paying a standalone check's fee. Same shape as payQaOrder() in
 * qa-actions.ts: the fee is fixed at order-creation time
 * (based on package_id), this just hands it to Polar via the shared
 * payViaPolarCheckout() helper.
 *
 * Since the pay-first switch this is the retry path, not the main one:
 * createStandaloneCheck already sends the customer to checkout on the first
 * submit. This exists for an order whose checkout was abandoned or whose
 * payment failed, so it can be paid without re-creating the order.
 *
 * There is no longer a pre-payment teaser to unlock -- a PENDING order has
 * no report rows at all, because the scan does not run until the webhook
 * confirms payment.
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


/**
 * The free re-scan a customer is owed when a module they bought could not
 * be run (its row is ERROR, see rescanFailedModules). No fee, no new order,
 * and no daily-cap charge -- the failure was ours.
 *
 * Only the owner can trigger it: requireSession() gates the action and the
 * order lookup inside rescanFailedModules runs on the user-scoped client,
 * so RLS -- not this function -- decides whose order this is. That also
 * keeps the shareable /r/[orderId] link read-only: anyone can open a
 * report, nobody but the owner can spend our compute re-running it.
 */
export async function rescanStandaloneCheck(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return FAIL("Sipariş eksik.");

  const supabase = await createClient();
  const result = await rescanFailedModules(supabase, orderId);
  if (!result.ok) return FAIL(result.error);

  revalidatePath("/site-kontrol");
  revalidatePath(`/r/${orderId}`);
  return OK("Çalıştırılamayan modüller yeniden tarandı.");
}
