"use client";

import { useActionState, useState } from "react";

import { markQaOrderPaid, type FormState } from "@/app/(dashboard)/admin/actions";

const INITIAL: FormState = { error: null };

/**
 * The manual fallback for a Polar webhook that never arrived (see
 * TODOS.md's webhook reconciliation entry) -- markQaOrderPaid() already
 * existed and was correct, this is the first UI surface that reaches it.
 */
export function MarkOrderPaidForm({ orderId }: Readonly<{ orderId: string }>) {
  const [state, action] = useActionState(markQaOrderPaid, INITIAL);
  const [reference, setReference] = useState("");

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex items-center gap-1.5">
        <input
          name="reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Dekont no, referans"
          className="w-36 rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="border-brand/40 bg-brand-muted text-brand rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
        >
          Elle ödendi işaretle
        </button>
      </div>
      {state.error && <p className="text-[0.7rem] text-rose-600 dark:text-rose-400">{state.error}</p>}
    </form>
  );
}
