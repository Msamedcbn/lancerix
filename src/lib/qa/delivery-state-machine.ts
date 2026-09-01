import type { Enums } from "@/lib/supabase/database.types";

export type DeliveryStatus = Enums<"delivery_status">;

/**
 * The legal moves a delivery may make.
 *
 * This mirrors delivery_status_transitions in
 * supabase/migrations/20260901040000_delivery_state_machine.sql. Postgres is
 * the one that enforces it -- transition_delivery() refuses an edge that is
 * not in the table -- so the worst a mismatch here can do is hide a button or
 * show one that errors. Change both together; schema-mirror.test.ts fails if
 * they drift.
 */
export const DELIVERY_TRANSITIONS: Readonly<
  Record<DeliveryStatus, readonly DeliveryStatus[]>
> = {
  // Tier 1 buys no QA run, so it goes straight to the client.
  SUBMITTED: ["AWAITING_CLIENT", "QA_QUEUED"],
  QA_QUEUED: ["QA_DONE"],
  QA_DONE: ["AWAITING_CLIENT"],
  AWAITING_CLIENT: ["ACCEPTED", "REJECTED"],
  // A rejected delivery is reworked and handed over again.
  REJECTED: ["SUBMITTED"],
  ACCEPTED: [],
};

/** Statuses from which nothing further can happen. */
export const DELIVERY_TERMINAL: readonly DeliveryStatus[] = ["ACCEPTED"];

export function canTransitionDelivery(
  from: DeliveryStatus,
  to: DeliveryStatus,
): boolean {
  return DELIVERY_TRANSITIONS[from].includes(to);
}

/**
 * Whether a party may make a move, mirroring
 * can_actor_transition_delivery(). QA_DONE is absent on purpose: neither
 * party may declare QA finished, only the Tier 2 agent (service role) or the
 * Tier 3 desk (admin).
 */
export function canActorTransitionDelivery({
  to,
  isClient,
  isFreelancer,
  isAdmin = false,
}: Readonly<{
  to: DeliveryStatus;
  isClient: boolean;
  isFreelancer: boolean;
  isAdmin?: boolean;
}>): boolean {
  if (isAdmin) return true;
  if (to === "ACCEPTED" || to === "REJECTED") return isClient;
  if (to === "QA_QUEUED" || to === "SUBMITTED") return isFreelancer;
  if (to === "AWAITING_CLIENT") return isFreelancer;
  return false;
}

const LABELS: Record<DeliveryStatus, string> = {
  SUBMITTED: "Teslim edildi",
  QA_QUEUED: "QA kuyruğunda",
  QA_DONE: "QA tamamlandı",
  AWAITING_CLIENT: "Müşteri kontrolünde",
  ACCEPTED: "Kabul edildi",
  REJECTED: "İtiraz edildi",
};

export const deliveryStatusLabel = (status: DeliveryStatus): string =>
  LABELS[status];
