import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Delivery = Tables<"deliveries">;
export type QaTierOrder = Tables<"qa_tier_orders">;
export type QaReviewer = Tables<"qa_reviewers">;
export type PlatformInvoice = Tables<"platform_invoices">;
export type DeliveryEvent = Tables<"delivery_events">;

type ContractSummary = Pick<
  Tables<"contracts">,
  "id" | "title" | "objection_window_days" | "client_email" | "client_id" | "freelancer_id"
>;

export type QaQueueRow = Delivery & {
  contract: ContractSummary;
  order: QaTierOrder & { reviewer: QaReviewer | null };
};

/**
 * Deliveries sitting in QA_QUEUED, oldest first -- the desk works the line in
 * the order it arrived, not by tier. Each carries the one tier order that put
 * it here, since Faz 1 buys exactly one tier per delivery.
 */
export async function listQaQueue(): Promise<QaQueueRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deliveries")
    .select(
      "*, contract:contracts(id, title, objection_window_days, client_email, client_id, freelancer_id), qa_tier_orders(*, reviewer:qa_reviewers(*))",
    )
    .eq("status", "QA_QUEUED")
    .order("submitted_at", { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((d) => d.contract && d.qa_tier_orders.length > 0)
    .map((d) => ({
      ...d,
      contract: d.contract as ContractSummary,
      order: d.qa_tier_orders[0] as QaTierOrder & { reviewer: QaReviewer | null },
    }));
}

/** The full roster, active and retired -- an admin needs to see who to bring back. */
export async function listAllReviewers(): Promise<QaReviewer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qa_reviewers")
    .select("*")
    .order("active", { ascending: false })
    .order("level", { ascending: true })
    .order("years_experience", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type PlatformInvoiceRow = PlatformInvoice & {
  contract: Pick<Tables<"contracts">, "id" | "title"> | null;
};

/** Every platform invoice, newest first. */
export async function listPlatformInvoices(): Promise<PlatformInvoiceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_invoices")
    .select("*, contract:contracts(id, title)")
    .order("issued_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type RejectedDeliveryRow = Delivery & {
  contract: ContractSummary;
};

/**
 * Rejected deliveries -- the Faz 1 equivalent of a dispute. There is no admin
 * arbitration step here (that is Faz 2's DISPUTED escrow milestone); this is
 * just visibility into where a client's objection stands.
 */
export async function listRejectedDeliveries(): Promise<RejectedDeliveryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliveries")
    .select(
      "*, contract:contracts(id, title, objection_window_days, client_email, client_id, freelancer_id)",
    )
    .eq("status", "REJECTED")
    .order("decided_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .filter((d) => d.contract)
    .map((d) => ({ ...d, contract: d.contract as ContractSummary }));
}

export type DeliveryEventRow = DeliveryEvent & {
  delivery: { contract: Pick<Tables<"contracts">, "id" | "title"> } | null;
};

/** Every delivery status change across every contract, newest first. */
export async function listDeliveryLedger(limit = 100): Promise<DeliveryEventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_events")
    .select("*, delivery:deliveries(contract:contracts(id, title))")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as DeliveryEventRow[];
}
