/**
 * Guards the two "change both together" rules in CLAUDE.md.
 *
 * The escrow state machine and the money split each live in two mirrored
 * places -- TypeScript and Postgres -- and until now nothing but discipline
 * kept them in step. These tests read the migrations off disk and fail the
 * build when one side moves without the other.
 *
 * What this does NOT do: run Postgres. It reads SQL as text, so it cannot
 * catch a syntax error or prove the server rounds the way we think. What it
 * can do is prove the two definitions describe the same edges, the same
 * arithmetic and the same limits -- which is where drift actually happens.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  applyBps,
  BPS_DIVISOR,
  computeEscrowSplit,
  DEFAULT_PLATFORM_FEE_BPS,
  type EscrowSplit,
  MAX_PLATFORM_FEE_BPS,
  MIN_MILESTONE_GROSS_KURUS,
} from "@/lib/escrow/money";
import { ESCROW_STATUSES, type EscrowStatus, allowedTransitions } from "@/lib/escrow/state-machine";

const MIGRATIONS_DIR = fileURLToPath(new URL("../../../supabase/migrations", import.meta.url));

/**
 * All migrations concatenated in filename order, with `--` comments stripped
 * so a commented-out edge never counts as a live one. Where a later migration
 * redefines something, the last match wins -- the same rule Postgres applies.
 */
const SQL = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(path.join(MIGRATIONS_DIR, f), "utf8"))
  .join("\n")
  .replace(/--[^\n]*/g, "");

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

function lastMatch(re: RegExp, label: string): RegExpMatchArray {
  const all = [...SQL.matchAll(re)];
  if (all.length === 0) throw new Error(`no SQL match for ${label}`);
  return all[all.length - 1]!;
}

/** Every `create table public.X (...)` in the migrations, as [name, body]. */
function tableBodies(): Array<[string, string]> {
  return [...SQL.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)].map(
    (m) => [m[1]!, m[2]!] as [string, string],
  );
}

function tableBody(table: string): string {
  return lastMatch(
    new RegExp(String.raw`create table public\.${table} \(([\s\S]*?)\n\);`, "g"),
    `table ${table}`,
  )[1]!;
}

describe("state machine mirror", () => {
  it("declares the same statuses in the enum as in TypeScript", () => {
    const body = lastMatch(
      /create type public\.escrow_status as enum \(([\s\S]*?)\);/g,
      "escrow_status enum",
    )[1]!;
    const fromSql = [...body.matchAll(/'(\w+)'/g)].map((m) => m[1]);

    // Order matters too: the enum's order is its sort order in Postgres.
    expect(fromSql).toEqual([...ESCROW_STATUSES]);
  });

  it("declares exactly the same legal edges on both sides", () => {
    const block = lastMatch(
      /insert into public\.escrow_status_transitions \(from_status, to_status\) values([\s\S]*?);/g,
      "escrow_status_transitions seed",
    )[1]!;

    const fromSql = [...block.matchAll(/\(\s*'(\w+)'\s*,\s*'(\w+)'\s*\)/g)]
      .map((m) => `${m[1]} -> ${m[2]}`)
      .sort();

    const fromTs = ESCROW_STATUSES.flatMap((from) =>
      allowedTransitions(from).map((to) => `${from} -> ${to}`),
    ).sort();

    // Compared as sorted lists rather than sets, so a duplicated SQL row is a
    // failure too -- the primary key would reject it, but the seed should not
    // rely on that.
    expect(fromSql).toEqual(fromTs);
  });

  it("seeds no edge that leaves a terminal status", () => {
    // Cheap sanity check on the seed itself, independent of the TS side.
    const block = lastMatch(
      /insert into public\.escrow_status_transitions \(from_status, to_status\) values([\s\S]*?);/g,
      "escrow_status_transitions seed",
    )[1]!;
    const froms = [...block.matchAll(/\(\s*'(\w+)'\s*,/g)].map((m) => m[1]);

    expect(froms).not.toContain("RELEASED");
    expect(froms).not.toContain("CANCELLED");
  });
});

/**
 * Turns one generated-column expression into a JS function so it can be
 * evaluated against the same inputs as money.ts.
 *
 * The expression is checked against a strict allowlist first: only the three
 * column names, integer literals, `+`, `-`, parentheses, commas and the exact
 * token `public.apply_bps` may appear. Anything else -- a subquery, a cast, a
 * second function -- fails the test rather than being executed. The source is
 * a file in this repository, and this only ever runs under vitest.
 */
function compileSqlExpression(expr: string): (args: {
  gross: number;
  feeBps: number;
  stopajBps: number;
}) => number {
  const allowed = /^[\s\w.,()+-]*$/;
  if (!allowed.test(expr)) {
    throw new Error(`unexpected syntax in generated column expression: ${expr}`);
  }

  const js = expr.replace(/public\.apply_bps/g, "applyBps");
  const identifiers = [...js.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)].map((m) => m[0]);
  const known = new Set(["applyBps", "gross_amount_kurus", "platform_fee_bps", "stopaj_bps"]);
  for (const id of identifiers) {
    if (!known.has(id)) throw new Error(`unknown identifier "${id}" in expression: ${expr}`);
  }

  const fn = new Function(
    "applyBps",
    "gross_amount_kurus",
    "platform_fee_bps",
    "stopaj_bps",
    `return (${js});`,
  ) as (
    a: typeof applyBps,
    gross: number,
    feeBps: number,
    stopajBps: number,
  ) => number;

  return ({ gross, feeBps, stopajBps }) => fn(applyBps, gross, feeBps, stopajBps);
}

