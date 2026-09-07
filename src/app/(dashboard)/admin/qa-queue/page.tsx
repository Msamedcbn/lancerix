import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading, Panel, Row, Rows } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listPendingQaOrders, listQaQueue } from "@/lib/data/admin-qa";
import { LEVEL_LABEL, type ReviewerLevel } from "@/lib/labels";

import { MarkOrderPaidForm } from "./mark-order-paid-form";
import { QaReportForm } from "./qa-report-form";

const TIER_LABEL: Record<string, string> = {
  TIER2: "Agentic QA",
  TIER3: "Agentic + Manuel Tester",
  TIER4: "Sadece Manuel Tester",
};

export default async function AdminQaQueuePage() {
  await requireRole("ADMIN");
  const [queue, pendingOrders] = await Promise.all([listQaQueue(), listPendingQaOrders()]);

  return (
    <>
      <PageHeading
        title="QA kuyruğu"
        subtitle="Tier 2/3/4 satın alınmış, henüz raporlanmamış teslimler. Sıra teslim sırasıdır."
      />

      {pendingOrders.length > 0 ? (
        <Panel title="Bekleyen QA ödemesi">
          <p className="mb-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Normalde LemonSqueezy webhook&apos;u bu siparişleri otomatik ödendi
            işaretler. Webhook hiç gelmediyse (kaçan bir olay, banka havalesi vb.)
            burada elle işaretleyebilirsin.
          </p>
          <Rows>
            {pendingOrders.map((o) => (
              <Row key={o.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {o.delivery?.contract ? (
                        <Link href={`/contracts/${o.delivery.contract.id}`} className="hover:underline">
                          {o.delivery.contract.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{TIER_LABEL[o.tier] ?? o.tier}</span>
                      <Money kurus={o.fee_kurus} />
                      <span>· {o.created_at.slice(0, 10)}</span>
                    </p>
                  </div>
                  <MarkOrderPaidForm orderId={o.id} />
                </div>
              </Row>
            ))}
          </Rows>
        </Panel>
      ) : null}

      {queue.length === 0 ? (
        <EmptyState
          title="Kuyruk boş"
          description="QA_QUEUED durumunda bekleyen bir teslim yok. Bir freelancer Tier 2, 3 ya da 4 seçtiğinde burada görünür."
        />
      ) : (
        <Rows>
          {queue.map((d) => (
            <Row key={d.id}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      <Link href={`/contracts/${d.contract.id}`} className="hover:underline">
                        {d.contract.title}
                      </Link>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {d.submitted_at.slice(0, 16).replace("T", " ")} teslim edildi
                    </p>
                  </div>

                  <span className="tnum rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    {TIER_LABEL[d.order.tier] ?? d.order.tier}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <a
                    href={d.staging_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    Staging adresi ↗
                  </a>
                  {d.pr_url ? (
                    <a
                      href={d.pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline"
                    >
                      PR linki ↗
                    </a>
                  ) : null}
                  {d.order.reviewer ? (
                    <span>
                      Atanan: {LEVEL_LABEL[d.order.reviewer.level as ReviewerLevel] ?? d.order.reviewer.level} ·{" "}
                      {d.order.reviewer.years_experience}+ yıl
                    </span>
                  ) : null}
                </div>

                {d.notes ? (
                  <p className="max-w-[70ch] border-l-2 border-zinc-200 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    {d.notes}
                  </p>
                ) : null}

                <QaReportForm deliveryId={d.id} contractId={d.contract.id} />
              </div>
            </Row>
          ))}
        </Rows>
      )}
    </>
  );
}
