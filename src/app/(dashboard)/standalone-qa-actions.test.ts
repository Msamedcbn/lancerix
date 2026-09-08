/**
 * createStandaloneCheck/payStandaloneCheck: no acceptance_criteria, no
 * contract, no RPC -- these write straight to standalone_qa_orders/
 * standalone_qa_reports via the ordinary table client, gated only by
 * requireSession(). What's worth proving in TS: a bad URL never reaches the
 * DB, a failed page load never writes a report, a report writes exactly
 * once via the service-role client (not the user's own, which has no
 * insert policy on standalone_qa_reports), and payStandaloneCheck refuses a
 * non-PENDING order before calling Polar.
 */
import { createHash } from "crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const session = {
  userId: "00000000-0000-0000-0000-000000000001",
  email: "user@example.com",
  fullName: "Test Kullanıcı",
  role: "FREELANCER" as const,
  publicId: "ABCD1234",
};
vi.mock("@/lib/auth/session", () => ({
  requireSession: vi.fn(async () => session),
}));

let checkImpl: () => Promise<unknown>;
/** Set by tests that need a multi-module package result (mixed success and
 * failure); otherwise the single-module shape derived from checkImpl. */
let packageImpl: (() => Promise<{ checkType: string; outcome: unknown }[]>) | null;
vi.mock("@/lib/qa/standalone", () => ({
  runStandaloneCheck: vi.fn(async () => checkImpl()),
  runStandalonePackage: vi.fn(async () => {
    if (packageImpl) return packageImpl();
    const outcome = await checkImpl();
    return outcome ? [{ checkType: "ACCESSIBILITY", outcome }] : [];
  }),
  hashResults: (results: unknown) =>
    createHash("sha256").update(JSON.stringify(results)).digest("hex"),
}));

// payViaPolarCheckout itself isn't re-tested here (it's a thin, generic
// helper in polar.ts) -- mocked to simulate its real observable contract
// (call the caller's createCheckout, then "redirect" by throwing) without
// importing the real polar.ts, whose @polar-sh/sdk import chain is heavy
// enough to risk the default 5s test timeout on a cold run (same reasoning
// qa-actions.test.ts's @/lib/polar mock already documents).
const createCheckoutMock = vi.fn(async (..._args: unknown[]) => "https://polar.sh/mock-checkout");
vi.mock("@/lib/polar", () => ({
  createStandaloneOrderCheckout: createCheckoutMock,
  payViaPolarCheckout: vi.fn(async (createCheckout: (ip?: string) => Promise<string>) => {
    let url: string;
    try {
      url = await createCheckout(undefined);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Ödeme linki oluşturulamadı." };
    }
    throw new Error(`REDIRECT:${url}`);
  }),
}));

type OrderInsertRoute = () => { data: unknown; error: { message: string } | null };
type OrderSelectRoute = () => { data: unknown; error: { message: string } | null };
type OrderCountRoute = () => { count: number | null; error: { message: string } | null };
let orderInsertRoute: OrderInsertRoute;
let orderSelectRoute: OrderSelectRoute;
let orderCountRoute: OrderCountRoute;
let reportInsertCalls: Record<string, unknown>[];
let reportInsertRoute: () => { error: { message: string } | null };

function userClient() {
  return {
    from: (table: string) => {
      if (table !== "standalone_qa_orders") throw new Error(`unexpected table: ${table}`);
      return {
        insert: (_row: Record<string, unknown>) => ({
          select: () => ({ single: async () => orderInsertRoute() }),
        }),
        select: (_cols: string, _opts?: unknown) => ({
          eq: (_col: string, _val: string) => ({
            single: async () => orderSelectRoute(),
            maybeSingle: async () => orderSelectRoute(),
            gte: async (_col2: string, _val2: string) => orderCountRoute(),
          }),
        }),
      };
    },
  };
}

function adminClient() {
  return {
    from: (table: string) => {
      if (table !== "standalone_qa_reports") throw new Error(`unexpected table: ${table}`);
      return {
        insert: (row: Record<string, unknown> | Record<string, unknown>[]) => {
          if (Array.isArray(row)) {
            reportInsertCalls.push(...row);
          } else {
            reportInsertCalls.push(row);
          }
          return Promise.resolve(reportInsertRoute());
        },
      };
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => userClient()) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn(() => adminClient()) }));

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  reportInsertCalls = [];
  packageImpl = null;
  orderInsertRoute = () => ({ data: { id: "order-1" }, error: null });
  orderCountRoute = () => ({ count: 0, error: null });
  reportInsertRoute = () => ({ error: null });
  checkImpl = async () => ({
    status: "PASS",
    results: { violationCount: 0, passCount: 10, violations: [] },
    documentSha256: "a".repeat(64),
  });
  createCheckoutMock.mockClear();
});

