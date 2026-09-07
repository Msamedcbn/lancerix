import Link from "next/link";

import { Money } from "@/components/money";
import { EmptyState, PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listPlatformInvoices } from "@/lib/data/admin-qa";
import {
  INVOICE_STATUS_LABEL as STATUS_LABEL,
  INVOICE_STATUS_TONE as STATUS_TONE,
  INVOICE_TYPE_LABEL as TYPE_LABEL,
  type PlatformInvoiceStatus,
  type PlatformInvoiceType,
} from "@/lib/labels";

import { InvoiceActions } from "./invoice-actions";

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
                    {TYPE_LABEL[inv.invoice_type as PlatformInvoiceType] ?? inv.invoice_type}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Money kurus={inv.amount_kurus} className="font-medium" />
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[inv.status as PlatformInvoiceStatus] ?? ""}`}
                    >
                      {STATUS_LABEL[inv.status as PlatformInvoiceStatus] ?? inv.status}
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
