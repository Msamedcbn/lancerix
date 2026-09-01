import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Row, Rows } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { kurus, listMilestones } from "@/lib/data/contracts";

export default async function ClientInvoicesPage() {
  const session = await requireRole("CLIENT");
  const released = await listMilestones(["RELEASED"], "client", session.userId);

  return (
    <>
      <PageHeading title="Faturalar" subtitle="Şirketine kesilen belgeler" />

      {released.length === 0 ? (
        <EmptyState
          title="Henüz fatura yok"
          description="Serbest kalan her aşama için sözleşmedeki şirkete tek bir fatura kesilir; hem freelancerın bedelini hem platformun hizmet bedelini kapsar."
        />
      ) : (
        <Rows>
          {released.map((m) => (
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
                    {m.counterpartyName} · {m.contract.reference}
                    {m.released_at ? ` · ${m.released_at.slice(0, 10)}` : ""}
                  </p>
                </div>

                <dl className="flex items-center gap-6 text-right">
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                      Sözleşme bedeli
                    </dt>
                    <dd className="text-sm">
                      <Money kurus={m.gross_amount_kurus} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                      Hizmet bedeli
                    </dt>
                    <dd className="text-sm">
                      <Money
                        kurus={kurus(m.platform_fee_kurus, "platform_fee_kurus")}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                      Ödenen toplam
                    </dt>
                    <dd className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      <Money
                        kurus={kurus(m.client_charge_kurus, "client_charge_kurus")}
                      />
                    </dd>
                  </div>
                </dl>
              </Link>
            </Row>
          ))}
        </Rows>
      )}
    </>
  );
}
