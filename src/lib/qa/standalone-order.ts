import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { toUserMessage } from "@/lib/forms";
import { latestReportPerModule } from "@/lib/data/standalone-qa";
import {
  hashResults,
  runStandaloneCheck,
  runStandalonePackage,
  type PackageCheckOutcome,
} from "@/lib/qa/standalone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  packageFeeKurus,
  STANDALONE_DAILY_LIMIT,
  STANDALONE_MODULE_MAX_ATTEMPTS,
  type StandaloneCheckInput,
  type StandaloneCheckType,
  type StandalonePackageId,
} from "@/lib/validations/standalone-qa";

export type StandaloneOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

/** One report row, shaped for insert. A module that produced no outcome is
 * recorded as ERROR -- not FAIL: the site did not fail the check, the check
 * never happened. Sealed like any other row, because
 * standalone_qa_reports.document_sha256 is NOT NULL and 64-hex, and because
 * "this module did not run" is itself evidence worth making tamper-evident.
 * See 20260908070000_standalone_report_error_status.sql. */
function reportRow(orderId: string, checkType: string, outcome: PackageCheckOutcome["outcome"]) {
  if (!outcome) {
    const results = { error: "MODULE_FAILED" };
    return {
      order_id: orderId,
      check_type: checkType,
      status: "ERROR",
      results,
      document_sha256: hashResults(results),
    };
  }
  return {
    order_id: orderId,
    check_type: checkType,
    status: outcome.status,
    results: outcome.results,
    document_sha256: outcome.documentSha256,
  };
}

/**
 * Creates the order row and stops. The scan is NOT run here.
 *
 * Shared by both purchase paths: createStandaloneCheck
 * (standalone-qa-actions.ts, an already-signed-in user) and
 * purchaseStandaloneCheck (marketing-actions.ts, a homepage visitor whose
 * account was created in the same request). Both need identical cap and
 * error handling, so it lives here once.
 *
 * Pay-first (2026-09-08 decision): the scan used to run inside this
 * function, before the customer had paid anything. That handed every free
 * signup real headless-Chromium minutes with no revenue attached, and it
 * gave away the product's answer while payment only unlocked the detail.
 * Now the order is written PENDING, the caller sends the customer to Polar,
 * and runScanForPaidOrder() runs off the verified order.paid webhook.
 *
 * `supabase` must already be authenticated as `userId` -- RLS
 * (standalone_qa_orders_insert) is what actually enforces that the insert
 * can only write that requester's own row; this function does not check who
 * the caller is.
 */
export async function createStandaloneOrder(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: StandaloneCheckInput,
): Promise<StandaloneOrderResult> {
  // Still capped, but for a different reason than before: nothing free is
  // handed out any more, so this is no longer about bounding compute -- it
  // bounds how many abandoned PENDING orders one account can pile up.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("standalone_qa_orders")
    .select("id", { count: "exact", head: true })
    .eq("requested_by_user_id", userId)
    .gte("created_at", since);
  if (countError) return { ok: false, error: toUserMessage(countError, "Sipariş oluşturulamadı.") };
  if ((count ?? 0) >= STANDALONE_DAILY_LIMIT) {
    return { ok: false, error: `Günlük ${STANDALONE_DAILY_LIMIT} tarama hakkını doldurdun. Yarın tekrar dene.` };
  }

  const feeKurus = packageFeeKurus(input.packageId);

  const { data: order, error: insertError } = await supabase
    .from("standalone_qa_orders")
    .insert({
      requested_by_user_id: userId,
      target_url: input.targetUrl,
      package_id: input.packageId,
      fee_kurus: feeKurus,
    })
    .select("id")
    .single();
  if (insertError || !order) {
    return { ok: false, error: toUserMessage(insertError ?? { message: "insert failed" }, "Sipariş oluşturulamadı.") };
  }

  return { ok: true, orderId: order.id };
}

