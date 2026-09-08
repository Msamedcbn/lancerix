import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { toUserMessage } from "@/lib/forms";
import { runStandaloneCheck } from "@/lib/qa/standalone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import {
  STANDALONE_CHECK_FEE_KURUS,
  STANDALONE_DAILY_LIMIT,
  type StandaloneCheckInput,
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

  const { data: order, error: insertError } = await supabase
    .from("standalone_qa_orders")
    .insert({
      requested_by_user_id: userId,
      target_url: input.targetUrl,
      check_type: input.checkType,
      fee_kurus: STANDALONE_CHECK_FEE_KURUS,
    })
    .select("id")
    .single();
  if (insertError || !order) {
    return { ok: false, error: toUserMessage(insertError ?? { message: "insert failed" }, "Sipariş oluşturulamadı.") };
  }

  const outcome = await runStandaloneCheck(input.checkType, input.targetUrl);
  if (!outcome) {
    return { ok: false, error: "Site yüklenemedi. Adresi kontrol edip tekrar dene." };
  }

  const admin = createAdminClient();
  const { error: reportError } = await admin.from("standalone_qa_reports").insert({
    order_id: order.id,
    status: outcome.status,
    results: outcome.results,
    document_sha256: outcome.documentSha256,
  });
  if (reportError) {
    console.error("[FAIL]", reportError.message);
    return { ok: false, error: "Rapor kaydedilemedi." };
  }

  return { ok: true, orderId: order.id };
}
