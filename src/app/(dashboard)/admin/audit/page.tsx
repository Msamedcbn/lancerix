import { Money } from "@/components/money";
import { EmptyState, PageHeading } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth/session";
import { listLedger } from "@/lib/data/contracts";

const ACTOR: Record<string, string> = {
  USER: "Taraf",
  ADMIN: "Yönetici",
  SYSTEM: "Otomatik",
};

export default async function AdminAuditPage() {
  await requireRole("ADMIN");
  const rows = await listLedger();

  return (
    <>
      <PageHeading
        title="Kayıt defteri"
        subtitle="Her escrow geçişi, yalnızca eklenen ve hiç silinmeyen kayıt"
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Henüz hareket yok"
          description="Her durum değişikliği, aynı işlem içinde para bölüşümünün tamamı dondurulmuş halde bir defter satırı yazar. Satırlar hiçbir zaman güncellenmez veya silinmez; bu liste yalnızca büyür."
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
                  Geçiş
                </th>
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Kim
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Müşteri ödedi
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Net
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="reveal hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <td className="tnum px-5 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    {row.created_at.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      {row.from_status ? (
                        <StatusBadge status={row.from_status} />
                      ) : (
                        <span className="text-xs text-zinc-400">yeni</span>
                      )}
                      <span className="text-zinc-300 dark:text-zinc-600">→</span>
                      <StatusBadge status={row.to_status} />
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                    {ACTOR[row.actor_kind] ?? row.actor_kind}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Money kurus={row.client_charge_kurus} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Money kurus={row.freelancer_net_kurus} />
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
