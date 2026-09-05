import "server-only";

/**
 * Shared "how stale is this" scale. Originally admin-only
 * (admin-dashboard.ts); pulled out so the freelancer/client "needs your
 * action" list (contracts.ts) uses the same thresholds instead of a second,
 * silently-drifting copy.
 */
export const STALE_AMBER_DAYS = 3;
export const STALE_RED_DAYS = 7;

/** Amber past STALE_AMBER_DAYS un-actioned, red past STALE_RED_DAYS. */
export function stalenessLevel(oldestAt: string | null): "none" | "amber" | "red" {
  if (!oldestAt) return "none";
  const ageDays = (Date.now() - new Date(oldestAt).getTime()) / 86_400_000;
  if (ageDays >= STALE_RED_DAYS) return "red";
  if (ageDays >= STALE_AMBER_DAYS) return "amber";
  return "none";
}

/**
 * The inverse shape: a countdown to a deadline instead of an age since
 * creation. Mirrors the red/amber thresholds contracts/[id]/page.tsx's
 * Countdown and ReviewCountdown components already use inline (days <= 2 is
 * red there) so the dashboard list and the contract page agree on what
 * counts as urgent.
 *
 * The red threshold is deliberately the same 2 days as
 * REMINDER_WINDOW_HOURS (48) in /api/cron/remind-pending-review: the row
 * turns red in the dashboard on the same pass that sends the reminder email,
 * so the two channels never contradict each other. Amber is the earlier,
 * quieter warning the email has no equivalent of. If that cron's window
 * moves, move DEADLINE_RED_DAYS with it.
 */
export const DEADLINE_RED_DAYS = 2;
export const DEADLINE_AMBER_DAYS = 4;

export function deadlineUrgency(deadline: string | null): "none" | "amber" | "red" {
  if (!deadline) return "none";
  const daysLeft = (Date.parse(deadline) - Date.now()) / 86_400_000;
  if (daysLeft <= DEADLINE_RED_DAYS) return "red";
  if (daysLeft <= DEADLINE_AMBER_DAYS) return "amber";
  return "none";
}
