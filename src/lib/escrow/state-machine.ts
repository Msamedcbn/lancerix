import { z } from "zod";

import type { Enums } from "@/lib/supabase/database.types";

export type EscrowStatus = Enums<"escrow_status">;

export const ESCROW_STATUSES = [
  "DRAFT",
  "AWAITING_PAYMENT",
  "IN_PROGRESS",
  "SUBMITTED",
  "COMPLETED",
  "RELEASED",
  "DISPUTED",
  "CANCELLED",
] as const satisfies readonly EscrowStatus[];

export const escrowStatusSchema = z.enum(ESCROW_STATUSES);

/**
 * The only legal edges. Anything not listed here is rejected before a write,
 * so a state transition can never be introduced by a stray update.
 */
const TRANSITIONS: Record<EscrowStatus, readonly EscrowStatus[]> = {
  DRAFT: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["SUBMITTED", "DISPUTED", "CANCELLED"],
  SUBMITTED: ["COMPLETED", "IN_PROGRESS", "DISPUTED"],
  COMPLETED: ["RELEASED", "DISPUTED"],
  RELEASED: [],
  DISPUTED: ["RELEASED", "CANCELLED"],
  CANCELLED: [],
};

/** Funds are held by the gateway and cannot be refunded without a reversal. */
export const FUNDED_STATUSES: readonly EscrowStatus[] = [
  "IN_PROGRESS",
  "SUBMITTED",
  "COMPLETED",
  "DISPUTED",
];

export const TERMINAL_STATUSES: readonly EscrowStatus[] = [
  "RELEASED",
  "CANCELLED",
];

export function canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedTransitions(
  from: EscrowStatus,
): readonly EscrowStatus[] {
  return TRANSITIONS[from];
}

export class EscrowTransitionError extends Error {
  constructor(
    readonly from: EscrowStatus,
    readonly to: EscrowStatus,
  ) {
    super(`Illegal escrow transition ${from} -> ${to}`);
    this.name = "EscrowTransitionError";
  }
}

export function assertTransition(from: EscrowStatus, to: EscrowStatus): void {
  if (!canTransition(from, to)) throw new EscrowTransitionError(from, to);
}
