import { describe, expect, it } from "vitest";

import {
  allowedTransitions,
  assertTransition,
  canTransition,
  ESCROW_STATUSES,
  EscrowTransitionError,
  FUNDED_STATUSES,
  TERMINAL_STATUSES,
} from "@/lib/escrow/state-machine";

describe("escrow state machine", () => {
  it("walks the documented happy path end to end", () => {
    const path = [
      "DRAFT",
      "AWAITING_PAYMENT",
      "IN_PROGRESS",
      "SUBMITTED",
      "COMPLETED",
      "RELEASED",
    ] as const;

    for (const [from, to] of path.slice(0, -1).map(
      (status, i) => [status, path[i + 1]] as const,
    )) {
      expect(to).toBeDefined();
      expect(canTransition(from, to!)).toBe(true);
    }
  });

  it("refuses to skip funding", () => {
    expect(canTransition("DRAFT", "IN_PROGRESS")).toBe(false);
    expect(canTransition("AWAITING_PAYMENT", "COMPLETED")).toBe(false);
    expect(canTransition("DRAFT", "RELEASED")).toBe(false);
  });

  it("refuses to release money that was never submitted or accepted", () => {
    expect(canTransition("IN_PROGRESS", "RELEASED")).toBe(false);
    expect(canTransition("SUBMITTED", "RELEASED")).toBe(false);
  });

  it("lets a rejected submission go back for rework", () => {
    expect(canTransition("SUBMITTED", "IN_PROGRESS")).toBe(true);
  });

  it("cannot cancel delivered work outright -- it has to go through a dispute", () => {
    // Once the freelancer has delivered, the client's remedy is DISPUTED, not a
    // unilateral cancellation. IN_PROGRESS and DISPUTED stay cancellable so an
    // admin can refund; can_actor_transition() in the migration restricts those
    // two edges to admins.
    expect(canTransition("SUBMITTED", "CANCELLED")).toBe(false);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransition("IN_PROGRESS", "CANCELLED")).toBe(true);
    expect(canTransition("DISPUTED", "CANCELLED")).toBe(true);
  });

  it("keeps every funded status one step away from a dispute", () => {
    for (const status of FUNDED_STATUSES) {
      if (status === "DISPUTED") continue;
      expect(canTransition(status, "DISPUTED")).toBe(true);
    }
  });

  it("treats RELEASED and CANCELLED as terminal", () => {
    for (const status of TERMINAL_STATUSES) {
      expect(allowedTransitions(status)).toHaveLength(0);
    }
  });

  it("resolves a dispute only by releasing or cancelling", () => {
    expect([...allowedTransitions("DISPUTED")].sort()).toEqual([
      "CANCELLED",
      "RELEASED",
    ]);
  });

  it("never allows a self-transition", () => {
    for (const status of ESCROW_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("declares an edge list for every status", () => {
    for (const status of ESCROW_STATUSES) {
      expect(allowedTransitions(status)).toBeDefined();
    }
  });

  it("throws a typed error on an illegal edge", () => {
    expect(() => assertTransition("DRAFT", "RELEASED")).toThrow(EscrowTransitionError);
    expect(() => assertTransition("DRAFT", "AWAITING_PAYMENT")).not.toThrow();
  });
});