function generatedColumns(): Map<string, string> {
  const body = tableBody("milestones");
  const found = new Map<string, string>();
  for (const m of body.matchAll(
    /(\w+)\s+bigint\s+generated\s+always\s+as\s*\(([\s\S]*?)\)\s*stored/g,
  )) {
    found.set(m[1]!, squash(m[2]!));
  }
  return found;
}

describe("money mirror", () => {
  it("keeps the rounding rule in apply_bps identical to applyBps", () => {
    const body = lastMatch(
      /create or replace function public\.apply_bps\(amount bigint, bps integer\)[\s\S]*?\$\$([\s\S]*?)\$\$/g,
      "apply_bps body",
    )[1]!;

    // round() is half-away-from-zero, which for non-negative amounts is the
    // half-up that applyBps implements. The divisor must be BPS_DIVISOR.
    expect(squash(body)).toBe(`select round(amount::numeric * bps / ${BPS_DIVISOR})::bigint;`);
  });

  it("defines exactly the four money columns as generated", () => {
    expect([...generatedColumns().keys()].sort()).toEqual([
      "client_charge_kurus",
      "freelancer_net_kurus",
      "platform_fee_kurus",
      "tax_withholding_kurus",
    ]);
  });

  it("computes the same split as money.ts, for every column and rate", () => {
    const columns = generatedColumns();
    const compiled = new Map(
      [...columns].map(([name, expr]) => [name, compileSqlExpression(expr)] as const),
    );

    const amounts = [1, 7, 99, 12_345, MIN_MILESTONE_GROSS_KURUS, 1_000_000, 8_000_000_099];
    const feeRates = [0, 1, 250, DEFAULT_PLATFORM_FEE_BPS, MAX_PLATFORM_FEE_BPS];
    const stopajRates = [0, 1500, 2000, 10_000];

    for (const gross of amounts) {
      for (const feeBps of feeRates) {
        for (const stopajBps of stopajRates) {
          const ts = computeEscrowSplit({ grossKurus: gross, platformFeeBps: feeBps, stopajBps });
          const at = { gross, feeBps, stopajBps };
          const where = `gross=${gross} fee=${feeBps} stopaj=${stopajBps}`;

          expect(compiled.get("platform_fee_kurus")!(at), where).toBe(ts.platformFeeKurus);
          expect(compiled.get("client_charge_kurus")!(at), where).toBe(ts.clientChargeKurus);
          expect(compiled.get("tax_withholding_kurus")!(at), where).toBe(ts.taxWithholdingKurus);
          expect(compiled.get("freelancer_net_kurus")!(at), where).toBe(ts.freelancerNetKurus);
        }
      }
    }
  });

  it("agrees with money.ts across the whole low-value rounding space", () => {
    const columns = generatedColumns();
    const fee = compileSqlExpression(columns.get("platform_fee_kurus")!);
    const charge = compileSqlExpression(columns.get("client_charge_kurus")!);
    const net = compileSqlExpression(columns.get("freelancer_net_kurus")!);

    for (let gross = 1; gross <= 3_000; gross += 1) {
      const at = { gross, feeBps: DEFAULT_PLATFORM_FEE_BPS, stopajBps: 2000 };
      const ts = computeEscrowSplit({ grossKurus: gross, stopajBps: 2000 });

      expect(fee(at), `gross=${gross}`).toBe(ts.platformFeeKurus);
      expect(charge(at), `gross=${gross}`).toBe(ts.clientChargeKurus);
      expect(net(at), `gross=${gross}`).toBe(ts.freelancerNetKurus);
    }
  });
});

