import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { deliveryStatusLabel, type DeliveryStatus } from "@/lib/qa/delivery-state-machine";
import { listDeliveryLedger } from "@/lib/data/admin-qa";
import { listAdminActivity } from "@/lib/data/admin-activity";

const ACTOR: Record<string, string> = {
  USER: "Taraf",
  ADMIN: "Yönetici",
  SYSTEM: "Otomatik",
};

const EVENT_LABEL: Record<string, string> = {
  qa_report_submitted: "QA raporu gönderildi",
  reviewer_added: "Mühendis eklendi",
  reviewer_active_toggled: "Mühendis aktiflik değişti",
  reviewer_rate_set: "Mühendis ücreti değişti",
  qa_order_marked_paid: "QA siparişi elle ödendi işaretlendi",
  invoice_amount_set: "Fatura tutarı değişti",
  invoice_status_set: "Fatura durumu değişti",
  user_suspended: "Kullanıcı askıya alındı",
  user_unsuspended: "Kullanıcının askısı kaldırıldı",
  user_role_changed: "Kullanıcı rolü değişti",
  user_profile_edited: "Kullanıcı profili düzenlendi",
  user_deleted: "Kullanıcı silindi",
};

export default async function AdminAuditPage() {
  await requireRole("ADMIN");
  const [rows, activity] = await Promise.all([listDeliveryLedger(), listAdminActivity()]);

  return (
    <>
      <PageHeading
        title="Kayıt defteri"
        subtitle="Her teslim durum geçişi ve her admin aksiyonu, yalnızca eklenen ve hiç silinmeyen kayıt"
      />

      <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Admin aksiyonları</h2>

      {activity.length === 0 ? (
        <EmptyState
          title="Henüz admin aksiyonu yok"
          description="Bir admin mühendis ekler, fatura durumunu değiştirir veya QA raporu gönderirse burada görünür."
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
                  Aksiyon
                </th>
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Kim
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {activity.map((row) => (
                <tr key={row.id} className="fade-in hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="tnum px-5 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    {row.created_at.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-5 py-3">
                    {EVENT_LABEL[row.event_type] ?? row.event_type}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                    {row.actor?.full_name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-6 text-sm font-bold text-zinc-950 dark:text-zinc-50">Teslim geçişleri</h2>

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
