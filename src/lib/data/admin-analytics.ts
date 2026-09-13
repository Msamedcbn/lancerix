import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Client = SupabaseClient<Database>;

// Time-series metrics for trends
export type TimeSeriesPoint = {
  date: string;
  revenue: number; // kurus
  signups: number;
  contractsCreated: number;
};

export type RevenueTrendPoint = {
  month: string;
  mrr: number; // kurus
  transactions: number;
};

export type UserSignupPoint = {
  date: string;
  freelancers: number;
  clients: number;
  referralBreakdown: Record<string, number>;
};

export type ConversionFunnelData = {
  signups: number;
  firstContractCreated: number;
  firstPaymentCompleted: number;
  firstDeliveryCompleted: number;
  conversionRates: {
    signupToContract: number;
    contractToPayment: number;
    paymentToDelivery: number;
  };
};

export type SubscriptionMetrics = {
  planName: string;
  activeCount: number;
  totalSignups: number;
  churnRate: number;
  mrr: number;
  arpu: number;
};

export type SubscriptionMetricsData = {
  plans: SubscriptionMetrics[];
  totalActive: number;
  totalMrr: number;
};

export type AnalyticsMetrics = {
  revenueTrend: RevenueTrendPoint[];
  userSignups: UserSignupPoint[];
  conversionFunnel: ConversionFunnelData;
  subscriptions: SubscriptionMetricsData;
};

// Helper: Get monthly recurring revenue trend (last 12 months)
async function getRevenueTrend(
  client: Client,
  months: number = 12
): Promise<RevenueTrendPoint[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  // Union both QA and platform fees, aggregate by month
  const { data, error } = await client
    .from("qa_tier_orders")
    .select("fee_kurus, paid_at")
    .eq("payment_status", "PAID")
    .gte("paid_at", startDate.toISOString());

  if (error) throw error;

  const qaOrders = data ?? [];

  // Get platform invoices
  const { data: invoiceData, error: invoiceError } = await client
    .from("platform_invoices")
    .select("amount_kurus, created_at")
    .eq("status", "PAID")
    .gte("created_at", startDate.toISOString());

  if (invoiceError) throw invoiceError;

  const invoices = invoiceData ?? [];

  // Aggregate by month
  const monthlyData: Record<string, { mrr: number; transactions: number }> = {};

  for (const order of qaOrders) {
    if (!order.paid_at) continue;
    const date = new Date(order.paid_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { mrr: 0, transactions: 0 };
    monthlyData[monthKey].mrr += order.fee_kurus;
    monthlyData[monthKey].transactions += 1;
  }

  for (const invoice of invoices) {
    const date = new Date(invoice.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { mrr: 0, transactions: 0 };
    monthlyData[monthKey].mrr += invoice.amount_kurus;
    monthlyData[monthKey].transactions += 1;
  }

  // Fill gaps for missing months
  const result: RevenueTrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const data = monthlyData[monthKey] || { mrr: 0, transactions: 0 };
    result.push({
      month: monthKey,
      mrr: data.mrr,
      transactions: data.transactions,
    });
  }

  return result;
}

// Helper: Get user signup trends (last 30 days)
async function getUserSignupTrend(
  client: Client,
  days: number = 30
): Promise<UserSignupPoint[]> {
  const startDate = new Date(Date.now() - days * 86_400_000);

  const { data, error } = await client
    .from("profiles")
    .select("role, referral_source, created_at")
    .gte("created_at", startDate.toISOString())
    .in("role", ["FREELANCER", "CLIENT"]);

  if (error) throw error;

  const rows = data ?? [];

  // Group by day
  const dailyData: Record<
    string,
    { freelancers: number; clients: number; referrals: Record<string, number> }
  > = {};

  for (const row of rows) {
    const date = new Date(row.created_at || "");
    const dateKey = date.toISOString().split("T")[0] || "";

    if (!dateKey) continue;

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { freelancers: 0, clients: 0, referrals: {} };
    }

    if (row.role === "FREELANCER") {
      dailyData[dateKey].freelancers += 1;
    } else if (row.role === "CLIENT") {
      dailyData[dateKey].clients += 1;
    }

    if (row.referral_source) {
      const source = row.referral_source;
      dailyData[dateKey].referrals[source] =
        (dailyData[dateKey].referrals[source] ?? 0) + 1;
    }
  }

  // Fill gaps
  const result: UserSignupPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86_400_000);
    const dateKey = date.toISOString().split("T")[0] || "";
    const dayData = dateKey ? (dailyData[dateKey] || { freelancers: 0, clients: 0, referrals: {} }) : { freelancers: 0, clients: 0, referrals: {} };
    result.push({
      date: dateKey,
      freelancers: dayData.freelancers,
      clients: dayData.clients,
      referralBreakdown: dayData.referrals,
    });
  }

  return result;
}