describe("createStandaloneCheck", () => {
  it("refuses a non-http(s) URL without touching the database", async () => {
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "not-a-url", packageId: "BASIC" }),
    );
    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });

  it("creates an order and reports on a successful scan", async () => {
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", packageId: "BASIC" }),
    );
    expect(result.error).toBeNull();
    expect(reportInsertCalls).toHaveLength(1);
    expect(reportInsertCalls[0]).toMatchObject({ order_id: "order-1", status: "PASS" });
  });

  it("fails without writing a report when the page can't be loaded", async () => {
    checkImpl = async () => null;
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", packageId: "BASIC" }),
    );
    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });

  it("records every module in the package, failed ones as ERROR", async () => {
    // A module that could not run must still leave a row: without it a paid
    // 3-module package silently ships as a 1-module report that looks whole.
    packageImpl = async () => [
      {
        checkType: "ACCESSIBILITY",
        outcome: { status: "PASS", results: { violationCount: 0 }, documentSha256: "a".repeat(64) },
      },
      { checkType: "SEO_META", outcome: null },
      { checkType: "DEAD_LINKS", outcome: null },
    ];
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", packageId: "BASIC" }),
    );

    expect(result.error).toBeNull();
    expect(reportInsertCalls).toHaveLength(3);
    expect(reportInsertCalls.map((r) => [r.check_type, r.status])).toEqual([
      ["ACCESSIBILITY", "PASS"],
      ["SEO_META", "ERROR"],
      ["DEAD_LINKS", "ERROR"],
    ]);
    // ERROR rows are sealed like any other -- the column is NOT NULL and
    // constrained to 64 hex chars, so an unsealed row would be rejected.
    for (const row of reportInsertCalls.filter((r) => r.status === "ERROR")) {
      expect(row.results).toEqual({ error: "MODULE_FAILED" });
      expect(row.document_sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("writes no report at all when every module fails", async () => {
    packageImpl = async () => [
      { checkType: "ACCESSIBILITY", outcome: null },
      { checkType: "SEO_META", outcome: null },
    ];
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", packageId: "BASIC" }),
    );

    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });

  it("surfaces an order-insert failure without running the scan", async () => {
    orderInsertRoute = () => ({ data: null, error: { message: "insert failed" } });
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", packageId: "BASIC" }),
    );
    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });

  it("refuses once the daily cap is reached, without inserting an order", async () => {
    const { STANDALONE_DAILY_LIMIT } = await import("@/lib/validations/standalone-qa");
    orderCountRoute = () => ({ count: STANDALONE_DAILY_LIMIT, error: null });
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", packageId: "BASIC" }),
    );
    expect(result.error).toBeTruthy();
  });

  it("surfaces a report-insert failure after a successful scan", async () => {
    reportInsertRoute = () => ({ error: { message: "insert failed" } });
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", packageId: "BASIC" }),
    );
    expect(result.error).toBeTruthy();
  });
});