describe("limit mirror", () => {
  it("uses the same platform fee ceiling everywhere it is constrained", () => {
    const ceilings = [...SQL.matchAll(/platform_fee_bps between 0 and (\d+)/g)].map((m) =>
      Number(m[1]),
    );

    // contracts, coupons and milestones all constrain the rate.
    expect(ceilings.length).toBeGreaterThanOrEqual(3);
    for (const c of ceilings) expect(c).toBe(MAX_PLATFORM_FEE_BPS);
  });

  it("defaults the contract fee rate to the TypeScript default", () => {
    const m = lastMatch(/platform_fee_bps integer not null default (\d+)/g, "contract fee default");
    expect(Number(m[1])).toBe(DEFAULT_PLATFORM_FEE_BPS);
  });

  it("enforces the same milestone minimum as money.ts", () => {
    const m = lastMatch(/gross_amount_kurus >= (\d+)/g, "milestone minimum");
    expect(Number(m[1])).toBe(MIN_MILESTONE_GROSS_KURUS);
  });
});

describe("ledger mirror", () => {
  /**
   * Every figure the split produces has to be snapshotted, so the append-only
   * ledger can be read back without knowing which pricing model was in force.
   * The type annotation makes the compiler demand an entry for any new field;
   * the test then demands the column.
   */
  const LEDGER_COLUMN_FOR: Record<keyof EscrowSplit, string> = {
    grossKurus: "gross_amount_kurus",
    platformFeeKurus: "platform_fee_kurus",
    clientChargeKurus: "client_charge_kurus",
    taxWithholdingKurus: "tax_withholding_kurus",
    freelancerNetKurus: "freelancer_net_kurus",
  };

  it("snapshots every figure of the split", () => {
    const body = tableBody("escrow_transactions");
    for (const column of Object.values(LEDGER_COLUMN_FOR)) {
      expect(body, `escrow_transactions.${column}`).toMatch(
        new RegExp(String.raw`\n\s*${column} bigint not null`),
      );
    }
  });

  it("writes every snapshot column inside transition_milestone", () => {
    const fn = lastMatch(
      /insert into public\.escrow_transactions \(([\s\S]*?)\) values \(([\s\S]*?)\);/g,
      "transition_milestone ledger insert",
    );
    const columns = squash(fn[1]!);
    const values = squash(fn[2]!);

    for (const column of Object.values(LEDGER_COLUMN_FOR)) {
      expect(columns, `insert column list is missing ${column}`).toContain(column);
      expect(values, `insert values are missing v_milestone.${column}`).toContain(
        `v_milestone.${column}`,
      );
    }
  });
});

describe("status coverage", () => {
  it("names every TypeScript status somewhere in the schema", () => {
    // Catches a status added to the enum in TS but never seeded or referenced.
    for (const status of ESCROW_STATUSES as readonly EscrowStatus[]) {
      expect(SQL, `status ${status} never appears in SQL`).toContain(`'${status}'`);
    }
  });
});

describe("nullable column checks", () => {
  it("guards every function-backed CHECK on a nullable column against NULL", () => {
    // A CHECK passes on TRUE or NULL and fails on FALSE. The is_valid_* helpers
    // return FALSE for an absent value -- deliberately, so they mirror the
    // TypeScript validators -- which means a nullable column whose CHECK calls
    // one rejects every row that leaves it unset. Not hypothetical:
    // profiles.tckn shipped this way and made sign-up fail for everyone with
    // "Database error saving new user".
    const offenders: string[] = [];

    for (const [table, body] of tableBodies()) {
      for (const raw of body.split("\n")) {
        const line = raw.trim();
        if (!/\bcheck\s*\(/i.test(line)) continue;
        // Only function-backed checks: a bare regex or range applied to NULL
        // yields NULL, which passes, so those are safe as written.
        if (!/public\.\w+\s*\(/.test(line)) continue;

        const column = /^(\w+)\s/.exec(line)?.[1];
        if (!column) continue;
        if (/\bnot null\b/i.test(line)) continue;

        const guarded = new RegExp(String.raw`\b${column}\s+is\s+null\s+or\b`, "i");
        if (guarded.test(line)) continue;

        offenders.push(`${table}.${column}`);
      }
    }

    expect(offenders, "nullable columns whose CHECK rejects NULL").toEqual([]);
  });
});
