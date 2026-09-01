import { Money } from "@/components/money";
import { EmptyState, PageHeading, Row, Rows } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { earningsSummary, kurus } from "@/lib/data/contracts";

export default async function FreelancerInvoicesPage() {
  const session = await requireRole("FREELANCER");
  const { released } = await earningsSummary(session.userId);

  return (
    <>
      <PageHeading
        title="Makbuzlar"
        subtitle="Serbest kalan her aşama için serbest meslek makbuzu matrahı"
      />

      {released.length === 0 ? (
        <EmptyState
          title="Henüz makbuz yok"
          description="Bir aşama serbest kaldığında, tam sözleşme bedeli üzerinden e-SMM düzenlenir. E-fatura entegrasyonu bağlanana kadar buradaki satırlar makbuzu elle kesmek için gereken matrahtır."
        />
      ) : (
        <Rows>
          {released.map((m) => (
            <Row key={m.id}>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {m.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {m.contract.reference}
                    {m.released_at ? ` · ${m.released_at.slice(0, 10)}` : ""}
                  </p>
                </div>

                <dl className="flex items-center gap-6 text-right">
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                      Matrah
                    </dt>
                    <dd className="text-sm">
                      <Money kurus={m.gross_amount_kurus} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                      Stopaj
                    </dt>
                    <dd className="text-sm">
                      <Money
                        kurus={kurus(m.tax_withholding_kurus, "tax_withholding_kurus")}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                      Net
                    </dt>
                    <dd className="text-brand text-sm font-medium">
                      <Money
                        kurus={kurus(m.freelancer_net_kurus, "freelancer_net_kurus")}
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            </Row>
          ))}
        </Rows>
      )}
    </>
  );
}
