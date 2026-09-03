"use client";

import { useActionState } from "react";
import { togglePhaseItem } from "@/app/(dashboard)/contracts/[id]/actions/workflow";
import { Loader2 } from "lucide-react";

type ToggleItemProps = {
  contractId: string;
  itemId: string;
  title: string;
  isCompleted: boolean;
};

/** One checklist row within a phase -- freelancer ticks it off individually. */
export function TogglePhaseItemForm({
  contractId,
  itemId,
  title,
  isCompleted,
}: ToggleItemProps) {
  const [, formAction, isPending] = useActionState(
    async () => togglePhaseItem(contractId, itemId, !isCompleted),
    null,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-800/60"
      >
        {isPending ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-zinc-400" />
        ) : (
          <span
            className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border ${
              isCompleted
                ? "border-brand bg-brand text-brand-foreground"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
          >
            {isCompleted && <span className="text-[0.6rem] leading-none">✓</span>}
          </span>
        )}
        <span
          className={
            isCompleted
              ? "text-zinc-400 line-through dark:text-zinc-500"
              : "text-zinc-700 dark:text-zinc-300"
          }
        >
          {title}
        </span>
      </button>
    </form>
  );
}

/** Client-side, read-only rendering of the same checklist. */
export function PhaseItemsReadOnly({
  items,
}: Readonly<{ items: { id: string; title: string; is_completed: boolean }[] }>) {
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-2 px-2 py-1 text-xs">
          <span
            className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border ${
              item.is_completed
                ? "border-brand bg-brand text-brand-foreground"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
          >
            {item.is_completed && <span className="text-[0.6rem] leading-none">✓</span>}
          </span>
          <span
            className={
              item.is_completed
                ? "text-zinc-400 line-through dark:text-zinc-500"
                : "text-zinc-700 dark:text-zinc-300"
            }
          >
            {item.title}
          </span>
        </li>
      ))}
    </ul>
  );
}
