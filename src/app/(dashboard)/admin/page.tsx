import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Row, Rows } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth/session";
import { listDisputes } from "@/lib/data/contracts";

export default async function AdminDisputesPage() {
  await requireRole("ADMIN");
  const disputes = await listDisputes();

  return (
    <>
      <PageHeading
        title="İtirazlar"
        subtitle="Taraflardan birinin süreci durdurduğu aşamalar"
      />

      {disputes.length === 0 ? (
        <EmptyState
          title="Açık itiraz yok"
          description="İtiraz edilmiş bir aşama yalnızca serbest bırakma veya iptalle sonuçlanabilir ve yalnızca bir yönetici çözebilir. Açık itirazlar burada iki tarafın beyanıyla listelenir."
        />
      ) : (
        <Rows>
          {disputes.map((d, index) => (
            <Row key={d.id} index={index}>
              <div className="flex flex-col gap-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {d.milestone ? (
                        <Link
                          href={`/contracts/${d.milestone.contract_id}`}
                          className="hover:underline"
                        >
                          {d.milestone.title}
                        </Link>
                      ) : (
                        "Aşama"
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {d.created_at.slice(0, 10)} tarihinde açıldı
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {d.milestone ? (
                      <StatusBadge status={d.milestone.status} />
                    ) : null}
                    {d.milestone ? (
                      <Money
                        kurus={d.milestone.gross_amount_kurus}
                        className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
                      />
                    ) : null}
                  </div>
                </div>

                <p className="max-w-[70ch] border-l-2 border-rose-200 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-600 dark:border-rose-900 dark:text-zinc-300">
                  {d.reason}
                </p>
              </div>
            </Row>
          ))}
        </Rows>
      )}
    </>
  );
}
