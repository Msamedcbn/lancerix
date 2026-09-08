import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type StandaloneQaOrder = Tables<"standalone_qa_orders">;
export type StandaloneQaReport = Tables<"standalone_qa_reports">;

export type StandaloneOrderRow = StandaloneQaOrder & {
  standalone_qa_reports: StandaloneQaReport[];
};

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

