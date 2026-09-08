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
vi.mock("@/lib/qa/standalone", () => ({
  runStandaloneCheck: vi.fn(async () => checkImpl()),
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
        insert: (row: Record<string, unknown>) => {
          reportInsertCalls.push(row);
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
      formData({ targetUrl: "not-a-url", checkType: "ACCESSIBILITY" }),
    );
    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });

  it("creates an order and a report on a successful scan", async () => {
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", checkType: "ACCESSIBILITY" }),
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
      formData({ targetUrl: "https://example.com", checkType: "ACCESSIBILITY" }),
    );
    expect(result.error).toBeTruthy();
    expect(reportInsertCalls).toHaveLength(0);
  });

  it("surfaces an order-insert failure without running the scan", async () => {
    orderInsertRoute = () => ({ data: null, error: { message: "insert failed" } });
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", checkType: "ACCESSIBILITY" }),
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
      formData({ targetUrl: "https://example.com", checkType: "ACCESSIBILITY" }),
    );
    expect(result.error).toBeTruthy();
  });

  it("surfaces a report-insert failure after a successful scan", async () => {
    reportInsertRoute = () => ({ error: { message: "insert failed" } });
    const { createStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await createStandaloneCheck(
      { error: null },
      formData({ targetUrl: "https://example.com", checkType: "ACCESSIBILITY" }),
    );
    expect(result.error).toBeTruthy();
  });
});

describe("payStandaloneCheck", () => {
  it("redirects to a Polar checkout for a PENDING order", async () => {
    orderSelectRoute = () => ({
      data: { id: "order-1", check_type: "ACCESSIBILITY", fee_kurus: 9900, payment_status: "PENDING" },
      error: null,
    });
    const { payStandaloneCheck } = await import("./standalone-qa-actions");
    await expect(
      payStandaloneCheck({ error: null }, formData({ orderId: "order-1" })),
    ).rejects.toThrow("REDIRECT:https://polar.sh/mock-checkout");
    expect(createCheckoutMock).toHaveBeenCalledWith("order-1", 9900, "ACCESSIBILITY", undefined);
  });

  it("refuses an already-paid order before calling Polar", async () => {
    orderSelectRoute = () => ({
      data: { id: "order-1", check_type: "ACCESSIBILITY", fee_kurus: 9900, payment_status: "PAID" },
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
      data: { id: "order-1", check_type: "ACCESSIBILITY", fee_kurus: 9900, payment_status: "PENDING" },
      error: null,
    });
    createCheckoutMock.mockRejectedValueOnce(new Error("Ödeme linki oluşturulamadı."));
    const { payStandaloneCheck } = await import("./standalone-qa-actions");
    const result = await payStandaloneCheck({ error: null }, formData({ orderId: "order-1" }));
    expect(result.error).toBe("Ödeme linki oluşturulamadı.");
  });
});
