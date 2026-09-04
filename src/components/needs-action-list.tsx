import Link from "next/link";

import type { ActionUrgency, ContractRow } from "@/lib/data/contracts";

const URGENCY_STYLE: Record<ActionUrgency, { dot: string; text: string; border: string }> = {
  red: {
    dot: "bg-rose-500 animate-pulse",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
  },
  amber: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  none: {
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
  },
};

const URGENCY_RANK: Record<ActionUrgency, number> = { red: 0, amber: 1, none: 2 };

/**
 * "Sırada sen varsın" -- the contracts where this caller, specifically, is
 * the one holding things up. contracts.ts's contractActionState() decides
 * what counts; this only sorts (most urgent first) and renders.
 *
 * Silent when nothing needs the caller -- an empty state here would just be
 * noise above the regular contract list.
 */
export function NeedsActionList({ contracts }: Readonly<{ contracts: ContractRow[] }>) {
  const pending = contracts
    .filter((c) => c.needsAction !== null)
    .sort((a, b) => URGENCY_RANK[a.needsAction!.urgency] - URGENCY_RANK[b.needsAction!.urgency]);

  if (pending.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Sırada sen varsın{" "}
        <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
          ({pending.length})
        </span>
      </h2>
      <ul className="flex flex-col gap-2">
        {pending.map((c) => {
          const style = URGENCY_STYLE[c.needsAction!.urgency];
          return (
            <li key={c.id}>
              <Link
                href={`/contracts/${c.id}`}
                className={`flex items-center justify-between gap-3 rounded-xl border bg-white/90 px-4 py-3 text-sm shadow-xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900/80 ${style.border}`}
              >
                <span className="min-w-0 truncate font-medium text-zinc-950 dark:text-zinc-50">
                  {c.title}
                </span>
                <span className={`inline-flex shrink-0 items-center gap-1.5 font-semibold ${style.text}`}>
                  <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
                  {c.needsAction!.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
