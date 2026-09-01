import type { Enums } from "@/lib/supabase/database.types";

type EscrowStatus = Enums<"escrow_status">;

/**
 * A state, not a chip. A dot plus a word reads faster than a filled pill, and
 * it does not compete with the amount next to it for attention.
 *
 * The vocabulary is the state machine's, in the words a Turkish freelancer or
 * a finance department would actually use.
 */
const STATE: Record<
  EscrowStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  DRAFT: {
    label: "Taslak",
    dot: "bg-zinc-400 dark:bg-zinc-500",
    text: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800/60",
    border: "border-zinc-200 dark:border-zinc-700/60",
  },
  AWAITING_PAYMENT: {
    label: "Ödeme bekleniyor",
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  IN_PROGRESS: {
    label: "Devam ediyor",
    dot: "bg-sky-500 animate-pulse",
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800/60",
  },
  SUBMITTED: {
    label: "Teslim edildi",
    dot: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800/60",
  },
  COMPLETED: {
    label: "Onaylandı",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  RELEASED: {
    label: "Ödendi",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  DISPUTED: {
    label: "İtirazlı",
    dot: "bg-rose-500 animate-bounce",
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800/60",
  },
  CANCELLED: {
    label: "İptal edildi",
    dot: "bg-zinc-400 dark:bg-zinc-600",
    text: "text-zinc-500 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-900",
    border: "border-zinc-200 dark:border-zinc-800",
  },
};

export function StatusBadge({ status }: Readonly<{ status: EscrowStatus }>) {
  const state = STATE[status] ?? STATE.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-2xs transition-colors ${state.bg} ${state.border} ${state.text}`}
    >
      <span className={`size-1.5 rounded-full ${state.dot}`} aria-hidden />
      {state.label}
    </span>
  );
}

export const STATUS_LABEL = Object.fromEntries(
  Object.entries(STATE).map(([key, value]) => [key, value.label]),
) as Record<EscrowStatus, string>;
