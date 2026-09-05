import { Building2, CheckCircle2, CreditCard, UserPlus } from "lucide-react";
import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Stat } from "@/components/page-shell";
import { QuickActions, type QuickAction } from "@/components/quick-actions";
import { NeedsActionList } from "@/components/needs-action-list";
import { requireRole } from "@/lib/auth/session";
import { formatKurus } from "@/lib/escrow/money";
import { kurus, listContracts, listMilestones } from "@/lib/data/contracts";

const QUICK_ACTIONS: readonly QuickAction[] = [
  { label: "Ödemeler", icon: CreditCard, href: "/client", tint: "emerald" },
  { label: "Onaylar", icon: CheckCircle2, href: "/client/approvals", tint: "sky" },
  { label: "Geliştirici çağır", icon: UserPlus, href: "/client/requests", tint: "amber" },
  { label: "Şirket", icon: Building2, href: "/client/company", tint: "violet" },
];

export default async function ClientPaymentsPage() {
  const session = await requireRole("CLIENT");
  const [waiting, contracts] = await Promise.all([
    listMilestones(["AWAITING_PAYMENT"], "client", session.userId),
    listContracts("client", session.userId),
  ]);

  const total = waiting.reduce(
    (sum, m) => sum + kurus(m.client_charge_kurus, "client_charge_kurus"),
    0,
  );

  const qaContractsCount = contracts.filter((c) => c.product_type === "QA_ONLY").length;

  return (
    <div className="flex flex-col gap-8">
      <QuickActions items={QUICK_ACTIONS} />

      <PageHeading
        title="Sözleşmeler ve Ödemeler"
        subtitle="Sözleşmelerin ve ödeme durumların. QA sözleşmelerinde ödeme taraflar arasında doğrudan çözülür, escrow yalnızca aşamalı sözleşmelerde geçerlidir."
      />

      <NeedsActionList contracts={contracts} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Aktarılacak Toplam"
          value={formatKurus(total)}
          hint={`${waiting.length} aşama fonlanmayı bekliyor`}
        />
        <Stat
          label="Aktif Sözleşmeler"
          value={contracts.length}
          hint={`${qaContractsCount} QA Doğrulama sözleşmesi`}
        />
      </div>

      {waiting.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Fonlanacak Aşamalar
          </h2>
          <div className="grid gap-4 sm:grid-cols-1">
            {waiting.map((m) => (
              <div
                key={m.id}
                className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/80"
              >
                <Link href={`/contracts/${m.contract_id}`} className="absolute inset-0 z-0" aria-label={`Sözleşme detayı: ${m.title}`} />
                <div className="min-w-0 relative z-10 pointer-events-none">
                  <p className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50 group-hover:text-brand transition-colors">
                    {m.title}
                  </p>
                  <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400 pointer-events-auto">
                    <div className="inline-block">
                      {m.counterpartyPublicId ? (
                        <Link
                          href={`/profile/${m.counterpartyPublicId}`}
                          className="hover:text-brand hover:underline transition-colors"
                        >
                          {m.counterpartyName}
                        </Link>
                      ) : (
                        m.counterpartyName
                      )}
                    </div>{" "}
                    · {m.contract.reference}
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-2 text-right relative z-10 pointer-events-none sm:flex sm:shrink-0 sm:items-center sm:gap-6">
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">Sözleşme</dt>
                    <dd className="text-sm font-medium">
                      <Money kurus={m.gross_amount_kurus} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">Hizmet</dt>
                    <dd className="text-sm font-medium">
                      <Money kurus={kurus(m.platform_fee_kurus, "platform_fee_kurus")} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">Aktaracağın</dt>
                    <dd className="text-base font-bold text-brand">
                      <Money kurus={kurus(m.client_charge_kurus, "client_charge_kurus")} />
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <p className="max-w-[62ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 mt-2 mb-4">
            Fonlama ödeme kuruluşunun doğrulanmış bildirimiyle onaylanır. Aşama ancak para gerçekten tutulduğunda başlar.
          </p>
        </div>
      )}

      {contracts.length === 0 ? (
        waiting.length === 0 && (
          <EmptyState
            title="Henüz sözleşme yok"
            description="Bir freelancer seninle sözleşme paylaştığında burada görünür. Birlikte çalıştığın bir geliştirici varsa onu sen de çağırabilirsin."
          >
            <Link
              href="/client/requests"
              className="mt-4 inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-md shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.98]"
            >
              Geliştirici çağır
            </Link>
          </EmptyState>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Sözleşmelerin
          </h2>
          <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
            {contracts.map((c) => {
              const isQaOnly = c.product_type === "QA_ONLY";
              return (
                <div
                  key={c.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-brand/40 dark:hover:shadow-zinc-950/60"
                >
                  <Link href={`/contracts/${c.id}`} className="absolute inset-0 z-0" aria-label={`Sözleşme detayı: ${c.title}`} />
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
                        {c.reference}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold tracking-tight text-zinc-950 group-hover:text-brand dark:text-zinc-50 transition-colors">
                      {c.title}
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 pointer-events-auto">
                      <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        {c.counterpartyPublicId ? (
                          <Link
                            href={`/profile/${c.counterpartyPublicId}`}
                            className="hover:text-brand hover:underline transition-colors"
                          >
                            {c.counterpartyName}
                          </Link>
                        ) : (
                          c.counterpartyName
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-semibold text-brand relative z-10 pointer-events-none">
                    <span>{isQaOnly ? `${c.criteria.length} Kriter` : `${c.milestones.length} Aşama`}</span>
                    <span className="group-hover:translate-x-1 transition-transform">İncele &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