/**
 * Runs the purchased package for an order that has been paid, and writes one
 * report row per module.
 *
 * Called from the Polar order.paid webhook (via after(), so the webhook can
 * answer immediately -- a full package scan takes minutes and Polar retries
 * a slow endpoint). Uses the admin client throughout: there is no user
 * session on a webhook, and the caller has already established that this
 * specific order was paid for.
 *
 * Unlike the pre-payment flow this replaces, a total scan failure does NOT
 * abort without writing anything. The money is already taken, so silence
 * would be the worst outcome: every module is recorded as ERROR instead,
 * which is what surfaces the failure to the customer and arms their free
 * re-scan (rescanFailedModules).
 */
export async function runScanForPaidOrder(orderId: string): Promise<StandaloneOrderResult> {
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("standalone_qa_orders")
    .select("id, target_url, package_id, standalone_qa_reports(id)")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) {
    console.error("[FAIL] scan requested for unknown order", orderId, orderError?.message);
    return { ok: false, error: "Sipariş bulunamadı." };
  }

  // Polar can deliver order.paid more than once. The webhook's own
  // PENDING -> PAID guard already makes the status update idempotent; this
  // second check keeps a retry that slips past it from scanning twice and
  // doubling the report rows.
  if ((order.standalone_qa_reports ?? []).length > 0) {
    return { ok: true, orderId: order.id };
  }

  const packageId = (order.package_id ?? "BASIC") as StandalonePackageId;
  const packageResults = await runStandalonePackage(packageId, order.target_url);
  const rows = packageResults.map((r) => reportRow(order.id, r.checkType, r.outcome));

  const { error: reportError } = await admin.from("standalone_qa_reports").insert(rows);
  if (reportError) {
    console.error("[FAIL]", reportError.message);
    return { ok: false, error: "Rapor kaydedilemedi." };
  }

  return { ok: true, orderId: order.id };
}


/**
 * Re-runs the modules of an existing order whose latest attempt is ERROR --
 * the free re-scan a customer is owed when a module they paid for could not
 * be executed (2026-09-08 pricing decision).
 *
 * Deliberately not a new order: no fee, no Polar checkout, and no charge
 * against STANDALONE_DAILY_LIMIT, because the customer already paid for
 * this scan once and the cap exists to bound *new* free compute, not to
 * punish someone for our failure. It is also not an update: rows are
 * append-only, so a retry inserts a fresh row and the ERROR stays on file
 * as evidence of the first attempt (see latestReportPerModule).
 *
 * `supabase` must be authenticated as the order's owner -- the select below
 * is RLS-scoped (standalone_qa_orders_select), which is what stops one user
 * from spending our compute re-scanning someone else's order.
 */
export async function rescanFailedModules(
  supabase: SupabaseClient<Database>,
  orderId: string,
): Promise<StandaloneOrderResult> {
  const { data: order, error: orderError } = await supabase
    .from("standalone_qa_orders")
    .select("id, target_url, check_type, standalone_qa_reports(*)")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order) return { ok: false, error: "Sipariş bulunamadı." };

  const reports = order.standalone_qa_reports ?? [];
  const fallbackCheckType = order.check_type ?? "ACCESSIBILITY";
  const attemptsByModule = new Map<string, number>();
  for (const report of reports) {
    const key = report.check_type ?? fallbackCheckType;
    attemptsByModule.set(key, (attemptsByModule.get(key) ?? 0) + 1);
  }

  const retryable = latestReportPerModule(reports, fallbackCheckType)
    .filter((r) => r.status === "ERROR")
    .map((r) => (r.check_type ?? fallbackCheckType) as StandaloneCheckType)
    .filter((checkType) => (attemptsByModule.get(checkType) ?? 0) < STANDALONE_MODULE_MAX_ATTEMPTS);

  if (retryable.length === 0) {
    return { ok: false, error: "Tekrar taranabilecek bir modül yok." };
  }

  const rows = [];
  for (const checkType of retryable) {
    const outcome = await runStandaloneCheck(checkType, order.target_url);
    rows.push(reportRow(order.id, checkType, outcome));
  }

  const admin = createAdminClient();
  const { error: reportError } = await admin.from("standalone_qa_reports").insert(rows);
  if (reportError) {
    console.error("[FAIL]", reportError.message);
    return { ok: false, error: "Rapor kaydedilemedi." };
  }

  return { ok: true, orderId: order.id };
}
