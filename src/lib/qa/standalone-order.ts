import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { toUserMessage } from "@/lib/forms";
import { latestReportPerModule } from "@/lib/data/standalone-qa";
import { hashResults, runStandaloneCheck, runStandalonePackage } from "@/lib/qa/standalone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  packageFeeKurus,
  STANDALONE_DAILY_LIMIT,
  STANDALONE_MODULE_MAX_ATTEMPTS,
  type StandaloneCheckInput,
  type StandaloneCheckType,
} from "@/lib/validations/standalone-qa";

export type StandaloneOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

/**
 * The order-creation + scan + report-write sequence shared by every path
 * that can start a standalone check: createStandaloneCheck
 * (standalone-qa-actions.ts, an already-signed-in user) and
 * purchaseStandaloneCheck (marketing-actions.ts, a homepage visitor whose
 * account was just created in the same request). Both need the exact same
 * daily-cap-then-order-then-scan-then-report sequence against a caller-
 * supplied userId -- pulled out here once so neither call site can drift
 * from the other's cap/error handling.
 *
 * `supabase` must already be authenticated as `userId` (its RLS policies
 * are what actually enforce that the insert can only ever write that
 * requester's own row) -- this function does not itself check who the
 * caller is.
 */
export async function createOrderAndRunCheck(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: StandaloneCheckInput,
): Promise<StandaloneOrderResult> {
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

  const packageResults = await runStandalonePackage(input.packageId, input.targetUrl);
  if (!packageResults.some((r) => r.outcome !== null)) {
    // Nothing at all ran: the URL itself is the likely problem, and a report
    // consisting only of ERROR rows is worth neither writing nor charging for.
    return { ok: false, error: "Site yüklenemedi. Adresi kontrol edip tekrar dene." };
  }

  const admin = createAdminClient();
  // Every module the customer bought gets a row -- including the ones that
  // did not run, as ERROR. Dropping those (which this did until 2026-09-08)
  // silently shrinks a paid 7-module scan into a 6-module report that looks
  // complete; the customer has no way to see what they were owed and did not
  // get. ERROR is not FAIL: the site did not fail the check, the check never
  // happened. See 20260908070000_standalone_report_error_status.sql.
  const reportRows = packageResults.map((r) => {
    if (!r.outcome) {
      const results = { error: "MODULE_FAILED" };
      return {
        order_id: order.id,
        check_type: r.checkType,
        status: "ERROR",
        results,
        document_sha256: hashResults(results),
      };
    }
    return {
      order_id: order.id,
      check_type: r.checkType,
      status: r.outcome.status,
      results: r.outcome.results,
      document_sha256: r.outcome.documentSha256,
    };
  });

  const { error: reportError } = await admin.from("standalone_qa_reports").insert(reportRows);
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
    const results = outcome ? outcome.results : { error: "MODULE_FAILED" };
    rows.push({
      order_id: order.id,
      check_type: checkType,
      status: outcome ? outcome.status : "ERROR",
      results,
      document_sha256: outcome ? outcome.documentSha256 : hashResults(results),
    });
  }

  const admin = createAdminClient();
  const { error: reportError } = await admin.from("standalone_qa_reports").insert(rows);
  if (reportError) {
    console.error("[FAIL]", reportError.message);
    return { ok: false, error: "Rapor kaydedilemedi." };
  }

  return { ok: true, orderId: order.id };
}
