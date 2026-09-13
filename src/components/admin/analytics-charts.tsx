"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { formatKurus } from "@/lib/escrow/money";
import type {
  RevenueTrendPoint,
  UserSignupPoint,
  ConversionFunnelData,
  SubscriptionMetricsData,
} from "@/lib/data/admin-analytics";

export function RevenueChart({ data }: { data: RevenueTrendPoint[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Aylık Gelir (MRR)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis
            stroke="#6b7280"
            tickFormatter={(value) => `₺${(value / 100).toLocaleString("tr-TR")}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }}
            labelStyle={{ color: "#e5e7eb" }}
            formatter={(value) => {
              if (typeof value === "number") return `₺${formatKurus(value)}`;
              return value;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="mrr"
            stroke="#3b82f6"
            strokeWidth={2}
            name="MRR (₺)"
            dot={{ fill: "#3b82f6", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="transactions"
            stroke="#10b981"
            strokeWidth={2}
            name="İşlem Sayısı"
            yAxisId="right"
            dot={{ fill: "#10b981", r: 4 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            label={{ value: "İşlem Sayısı", angle: 90, position: "insideRight", offset: -5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UserGrowthChart({
  data,
}: {
  data: UserSignupPoint[];
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Günlük Signup (Son 30 Gün)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Legend />
          <Bar dataKey="freelancers" stackId="a" fill="#3b82f6" name="Freelancer" />
          <Bar dataKey="clients" stackId="a" fill="#ef4444" name="Müşteri" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConversionFunnelChart({
  data,
}: {
  data: ConversionFunnelData;
}) {
  const funnelData = [
    { name: "Signup", value: data.signups },
    { name: "First Contract", value: data.firstContractCreated },
    { name: "First Payment", value: data.firstPaymentCompleted },
    { name: "First Delivery", value: data.firstDeliveryCompleted },
  ];

  const maxValue = Math.max(...funnelData.map((d) => d.value), 1);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Conversion Funnel
      </h3>
      <div className="space-y-4">
        {funnelData.map((stage, idx) => {
          const percentage = (stage.value / maxValue) * 100;
          const prevStage = idx > 0 ? funnelData[idx - 1] : null;
          const rate =
            prevStage
              ? ((stage.value / prevStage.value) * 100).toFixed(1)
              : "—";

          return (
            <div key={stage.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {stage.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {stage.value} ({rate}%)
                </span>
              </div>
              <div className="h-8 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Signup → Contract:{" "}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            {(data.conversionRates.signupToContract * 100).toFixed(1)}%
          </span>
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Contract → Payment:{" "}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            {(data.conversionRates.contractToPayment * 100).toFixed(1)}%
          </span>
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Payment → Delivery:{" "}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            {(data.conversionRates.paymentToDelivery * 100).toFixed(1)}%
          </span>
        </p>
      </div>
    </div>
  );
}

export function SubscriptionMetricsChart({
  data,
}: {
  data: SubscriptionMetricsData;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Subscription Health
      </h3>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:from-blue-950/30 dark:to-blue-900/30">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Total Active Subs
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-200">
              {data.totalActive}
            </p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 dark:from-green-950/30 dark:to-green-900/30">
            <p className="text-xs font-medium text-green-700 dark:text-green-400">
              Total MRR (₺)
            </p>
            <p className="mt-1 text-2xl font-bold text-green-900 dark:text-green-200">
              {formatKurus(data.totalMrr)}
            </p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 dark:from-purple-950/30 dark:to-purple-900/30">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-400">
              Avg. Churn Rate
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-900 dark:text-purple-200">
              {(
                (data.plans.reduce((sum, p) => sum + p.churnRate, 0) /
                  Math.max(data.plans.length, 1)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>

        {data.plans.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Per-Plan Breakdown
            </h4>
            {data.plans.map((plan) => (
              <div
                key={plan.planName || "unknown"}
                className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {plan.planName || "Unknown Plan"}
                  </span>
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {plan.activeCount} active
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-zinc-600 dark:text-zinc-400">MRR</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatKurus(plan.mrr)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-600 dark:text-zinc-400">ARPU</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatKurus(plan.arpu)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-600 dark:text-zinc-400">Total Signups</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {plan.totalSignups}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-600 dark:text-zinc-400">Churn Rate</p>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {(plan.churnRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Henüz subscription verisi yok
          </p>
        )}
      </div>
    </div>
  );
}
