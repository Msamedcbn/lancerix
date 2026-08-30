import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Row, Rows } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listMilestones } from "@/lib/data/contracts";

/** Days left before silence becomes acceptance. */
function daysLeft(deadline: string): number {
  return Math.ceil((Date.parse(deadline) - Date.now()) / 86_400_000);
}

export default async function ClientApprovalsPage() {
  const session = await requireRole("CLIENT");
  const submitted = await listMilestones(["SUBMITTED"], "client", session.userId);

  return (
    <>
      <PageHeading
        title="Onaylar"
        subtitle="Teslim edilmiş, senin cevabını bekleyen işler"
      />

      {submitted.length === 0 ? (
        <EmptyState
          title="Bekleyen teslimat yok"
          description="Bir teslimat geldiğinde itiraz süresiyle birlikte burada görünür. Süre içinde itiraz edilmezse teslimat sözleşme uyarınca kabul edilmiş sayılır; sözleşmenin asıl mekanizması budur."
        />
      ) : (
        <Rows>
          {submitted.map((m, index) => {
            const left = m.auto_accept_at ? daysLeft(m.auto_accept_at) : null;
            const urgent = left !== null && left <= 2;

            return (
              <Row key={m.id} index={index}>
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
