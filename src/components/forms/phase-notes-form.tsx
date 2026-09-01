"use client";

import { Loader2, NotebookPen } from "lucide-react";
import { useActionState, useState } from "react";

import { updatePhaseNotes } from "@/app/(dashboard)/contracts/[id]/actions/workflow";

/**
 * The freelancer's editor for a phase note. Starts collapsed to a read view
 * once a note exists -- editing is the exception, not the default state a
 * freelancer lands on every time they open the contract.
 */
export function PhaseNotesForm({
  contractId,
  phaseId,
  notes,
}: Readonly<{ contractId: string; phaseId: string; notes: string | null }>) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const res = await updatePhaseNotes(
        contractId,
        phaseId,
        String(formData.get("notes") ?? ""),
      );
      if (!res.error) setEditing(false);
      return res;
    },
    null,
  );

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-2 flex w-full items-start gap-1.5 rounded-lg border border-dashed border-zinc-200 px-2.5 py-2 text-left text-[0.7rem] leading-relaxed text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
      >
        <NotebookPen className="mt-0.5 size-3 shrink-0" aria-hidden />
        <span className="line-clamp-2">
          {notes || "Bu faza not düş..."}
        </span>
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-1.5">
      <textarea
        name="notes"
        rows={3}
        autoFocus
        defaultValue={notes ?? ""}
        placeholder="Bu fazda ne yapıldı, ne bekleniyor?"
        className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[0.75rem] leading-relaxed text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-950/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
      />
      {state?.error ? (
        <p className="text-[0.7rem] text-rose-600 dark:text-rose-400">{state.error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand text-brand-foreground flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.7rem] font-semibold disabled:opacity-50"
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
          Kaydet
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-[0.7rem] text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}

/** The client/admin side: read-only, only rendered when a note exists. */
export function PhaseNotesReadOnly({ notes }: Readonly<{ notes: string | null }>) {
  if (!notes) return null;

  return (
    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-zinc-50 px-2.5 py-2 text-[0.7rem] leading-relaxed text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-300">
      <NotebookPen className="mt-0.5 size-3 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
      <span className="whitespace-pre-wrap">{notes}</span>
    </div>
  );
}
