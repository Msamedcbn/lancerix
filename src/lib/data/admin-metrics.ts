import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Client = SupabaseClient<Database>;

/**
 * "How healthy is the business", as opposed to admin-dashboard.ts's
 * getDashboardCounts(), which answers "what needs my attention right now".
 * That distinction is deliberate: an action queue and a health readout are
 * different questions with different failure modes -- a queue that's wrong
 * makes you miss work, a KPI that's wrong makes you misjudge the business.
 * They get separate sections on /admin so neither reads as the other.
 *
 * Every count here is real and can legitimately be zero -- this project has
 * no external users yet (2026-09-05). Zero is the honest number, not a
 * loading or error state; the page below renders it as such rather than
 * hiding an all-zero business behind a placeholder.
 */
export type ContractFunnel = {
  awaitingAction: number; // DRAFT, PENDING_SIGNATURES, PENDING_REVIEW, REVISION_REQUESTED
  active: number;
  fulfilled: number;
  closedWithoutFulfillment: number; // REJECTED, TERMINATED
};

export type DeliveryFunnel = {
  inReview: number; // SUBMITTED, QA_QUEUED, QA_DONE, AWAITING_CLIENT
  accepted: number;
  rejected: number;
};

export type RevenueSummary = {
  qaFeesKurus: number; // paid qa_tier_orders
  platformFeesKurus: number; // paid platform_invoices
};

export type UserGrowth = {
  freelancers: number;
  clients: number;
  newLast7Days: number;
};

export type BusinessMetrics = {
  contracts: ContractFunnel;
  deliveries: DeliveryFunnel;
  revenue: RevenueSummary;
  users: UserGrowth;
};

const AWAITING_ACTION_STATUSES = [
  "DRAFT",
  "PENDING_SIGNATURES",
  "PENDING_REVIEW",
  "REVISION_REQUESTED",
] as const;

const CLOSED_STATUSES = ["REJECTED", "TERMINATED"] as const;

const IN_REVIEW_STATUSES = [
  "SUBMITTED",
  "QA_QUEUED",
  "QA_DONE",
  "AWAITING_CLIENT",
] as const;

async function contractFunnel(client: Client): Promise<ContractFunnel> {
  const { data, error } = await client.from("contracts").select("status");
  if (error) throw error;

  const rows = data ?? [];
  const count = (statuses: readonly string[]) =>
    rows.filter((r) => statuses.includes(r.status)).length;

  return {
    awaitingAction: count(AWAITING_ACTION_STATUSES),
    active: count(["ACTIVE"]),
    fulfilled: count(["FULFILLED"]),
    closedWithoutFulfillment: count(CLOSED_STATUSES),
  };
}

async function deliveryFunnel(client: Client): Promise<DeliveryFunnel> {
  const { data, error } = await client.from("deliveries").select("status");
  if (error) throw error;

  const rows = data ?? [];
  const count = (statuses: readonly string[]) =>
    rows.filter((r) => statuses.includes(r.status)).length;

  return {
    inReview: count(IN_REVIEW_STATUSES),
    accepted: count(["ACCEPTED"]),
    rejected: count(["REJECTED"]),
  };
}

async function revenueSummary(client: Client): Promise<RevenueSummary> {
  const [qaOrders, invoices] = await Promise.all([
    client.from("qa_tier_orders").select("fee_kurus").eq("payment_status", "PAID"),
    client.from("platform_invoices").select("amount_kurus").eq("status", "PAID"),
  ]);

  if (qaOrders.error) throw qaOrders.error;
  if (invoices.error) throw invoices.error;

  return {
    qaFeesKurus: (qaOrders.data ?? []).reduce((sum, r) => sum + r.fee_kurus, 0),
    platformFeesKurus: (invoices.data ?? []).reduce((sum, r) => sum + r.amount_kurus, 0),
  };
}

async function userGrowth(client: Client): Promise<UserGrowth> {
  const { data, error } = await client.from("profiles").select("role, created_at");
  if (error) throw error;

  const rows = data ?? [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  // Same population as freelancers+clients below (admin accounts excluded),
  // so "+N last 7 days" can never read as bigger than the total it sits
  // under -- that inversion is what an admin role in the count produced
  // before this fix.
  const isProductUser = (r: { role: string }) =>
    r.role === "FREELANCER" || r.role === "CLIENT";

  return {
    freelancers: rows.filter((r) => r.role === "FREELANCER").length,
    clients: rows.filter((r) => r.role === "CLIENT").length,
    newLast7Days: rows.filter((r) => isProductUser(r) && r.created_at >= sevenDaysAgo).length,
  };
}

/**
 * Same optional-client shape as getDashboardCounts(), for the same reason:
 * a future digest cron could pass createAdminClient() and reuse these
 * queries instead of reimplementing them.
 */
export async function getBusinessMetrics(client?: Client): Promise<BusinessMetrics> {
  const supabase = client ?? (await createClient());

  const [contracts, deliveries, revenue, users] = await Promise.all([
    contractFunnel(supabase),
    deliveryFunnel(supabase),
    revenueSummary(supabase),
    userGrowth(supabase),
  ]);

  return { contracts, deliveries, revenue, users };
}
