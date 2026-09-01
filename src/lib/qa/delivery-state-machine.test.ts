/**
 * Guards the delivery state machine's "change both together" rule.
 *
 * DELIVERY_TRANSITIONS in TypeScript and delivery_status_transitions in
 * Postgres describe the same edges. Postgres is the one that enforces them, so
 * drift here does not corrupt data -- it shows the client a button the server
 * will refuse, or hides one it would have allowed. Both are bugs; this test
 * fails the build when either side moves alone.
 *
 * Reads SQL as text, like schema-mirror.test.ts. It cannot prove the server
 * parses or runs, only that the two definitions agree.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  canActorTransitionDelivery,
  canTransitionDelivery,
  DELIVERY_TERMINAL,
  DELIVERY_TRANSITIONS,
  type DeliveryStatus,
} from "@/lib/qa/delivery-state-machine";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../../supabase/migrations", import.meta.url),
);

const SQL = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(path.join(MIGRATIONS_DIR, f), "utf8"))
  .join("\n")
  .replace(/--[^\n]*/g, "");

function lastMatch(re: RegExp, label: string): RegExpMatchArray {
  const all = [...SQL.matchAll(re)];
  if (all.length === 0) throw new Error(`no SQL match for ${label}`);
  return all[all.length - 1]!;
}

const STATUSES = Object.keys(DELIVERY_TRANSITIONS) as DeliveryStatus[];

describe("delivery state machine mirror", () => {
  it("declares the same statuses in the enum as in TypeScript", () => {
    const body = lastMatch(
      /create type public\.delivery_status as enum \(([\s\S]*?)\);/g,
      "delivery_status enum",
    )[1]!;
    const fromSql = [...body.matchAll(/'(\w+)'/g)].map((m) => m[1]);

    // Sorted, because the TS record's key order is not meaningful the way the
    // Postgres enum's declaration order is.
    expect([...fromSql].sort()).toEqual([...STATUSES].sort());
  });

  it("declares exactly the same legal edges on both sides", () => {
    const block = lastMatch(
      /insert into public\.delivery_status_transitions \(from_status, to_status\) values([\s\S]*?);/g,
      "delivery_status_transitions seed",
    )[1]!;

    const fromSql = [...block.matchAll(/\(\s*'(\w+)'\s*,\s*'(\w+)'\s*\)/g)]
      .map((m) => `${m[1]} -> ${m[2]}`)
      .sort();

    const fromTs = STATUSES.flatMap((from) =>
      DELIVERY_TRANSITIONS[from].map((to) => `${from} -> ${to}`),
    ).sort();

    expect(fromSql).toEqual(fromTs);
  });

  it("seeds no edge that leaves a terminal status", () => {
    const block = lastMatch(
      /insert into public\.delivery_status_transitions \(from_status, to_status\) values([\s\S]*?);/g,
      "delivery_status_transitions seed",
    )[1]!;
    const froms = [...block.matchAll(/\(\s*'(\w+)'\s*,/g)].map((m) => m[1]);

    for (const terminal of DELIVERY_TERMINAL) {
      expect(froms).not.toContain(terminal);
    }
  });

  it("keeps the delivery ledger append-only, like escrow_transactions", () => {
    expect(SQL).toMatch(/create trigger delivery_events_immutable/);
    // A select policy exists; update and delete policies must not.
    expect(SQL).toMatch(/create policy delivery_events_select on public\.delivery_events/);
    expect(SQL).not.toMatch(
      /create policy \w+ on public\.delivery_events\s+for (update|delete)/,
    );
  });

  it("guards the status column so the record cannot fall out of step", () => {
    expect(SQL).toMatch(/create trigger deliveries_guard_status/);
    expect(SQL).toMatch(/app\.delivery_transition/);
  });
});

describe("canTransitionDelivery", () => {
  it("allows the Tier 1 shortcut and the Tier 2/3 queue", () => {
    expect(canTransitionDelivery("SUBMITTED", "AWAITING_CLIENT")).toBe(true);
    expect(canTransitionDelivery("SUBMITTED", "QA_QUEUED")).toBe(true);
  });

  it("refuses to skip the client's window", () => {
    expect(canTransitionDelivery("SUBMITTED", "ACCEPTED")).toBe(false);
    expect(canTransitionDelivery("QA_DONE", "ACCEPTED")).toBe(false);
  });

  it("lets a rejected delivery be reworked, but an accepted one is final", () => {
    expect(canTransitionDelivery("REJECTED", "SUBMITTED")).toBe(true);
    expect(canTransitionDelivery("ACCEPTED", "SUBMITTED")).toBe(false);
  });
});

describe("canActorTransitionDelivery", () => {
  const client = { isClient: true, isFreelancer: false };
  const freelancer = { isClient: false, isFreelancer: true };

  it("gives acceptance to the client alone", () => {
    expect(canActorTransitionDelivery({ to: "ACCEPTED", ...client })).toBe(true);
    expect(canActorTransitionDelivery({ to: "ACCEPTED", ...freelancer })).toBe(false);
    expect(canActorTransitionDelivery({ to: "REJECTED", ...freelancer })).toBe(false);
  });

  it("gives delivery and tier choice to the freelancer alone", () => {
    expect(canActorTransitionDelivery({ to: "QA_QUEUED", ...freelancer })).toBe(true);
    expect(canActorTransitionDelivery({ to: "QA_QUEUED", ...client })).toBe(false);
    expect(canActorTransitionDelivery({ to: "SUBMITTED", ...client })).toBe(false);
  });

  it("lets neither party declare QA finished", () => {
    expect(canActorTransitionDelivery({ to: "QA_DONE", ...client })).toBe(false);
    expect(canActorTransitionDelivery({ to: "QA_DONE", ...freelancer })).toBe(false);
    // The QA desk can, which is how a Tier 3 report lands.
    expect(
      canActorTransitionDelivery({ to: "QA_DONE", ...client, isAdmin: true }),
    ).toBe(true);
  });
});
