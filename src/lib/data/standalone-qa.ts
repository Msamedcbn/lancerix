import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type StandaloneQaOrder = Tables<"standalone_qa_orders">;
export type StandaloneQaReport = Tables<"standalone_qa_reports">;

export type StandaloneOrderRow = StandaloneQaOrder & {
  standalone_qa_reports: StandaloneQaReport[];
};

/**
 * The newest attempt per module, for the surfaces a customer reads.
 *
 * standalone_qa_reports is append-only (no update/delete policy, by
 * design: a verification report is evidence, not a draft), so a module
 * that failed and was re-scanned has BOTH attempts on file -- the ERROR
 * row stays as the record that a first run did not happen. Showing both
 * would read as two contradictory verdicts for one check, so the customer
 * surfaces collapse to the latest attempt while the ledger keeps the rest.
 *
 * `fallbackCheckType` covers legacy single-module orders written before
 * 20260908050000, whose rows carry check_type = null and whose module type
 * lives on the order instead.
 */
export function latestReportPerModule(
  reports: StandaloneQaReport[],
  fallbackCheckType: string,
): StandaloneQaReport[] {
  const latest = new Map<string, StandaloneQaReport>();
  for (const report of reports) {
    const key = report.check_type ?? fallbackCheckType;
    const seen = latest.get(key);
    if (!seen || report.generated_at > seen.generated_at) latest.set(key, report);
  }
  return [...latest.values()];
}

/**
 * The signed-in user's own contract-free checks, newest first. RLS
 * (standalone_qa_orders_select) already scopes this to
 * requested_by_user_id = auth.uid(), same as every other list in
 * src/lib/data -- this just picks the shape the page needs.
 */
export async function listMyStandaloneOrders(): Promise<StandaloneOrderRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("standalone_qa_orders")
    .select("*, standalone_qa_reports(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Public audit report getter by orderId. Uses admin client so any user with
 * the shareable link can view the report details regardless of RLS session.
 */
export async function getStandaloneOrderPublic(orderId: string): Promise<StandaloneOrderRow | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("standalone_qa_orders")
    .select("*, standalone_qa_reports(*)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as StandaloneOrderRow;
}

