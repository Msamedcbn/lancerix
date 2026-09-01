import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { deliveryStatusLabel, type DeliveryStatus } from "@/lib/qa/delivery-state-machine";
import { listDeliveryLedger } from "@/lib/data/admin-qa";

const ACTOR: Record<string, string> = {
  USER: "Taraf",
  ADMIN: "Yönetici",
  SYSTEM: "Otomatik",
};

export default async function AdminAuditPage() {
  await requireRole("ADMIN");
  const rows = await listDeliveryLedger();

  return (
    <>
      <PageHeading
        title="Kayıt defteri"
        subtitle="Her teslim durum geçişi, yalnızca eklenen ve hiç silinmeyen kayıt"
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Henüz hareket yok"
          description="Her durum değişikliği transition_delivery() içinde tek bir işlemde yazılır. Satırlar hiçbir zaman güncellenmez veya silinmez; bu liste yalnızca büyür."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Zaman
                </th>
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Sözleşme
                </th>
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Geçiş
                </th>
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Kim
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.id} className="fade-in hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="tnum px-5 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    {row.created_at.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-5 py-3">
                    {row.delivery?.contract ? (
                      <Link
                        href={`/contracts/${row.delivery.contract.id}`}
                        className="hover:underline"
                      >
                        {row.delivery.contract.title}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 whitespace-nowrap text-xs">
                      {row.from_status ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                          {deliveryStatusLabel(row.from_status as DeliveryStatus)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">yeni</span>
                      )}
                      <span className="text-zinc-300 dark:text-zinc-600">→</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                        {deliveryStatusLabel(row.to_status as DeliveryStatus)}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                    {ACTOR[row.actor_kind] ?? row.actor_kind}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
