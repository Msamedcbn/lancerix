import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Every list* function below takes an optional client so the admin dashboard
 * (request-scoped createClient()) and the digest cron (no user session,
 * createAdminClient()) can share the exact same query instead of the cron
 * reimplementing them against a different client.
 */
type Client = SupabaseClient<Database>;

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
export async function listQaQueue(client?: Client): Promise<QaQueueRow[]> {
  const supabase = client ?? (await createClient());

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

export type PlatformInvoiceRow = PlatformInvoice & {
  contract: Pick<Tables<"contracts">, "id" | "title"> | null;
};

/** Every platform invoice, newest first. */
export async function listPlatformInvoices(client?: Client): Promise<PlatformInvoiceRow[]> {
  const supabase = client ?? (await createClient());
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
export async function listRejectedDeliveries(client?: Client): Promise<RejectedDeliveryRow[]> {
  const supabase = client ?? (await createClient());
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

export type PendingQaOrderRow = QaTierOrder & {
  delivery: { id: string; contract: Pick<Tables<"contracts">, "id" | "title"> } | null;
};

/**
 * PENDING qa_tier_orders, oldest first -- the manual reconciliation queue for
 * a Polar webhook that never arrived (see TODOS.md's webhook
 * reconciliation entry). markQaOrderPaid() already existed and handled this
 * correctly; this is the first UI surface that lets an admin reach it
 * without going to SQL.
 */
export async function listPendingQaOrders(client?: Client): Promise<PendingQaOrderRow[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("qa_tier_orders")
    .select("*, delivery:deliveries(id, contract:contracts(id, title))")
    .eq("payment_status", "PENDING")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PendingQaOrderRow[];
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
