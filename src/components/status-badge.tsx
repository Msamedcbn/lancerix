import type { Enums } from "@/lib/supabase/database.types";

type EscrowStatus = Enums<"escrow_status">;

/**
 * A state, not a chip. A dot plus a word reads faster than a filled pill, and
 * it does not compete with the amount next to it for attention.
 *
 * The vocabulary is the state machine's, in the words a Turkish freelancer or
 * a finance department would actually use.
 */
const STATE: Record<EscrowStatus, { label: string; dot: string; text: string }> = {
  DRAFT: {
    label: "Taslak",
    dot: "bg-zinc-300 dark:bg-zinc-600",
    text: "text-zinc-500 dark:text-zinc-400",
  },
  AWAITING_PAYMENT: {
    label: "Ödeme bekleniyor",
    dot: "bg-amber-400",
    text: "text-amber-700 dark:text-amber-400",
  },
  IN_PROGRESS: {
    label: "Devam ediyor",
    dot: "bg-sky-400",
    text: "text-sky-700 dark:text-sky-400",
  },
  SUBMITTED: {
    label: "Teslim edildi",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Onaylandı",
    dot: "bg-brand",
    text: "text-brand",
  },
  RELEASED: {
    label: "Ödendi",
    dot: "bg-brand",
    text: "text-brand",
  },
  DISPUTED: {
    label: "İtirazlı",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
  },
  CANCELLED: {
    label: "İptal edildi",
    dot: "bg-zinc-300 dark:bg-zinc-700",
    text: "text-zinc-400 dark:text-zinc-500",
  },
};

export function StatusBadge({ status }: Readonly<{ status: EscrowStatus }>) {
  const state = STATE[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${state.text}`}
    >
      <span className={`size-1.5 rounded-full ${state.dot}`} aria-hidden />
      {state.label}
    </span>
  );
}

export const STATUS_LABEL = Object.fromEntries(
  Object.entries(STATE).map(([key, value]) => [key, value.label]),
) as Record<EscrowStatus, string>;
