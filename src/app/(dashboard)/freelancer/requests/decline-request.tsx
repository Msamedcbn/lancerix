"use client";

import { useActionState, useState } from "react";

import {
  declineProjectRequest,
  type FormState,
} from "@/app/(dashboard)/client/request-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

/**
 * Declining a request, with the reason required.
 *
 * A silent "no" reads exactly like being ignored, and being ignored is the
 * thing this product exists to make impossible. One sentence is enough.
 */
export function DeclineRequest({ requestId }: Readonly<{ requestId: string }>) {
  const [state, action] = useActionState(declineProjectRequest, INITIAL);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-zinc-200/80 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Reddet
      </button>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <textarea
        name="reason"
        required
        minLength={3}
        maxLength={1000}
        rows={2}
        placeholder="Neden alamıyorsun? Müşteri bunu görecek."
        className="w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <FormFeedback state={state} />
      <div className="flex items-center gap-2">
        <SubmitButton tone="danger" pendingLabel="Gönderiliyor...">
          Talebi Reddet
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
