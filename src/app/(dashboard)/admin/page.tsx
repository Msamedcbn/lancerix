import Link from "next/link";

import { EmptyState, PageHeading, Row, Rows } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listRejectedDeliveries } from "@/lib/data/admin-qa";

export default async function AdminHomePage() {
  await requireRole("ADMIN");
  const rejected = await listRejectedDeliveries();

  return (
    <>
      <PageHeading
        title="İtiraz edilen teslimler"
        subtitle="Faz 1'de bir itiraz, admin arabuluculuğu değil -- müşterinin gerekçeli reddi. Freelancer yeniden teslim eder, süreç oradan devam eder."
      />

      {rejected.length === 0 ? (
        <EmptyState
          title="Açık itiraz yok"
          description="Reddedilmiş bir teslim yalnızca freelancer'ın yeniden göndermesiyle ilerler. Reddedilenler burada müşterinin gerekçesiyle listelenir."
        />
      ) : (
        <Rows>
          {rejected.map((d) => (
            <Row key={d.id}>
              <div className="flex flex-col gap-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      <Link href={`/contracts/${d.contract.id}`} className="hover:underline">
                        {d.contract.title}
                      </Link>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {(d.decided_at ?? d.submitted_at).slice(0, 10)} tarihinde reddedildi
                    </p>
                  </div>

                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    İtiraz edildi
                  </span>
                </div>

                {d.client_note ? (
                  <p className="max-w-[70ch] border-l-2 border-rose-200 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-600 dark:border-rose-900 dark:text-zinc-300">
                    {d.client_note}
                  </p>
                ) : null}
              </div>
            </Row>
          ))}
        </Rows>
      )}
    </>
  );
}