describe("payStandaloneCheck", () => {
  it("redirects to a Polar checkout for a PENDING order", async () => {
    orderSelectRoute = () => ({
      data: { id: "order-1", package_id: "BASIC", fee_kurus: 19900, payment_status: "PENDING" },
      error: null,
    });
    const { payStandaloneCheck } = await import("./standalone-qa-actions");
    await expect(
      payStandaloneCheck({ error: null }, formData({ orderId: "order-1" })),
    ).rejects.toThrow("REDIRECT:https://polar.sh/mock-checkout");
    expect(createCheckoutMock).toHaveBeenCalledWith("order-1", 19900, "BASIC", undefined);
  });

  it("refuses an already-paid order before calling Polar", async () => {
    orderSelectRoute = () => ({
      data: { id: "order-1", package_id: "BASIC", fee_kurus: 19900, payment_status: "PAID" },
      error: null,
    });
    const { payStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await payStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));
    expect(result.error).toBeTruthy();
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it("refuses a missing orderId before touching the database", async () => {
    const { payStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await payStandaloneCheck({ error: null }, formData({}));
    expect(result.error).toBeTruthy();
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it("refuses when the order can't be found", async () => {
    orderSelectRoute = () => ({ data: null, error: { message: "not found" } });
    const { payStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await payStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));
    expect(result.error).toBeTruthy();
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it("surfaces a checkout-creation failure", async () => {
    orderSelectRoute = () => ({
      data: { id: "order-1", package_id: "BASIC", fee_kurus: 19900, payment_status: "PENDING" },
      error: null,
    });
    createCheckoutMock.mockRejectedValueOnce(new Error("Ödeme linki oluşturulamadı."));
    const { payStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await payStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));
    expect(result.error).toBe("Ödeme linki oluşturulamadı.");
  });
});


describe("rescanStandaloneCheck", () => {
  /** An order whose SEO module failed, with `attempts` rows on file for it. */
  function orderWithFailedSeo(attempts: number) {
    const seoRows = Array.from({ length: attempts }, (_, i) => ({
      id: `seo-${i}`,
      check_type: "SEO_META",
      status: "ERROR",
      generated_at: `2026-09-08T10:0${i}:00Z`,
    }));
    return () => ({
      data: {
        id: "order-1",
        target_url: "https://example.com",
        check_type: null,
        standalone_qa_reports: [
          {
            id: "a11y-0",
            check_type: "ACCESSIBILITY",
            status: "PASS",
            generated_at: "2026-09-08T10:00:00Z",
          },
          ...seoRows,
        ],
      },
      error: null,
    });
  }

  it("re-runs only the failed module and appends its new row", async () => {
    orderSelectRoute = orderWithFailedSeo(1);
    checkImpl = async () => ({
      status: "PASS",
      results: { missingCritical: [] },
      documentSha256: "b".repeat(64),
    });

    const { rescanStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await rescanStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));

    expect(result.error).toBeNull();
    // The passing ACCESSIBILITY module is not re-run: the customer is owed
    // the module that didn't happen, not a whole second scan.
    expect(reportInsertCalls).toHaveLength(1);
    expect(reportInsertCalls[0]).toMatchObject({
      order_id: "order-1",
      check_type: "SEO_META",
      status: "PASS",
    });
  });

  it("records another ERROR row when the retry fails too", async () => {
    orderSelectRoute = orderWithFailedSeo(1);
    checkImpl = async () => null;

    const { rescanStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await rescanStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));

    expect(result.error).toBeNull();
    expect(reportInsertCalls).toHaveLength(1);
    expect(reportInsertCalls[0]).toMatchObject({ check_type: "SEO_META", status: "ERROR" });
    expect(reportInsertCalls[0].document_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("refuses once a module has burned through its attempts", async () => {
    const { STANDALONE_MODULE_MAX_ATTEMPTS } = await import("@/lib/validations/standalone-qa");
    orderSelectRoute = orderWithFailedSeo(STANDALONE_MODULE_MAX_ATTEMPTS);

    const { rescanStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await rescanStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));

    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });

  it("refuses when nothing failed, without re-running a passing scan", async () => {
    orderSelectRoute = () => ({
      data: {
        id: "order-1",
        target_url: "https://example.com",
        check_type: null,
        standalone_qa_reports: [
          {
            id: "a11y-0",
            check_type: "ACCESSIBILITY",
            status: "PASS",
            generated_at: "2026-09-08T10:00:00Z",
          },
        ],
      },
      error: null,
    });

    const { rescanStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await rescanStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));

    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });

  it("does not re-run a module whose latest attempt already succeeded", async () => {
    // ERROR first, PASS on the retry: latestReportPerModule must win over
    // "any ERROR row exists", or every fixed module would be re-run forever.
    orderSelectRoute = () => ({
      data: {
        id: "order-1",
        target_url: "https://example.com",
        check_type: null,
        standalone_qa_reports: [
          { id: "seo-0", check_type: "SEO_META", status: "ERROR", generated_at: "2026-09-08T10:00:00Z" },
          { id: "seo-1", check_type: "SEO_META", status: "PASS", generated_at: "2026-09-08T10:05:00Z" },
        ],
      },
      error: null,
    });

    const { rescanStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await rescanStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));

    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });
});
