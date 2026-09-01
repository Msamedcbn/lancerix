"use client";

import { useActionState } from "react";

import {
  setInvoiceAmount,
  setInvoiceStatus,
  type FormState,
} from "@/app/(dashboard)/admin/actions";

const INITIAL: FormState = { error: null };

/** Tutarı gir, sonra Ödendi/İptal işaretle. Ayrı formlar: tutar önce kesinleşmeli. */
export function InvoiceActions({ invoiceId }: Readonly<{ invoiceId: string }>) {
  const [amountState, amountAction] = useActionState(setInvoiceAmount, INITIAL);
  const [, statusAction] = useActionState(setInvoiceStatus, INITIAL);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form action={amountAction} className="flex items-center gap-1.5">
        <input type="hidden" name="invoiceId" value={invoiceId} />
        <input
          name="amount"
          placeholder="0,00"
          inputMode="decimal"
          className="tnum w-24 rounded-lg border border-zinc-200 px-2 py-1 text-right text-xs dark:border-zinc-800 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Tutarı ayarla
        </button>
      </form>
      {amountState.error && (
        <p className="text-[0.7rem] text-rose-600 dark:text-rose-400">{amountState.error}</p>
      )}

      <form action={statusAction} className="flex gap-2">
        <input type="hidden" name="invoiceId" value={invoiceId} />
        <button
          name="status"
          value="PAID"
          type="submit"
          className="border-brand/40 bg-brand-muted text-brand rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          Ödendi işaretle
        </button>
        <button
          name="status"
          value="CANCELLED"
          type="submit"
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          İptal et
        </button>
      </form>
    </div>
  );
}
