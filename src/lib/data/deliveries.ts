import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Delivery = Tables<"deliveries">;
export type DeliveryEvent = Tables<"delivery_events">;
export type QaTierOrder = Tables<"qa_tier_orders">;
export type QaReport = Tables<"qa_reports">;
export type QaReviewer = Tables<"qa_reviewers">;

export type DeliveryRow = Delivery & {
  orders: QaTierOrder[];
  reports: QaReport[];
};

/**
 * Deliveries on one contract, newest first, with whatever QA has been bought
 * and produced for each.
 *
 * RLS already scopes these to the caller through is_contract_party(), so there
 * is no user filter here -- a contract the caller cannot see returns nothing
 * rather than someone else's rows.
 */
export async function listDeliveries(
  contractId: string,
): Promise<DeliveryRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deliveries")
    .select("*, qa_tier_orders(*), qa_reports(*)")
    .eq("contract_id", contractId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d) => ({
    ...d,
    orders: d.qa_tier_orders,
    reports: d.qa_reports,
  }));
}

/** The append-only record of how each delivery got where it is. */
export async function listDeliveryEvents(
  deliveryIds: string[],
): Promise<DeliveryEvent[]> {
  if (deliveryIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_events")
    .select("*")
    .in("delivery_id", deliveryIds)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * The Tier 3 roster a client picks a card from.
 *
 * Only active reviewers, ordered so the most senior come first -- the choice
 * is a hiring decision in miniature and the ordering should not be arbitrary.
 */
export async function listActiveReviewers(): Promise<QaReviewer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qa_reviewers")
    .select("*")
    .eq("active", true)
    .order("level", { ascending: true })
    .order("years_experience", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
