import { PageHeading, Stat } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { getAnalyticsMetrics } from "@/lib/data/admin-analytics";
import { formatKurus } from "@/lib/escrow/money";
import {
  RevenueChart,
  UserGrowthChart,
  ConversionFunnelChart,
  SubscriptionMetricsChart,
} from "@/components/admin/analytics-charts";

export const metadata = {
  title: "Analytics - Lancerix Admin",
};

export default async function AnalyticsPage() {
  await requireRole("ADMIN");
  const metrics = await getAnalyticsMetrics();

  // Calculate key KPIs
  const currentMrrKurus = metrics.revenueTrend.length > 0
    ? metrics.revenueTrend[metrics.revenueTrend.length - 1]?.mrr ?? 0
    : 0;

  const totalSignups = metrics.conversionFunnel.signups;
  const totalUsers = metrics.userSignups.reduce(
    (sum, day) => sum + day.freelancers + day.clients,
    0
  );

  return (
    <>
      <PageHeading
        title="Analytics"
        subtitle="Investor-ready metrics: revenue, growth, conversion, subscriptions"
      />

      {/* Key metrics cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Current MRR"
          value={formatKurus(currentMrrKurus)}
          hint={`From ${metrics.subscriptions.totalActive} active subscriptions`}
        />
        <Stat
          label="Total Users"
          value={totalSignups}
          hint={`${metrics.conversionFunnel.firstContractCreated} created contracts`}
        />
        <Stat
          label="Signup → Contract"
          value={`${(metrics.conversionFunnel.conversionRates.signupToContract * 100).toFixed(1)}%`}
          hint={`${metrics.conversionFunnel.firstContractCreated} / ${totalSignups} users`}
        />
        <Stat
          label="Total Churn Rate"
          value={`${(
            (metrics.subscriptions.plans.reduce((sum, p) => sum + p.churnRate, 0) /
              Math.max(metrics.subscriptions.plans.length, 1)) *
            100
          ).toFixed(1)}%`}
          hint="Average across all plans"
        />
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={metrics.revenueTrend} />
        <UserGrowthChart data={metrics.userSignups} />
        <div className="lg:col-span-2">
          <ConversionFunnelChart data={metrics.conversionFunnel} />
        </div>
        <div className="lg:col-span-2">
          <SubscriptionMetricsChart data={metrics.subscriptions} />
        </div>
      </div>

      {/* Raw data export section */}
      <div className="rounded-lg border border-zinc-200 bg-white/50 p-6 dark:border-zinc-800 dark:bg-zinc-950/50">
        <h3 className="mb-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Data Export
        </h3>
        <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
          Analytics snapshots are calculated in real-time from your database. For detailed
          CSV exports or API access, contact support.
        </p>
        <pre className="max-h-64 overflow-auto rounded bg-zinc-900/50 p-3 text-xs font-mono text-zinc-200">
          {JSON.stringify(
            {
              generatedAt: new Date().toISOString(),
              currentMRR: currentMrrKurus,
              totalUsers,
              conversionRates: metrics.conversionFunnel.conversionRates,
              subscriptionMetrics: {
                totalActive: metrics.subscriptions.totalActive,
                totalMRR: metrics.subscriptions.totalMrr,
                plans: metrics.subscriptions.plans,
              },
            },
            null,
            2
          )}
        </pre>
      </div>
    </>
  );
}
