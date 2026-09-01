import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listPlatformInvoices } from "@/lib/data/admin-qa";

import { InvoiceActions } from "./invoice-actions";

const TYPE_LABEL: Record<string, string> = {
  WORK_START: "İş başlangıcı",
  QA_SERVICE: "QA hizmeti",
  CUSTOM: "Özel",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  CANCELLED: "İptal",
};

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
};

export default async function AdminInvoicesPage() {
  await requireRole("ADMIN");
  const invoices = await listPlatformInvoices();

  return (
    <>
      <PageHeading
        title="Platform faturaları"
        subtitle="Lancerix'in kestiği hizmet faturaları -- ödeme entegrasyonu bağlanana kadar elden takip edilir."
      />

      {invoices.length === 0 ? (
        <EmptyState
          title="Henüz fatura yok"
          description="İş başlangıcı onaylandığında ya da bir QA hizmeti verildiğinde burada bir fatura satırı görünür."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[50rem] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Sözleşme
                </th>
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Tür
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Tutar
                </th>
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  Durum
                </th>
                <th className="px-5 py-3 text-xs font-medium tracking-wide text-zinc-500 uppercase" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="fade-in hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-5 py-3">
                    {inv.contract ? (
                      <Link href={`/contracts/${inv.contract.id}`} className="hover:underline">
                        {inv.contract.title}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                    {TYPE_LABEL[inv.invoice_type] ?? inv.invoice_type}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Money kurus={inv.amount_kurus} className="font-medium" />
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[inv.status] ?? ""}`}
                    >
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {inv.status === "PENDING" ? <InvoiceActions invoiceId={inv.id} /> : null}
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
