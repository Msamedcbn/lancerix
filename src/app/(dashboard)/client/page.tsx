import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Row, Rows, Stat } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { formatKurus } from "@/lib/escrow/money";
import { kurus, listMilestones } from "@/lib/data/contracts";

export default async function ClientPaymentsPage() {
  const session = await requireRole("CLIENT");
  const waiting = await listMilestones(
    ["AWAITING_PAYMENT"],
    "client",
    session.userId,
  );

  const total = waiting.reduce(
    (sum, m) => sum + kurus(m.client_charge_kurus, "client_charge_kurus"),
    0,
  );

  return (
    <>
      <PageHeading
        title="Ödemeler"
        subtitle="Fonlanmayı bekleyen aşamalar ve escrow hesabına aktaracağın tutar"
      />

      {waiting.length === 0 ? (
        <EmptyState
          title="Fonlanacak aşama yok"
          description="Bir aşama fonlanmayı beklediğinde burada sözleşme bedeli, üzerine eklenen hizmet bedeli ve aktaracağın toplamla birlikte görünür."
        />
      ) : (
        <>
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
            <Stat
              label="Aktarılacak toplam"
              value={formatKurus(total)}
              hint={`${waiting.length} aşama fonlanmayı bekliyor`}
            />
          </div>

          <Rows>
            {waiting.map((m, index) => (
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
                      {m.counterpartyName} · {m.contract.reference}
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
                        Aktaracağın
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

          {/* Funding is deliberately not a button: a milestone starts only when
              a verified provider webhook says the money is genuinely held. */}
          <p className="max-w-[62ch] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Fonlama buradan bir tuşla değil, ödeme kuruluşunun doğrulanmış
            bildirimiyle onaylanır. Aşama ancak para gerçekten tutulduğunda
            başlar.
          </p>
        </>
      )}
    </>
  );
}
