import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Row, Rows } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { kurus, listMilestones, listClientPlatformInvoices } from "@/lib/data/contracts";

const INVOICE_TYPE_LABEL: Record<string, string> = {
  WORK_START: "İş başlangıcı",
  QA_SERVICE: "QA hizmeti",
  CUSTOM: "Özel",
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  CANCELLED: "İptal",
};

const INVOICE_STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

export default async function ClientInvoicesPage() {
  const session = await requireRole("CLIENT");
  const [released, platformInvoices] = await Promise.all([
    listMilestones(["RELEASED"], "client", session.userId),
    listClientPlatformInvoices(session.userId),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <PageHeading title="Faturalar" subtitle="Şirketine kesilen belgeler" />

        <div className="mt-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              Escrow Faturaları
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Aşamalı, emanet ödemeli sözleşmeler için — Faz 2&apos;de aktif olacak.
            </p>
          </div>
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

                    <dl className="grid grid-cols-3 gap-2 text-right sm:flex sm:items-center sm:gap-6">
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
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Platform Hizmet Faturaları
        </h2>
        {platformInvoices.length === 0 ? (
          <EmptyState
            title="Henüz hizmet faturası yok"
            description="Lancerix tarafından iş başlangıcı veya QA doğrulaması gibi ekstra hizmetler için kesilen faturalar burada görünür."
          />
        ) : (
          <Rows>
            {platformInvoices.map((inv) => (
              <Row key={inv.id}>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">
                        {INVOICE_TYPE_LABEL[inv.invoice_type] ?? inv.invoice_type}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                          INVOICE_STATUS_TONE[inv.status] ?? ""
                        }`}
                      >
                        {INVOICE_STATUS_LABEL[inv.status] ?? inv.status}
                      </span>
                    </div>
                    {inv.contract ? (
                      <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        <Link href={`/contracts/${inv.contract.id}`} className="hover:underline">
                          {inv.contract.title} · {inv.contract.reference}
                        </Link>
                        {inv.issued_at ? ` · ${inv.issued_at.slice(0, 10)}` : ""}
                      </p>
                    ) : null}
                    {inv.description ? (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {inv.description}
                      </p>
                    ) : null}
                  </div>

                  <dl className="flex items-center gap-6 text-right">
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">Tutar</dt>
                      <dd className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                        <Money kurus={inv.amount_kurus} />
                      </dd>
                    </div>
                  </dl>
                </div>
              </Row>
            ))}
          </Rows>
        )}
      </div>
    </div>
  );
}
