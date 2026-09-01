import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Row, Rows } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listContracts, listMilestones } from "@/lib/data/contracts";
import { listDeliveries } from "@/lib/data/deliveries";

/** Days left before silence becomes acceptance. */
function daysLeft(deadline: string): number {
  return Math.ceil((Date.parse(deadline) - Date.now()) / 86_400_000);
}

export default async function ClientApprovalsPage() {
  const session = await requireRole("CLIENT");
  const [submitted, contracts] = await Promise.all([
    listMilestones(["SUBMITTED"], "client", session.userId),
    listContracts("client", session.userId),
  ]);

  const qaContracts = contracts.filter((c) => c.product_type === "QA_ONLY");
  const qaDeliveriesNested = await Promise.all(
    qaContracts.map(async (c) => {
      const deliveries = await listDeliveries(c.id);
      return deliveries
        .filter((d) => d.status === "AWAITING_CLIENT")
        .map((d) => ({ ...d, contract: c }));
    }),
  );
  const qaDeliveries = qaDeliveriesNested.flat();

  const totalItems = submitted.length + qaDeliveries.length;

  return (
    <>
      <PageHeading
        title="Onaylar"
        subtitle="Teslim edilmiş, senin cevabını bekleyen işler"
      />

      {totalItems === 0 ? (
        <EmptyState
          title="Bekleyen teslimat yok"
          description="Bir teslimat geldiğinde itiraz süresiyle birlikte burada görünür. Süre içinde itiraz edilmezse teslimat sözleşme uyarınca kabul edilmiş sayılır; sözleşmenin asıl mekanizması budur."
        />
      ) : (
        <Rows>
          {qaDeliveries.map(({ contract, ...d }) => {
            const left = d.client_review_deadline
              ? daysLeft(d.client_review_deadline)
              : null;
            const urgent = left !== null && left <= 2;

            return (
              <Row key={d.id}>
                <Link
                  href={`/contracts/${contract.id}`}
                  className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {contract.title} (QA Teslimatı)
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {contract.counterpartyName} teslim etti · {d.submitted_at.slice(0, 10)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    {left !== null ? (
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          urgent
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {left > 0
                          ? `${left} gün içinde otomatik kabul`
                          : "Süre doldu, kabul edilecek"}
                      </span>
                    ) : null}
                    <span className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      QA Kontrolü
                    </span>
                  </div>
                </Link>
              </Row>
            );
          })}

          {submitted.map((m) => {
            const left = m.auto_accept_at ? daysLeft(m.auto_accept_at) : null;
            const urgent = left !== null && left <= 2;

            return (
              <Row key={m.id}>
                <Link
                  href={`/contracts/${m.contract_id}`}
                  className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {m.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {m.counterpartyName} teslim etti
                      {m.submitted_at ? ` · ${m.submitted_at.slice(0, 10)}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    {left !== null ? (
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          urgent
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {left > 0
                          ? `${left} gün içinde otomatik kabul`
                          : "Süre doldu, kabul edilecek"}
                      </span>
                    ) : null}
                    <Money
                      kurus={m.gross_amount_kurus}
                      className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
                    />
                  </div>
                </Link>
              </Row>
            );
          })}
        </Rows>
      )}
    </>
  );
}
