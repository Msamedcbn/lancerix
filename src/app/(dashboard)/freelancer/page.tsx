import { Briefcase, Receipt, Settings, Wallet } from "lucide-react";
import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Stat } from "@/components/page-shell";
import { QuickActions, type QuickAction } from "@/components/quick-actions";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth/session";
import { listContracts } from "@/lib/data/contracts";

const QUICK_ACTIONS: readonly QuickAction[] = [
  { label: "Projeler", icon: Briefcase, href: "/freelancer", tint: "emerald" },
  { label: "Kazanç", icon: Wallet, href: "/freelancer/earnings", tint: "sky" },
  { label: "Makbuzlar", icon: Receipt, href: "/freelancer/invoices", tint: "amber" },
  { label: "Ayarlar", icon: Settings, href: "/freelancer/settings", tint: "violet" },
];

export default async function FreelancerProjectsPage() {
  const session = await requireRole("FREELANCER");
  const contracts = await listContracts("freelancer", session.userId);

  const qaContractsCount = contracts.filter((c) => c.product_type === "QA_ONLY").length;
  const escrowContractsCount = contracts.length - qaContractsCount;

  return (
    <div className="flex flex-col gap-8">
      <QuickActions items={QUICK_ACTIONS} />

      <PageHeading
        title="Projeler"
        subtitle="Teslim ettiğin işler, kabul kriterleri ve sözleşmelerinin durumu"
        action={
          <Link
            href="/freelancer/new"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-md shadow-brand/20 transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/30 active:scale-[0.98]"
          >
            <svg
              className="size-4 transition-transform group-hover:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Yeni sözleşme
          </Link>
        }
      />

      {contracts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Toplam Proje"
            value={contracts.length}
            hint={`${qaContractsCount} QA Doğrulama, ${escrowContractsCount} Escrow`}
          />
          <Stat
            label="QA Doğrulama"
            value={qaContractsCount}
            hint="Kriter bazlı hızlı doğrulama"
          />
          <Stat
            label="Escrow Hak Ediş"
            value={escrowContractsCount}
            hint="Aşama bazlı güvenli ödeme"
          />
        </div>
      ) : null}

      {contracts.length === 0 ? (
        <EmptyState
          title="Henüz proje yok"
          description="Bir müşteriyle sözleşme kurduğunda burada görünür. QA kabul kriterlerini tanımlayabilir veya aşamalı escrow ödemeleri ile iş başlatabilirsin."
        >
          <Link
            href="/freelancer/new"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            İlk sözleşmeni kur &rarr;
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
          {contracts.map((contract) => {
            const isQaOnly = contract.product_type === "QA_ONLY";
            const total = contract.milestones.reduce(
              (sum, m) => sum + m.gross_amount_kurus,
              0,
            );
            const done = contract.milestones.filter(
              (m) => m.status === "RELEASED",
            ).length;

            return (
              <div
                key={contract.id}
                className="group has-[a:active]:scale-[0.98] has-[a:active]:shadow-xs relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl active:scale-[0.98] dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-brand/40 dark:hover:shadow-zinc-950/60"
              >
                <Link href={`/contracts/${contract.id}`} className="absolute inset-0 z-0" aria-label={`Sözleşme detayı: ${contract.title}`} />
                
                <div className="relative z-10 pointer-events-none">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        isQaOnly
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {isQaOnly ? "QA Doğrulama" : "Escrow Ödemeli"}
                    </span>
                    <span className="tnum text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
                      {contract.reference}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold tracking-tight text-zinc-950 group-hover:text-brand dark:text-zinc-50 transition-colors">
                    {contract.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 pointer-events-auto">
                    <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      {contract.counterpartyPublicId ? (
                        <Link
                          href={`/profile/${contract.counterpartyPublicId}`}
                          className="hover:text-brand hover:underline transition-colors"
                        >
                          {contract.counterpartyName}
                        </Link>
                      ) : (
                        contract.counterpartyName
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 relative z-10 pointer-events-none">
                  {isQaOnly ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-600 dark:text-zinc-300">
                        {contract.criteria.length} Kabul Kriteri
                      </span>
                      <span className="font-semibold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        İncele &rarr;
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {contract.milestones.map((m) => (
                          <StatusBadge key={m.id} status={m.status} />
                        ))}
                      </div>
                      <Money
                        kurus={total}
                        className="text-base font-bold text-zinc-950 dark:text-zinc-50"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