// Helper: Get conversion funnel
async function getConversionFunnel(client: Client): Promise<ConversionFunnelData> {
  // Count all users
  const { data: usersData, error: usersError } = await client
    .from("profiles")
    .select("id")
    .in("role", ["FREELANCER", "CLIENT"]);

  if (usersError) throw usersError;
  const signups = usersData?.length ?? 0;

  // Users who created a contract
  const { data: contractCreatorsData, error: contractError } = await client
    .from("contracts")
    .select("client_id, freelancer_id");

  if (contractError) throw contractError;
  const contractUsers = new Set<string>();
  for (const row of contractCreatorsData ?? []) {
    if (row.client_id) contractUsers.add(row.client_id);
    if (row.freelancer_id) contractUsers.add(row.freelancer_id);
  }
  const firstContractCreated = contractUsers.size;

  // Users who made a payment (via standalone QA or from contract delivery billing)
  const { data: standaloneData, error: standaloneError } = await client
    .from("standalone_qa_orders")
    .select("requested_by_user_id")
    .eq("payment_status", "PAID");

  if (standaloneError) throw standaloneError;
  const paymentUsers = new Set<string>(
    (standaloneData ?? [])
      .filter((r) => r.requested_by_user_id)
      .map((r) => r.requested_by_user_id as string)
  );
  const firstPaymentCompleted = paymentUsers.size;

  // Users who had a delivery completed
  const { data: deliveryData, error: deliveryError } = await client
    .from("deliveries")
    .select("submitted_by")
    .eq("status", "ACCEPTED");

  if (deliveryError) throw deliveryError;
  const deliveryUsers = new Set<string>(
    (deliveryData ?? [])
      .filter((r) => r.submitted_by)
      .map((r) => r.submitted_by as string)
  );
  const firstDeliveryCompleted = deliveryUsers.size;

  return {
    signups,
    firstContractCreated,
    firstPaymentCompleted,
    firstDeliveryCompleted,
    conversionRates: {
      signupToContract: signups > 0 ? firstContractCreated / signups : 0,
      contractToPayment: firstContractCreated > 0 ? firstPaymentCompleted / firstContractCreated : 0,
      paymentToDelivery: firstPaymentCompleted > 0 ? firstDeliveryCompleted / firstPaymentCompleted : 0,
    },
  };
}

// Helper: Get subscription metrics
async function getSubscriptionMetrics(
  client: Client
): Promise<SubscriptionMetricsData> {
  const { data, error } = await client.from("monitoring_subscriptions").select("*");

  if (error) throw error;

  const subs = data ?? [];

  // Group by plan (assuming plan_id maps to plan names like "MONITORING" or "AGENCY")
  const planGroups: Record<
    string,
    { active: number; total: number; mrr: number; prices: number[] }
  > = {};

  const now = new Date();

  for (const sub of subs) {
    const planId = sub.plan_id || "unknown";
    if (!planGroups[planId]) {
      planGroups[planId] = { active: 0, total: 0, mrr: 0, prices: [] };
    }

    planGroups[planId].total += 1;
    planGroups[planId].prices.push(sub.price_minor ?? 0);

    // Count as active if status is ACTIVE and hasn't been cancelled
    if (sub.status === "ACTIVE") {
      planGroups[planId].active += 1;
      planGroups[planId].mrr += sub.price_minor ?? 0;
    }
  }

  const plans: SubscriptionMetrics[] = Object.entries(planGroups).map(
    ([planId, data]) => {
      const arpu = data.total > 0 ? data.mrr / data.total : 0;
      // Simplified churn: assume subscriptions older than 30 days are potential churn
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
      const oldSubs = subs.filter(
        (s) => s.plan_id === planId && new Date(s.created_at) < thirtyDaysAgo
      );
      const cancelledOldSubs = oldSubs.filter((s) => s.status !== "ACTIVE").length;
      const churnRate = oldSubs.length > 0 ? cancelledOldSubs / oldSubs.length : 0;

      return {
        planName: planId === "MONITORING" ? "Monitoring" : planId === "AGENCY" ? "Agency" : planId,
        activeCount: data.active,
        totalSignups: data.total,
        churnRate,
        mrr: data.mrr,
        arpu,
      };
    }
  );

  const totalActive = subs.filter((s) => s.status === "ACTIVE").length;
  const totalMrr = subs
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + (s.price_minor ?? 0), 0);

  return {
    plans: plans.sort((a, b) => b.activeCount - a.activeCount),
    totalActive,
    totalMrr,
  };
}

/**
 * Comprehensive analytics metrics for investor-ready dashboard.
 * Includes revenue trends, user growth, conversion funnel, and subscription health.
 */
export async function getAnalyticsMetrics(client?: Client): Promise<AnalyticsMetrics> {
  const supabase = client ?? (await createClient());

  const [revenueTrend, userSignups, conversionFunnel, subscriptions] =
    await Promise.all([
      getRevenueTrend(supabase, 12),
      getUserSignupTrend(supabase, 30),
      getConversionFunnel(supabase),
      getSubscriptionMetrics(supabase),
    ]);

  return {
    revenueTrend,
    userSignups,
    conversionFunnel,
    subscriptions,
  };
}
