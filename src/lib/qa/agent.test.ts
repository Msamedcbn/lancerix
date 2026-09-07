/**
 * processTier2Order: the TS orchestration around one Tier2 (Agentic QA)
 * order -- claim, criteria lookup, scrape, LLM judge, escalate-or-complete.
 * What's worth proving here is the branching (which path each outcome
 * takes, what gets escalated vs. completed, that a stale-only reclaim never
 * lets the immediate trigger steal a genuinely in-flight run from itself)
 * and the two real bugs found while reviewing this file for the Faz 1
 * "available: true" readiness pass:
 *
 *  - the notifyDeliverySubmitted windowDays was hardcoded to 5 instead of
 *    reading the contract's actual objection_window_days (dormant today
 *    since DEFAULT_OBJECTION_WINDOW_DAYS is also 5, but would silently
 *    diverge from the real deadline the moment that changes)
 *  - the LLM's JSON verdict was cast with `as Verdict` instead of validated,
 *    which is the exact "Zod for every form and API boundary" rule this
 *    codebase otherwise holds to everywhere else
 *
 * Supabase/OpenAI/Playwright are all mocked -- this proves the TS
 * orchestration only, same disclaimer as mock-rpc-client.ts: what submit_qa_report()
 * and auto_escalate_qa_tier() actually enforce needs a real hosted Supabase
 * project (see CLAUDE.md). One such gap this review found and fixed
 * separately: submit_qa_report() only checked is_admin(), which is always
 * false under this file's service-role connection -- every real Tier2
 * report would have silently failed and escalated instead of completing
 * (20260907010000_agent_can_submit_qa_report.sql).
 */
import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

type Step = { method: string; args: unknown[] };
type FromResult = { data?: unknown; error?: unknown };

interface Routes {
  order: () => FromResult;
  claim: () => FromResult;
  insertRun: () => FromResult;
  criteria: () => FromResult;
  updateRun: (patch: Record<string, unknown>) => FromResult;
  completeOrder: () => FromResult;
  rpc: (name: string, args: Record<string, unknown>) => FromResult;
}

const CONTRACT_ID = "11111111-1111-4111-8111-111111111111";
const DELIVERY_ID = "22222222-2222-4222-8222-222222222222";
const ORDER_ID = "33333333-3333-4333-8333-333333333333";
const RUN_ID = "44444444-4444-4444-8444-444444444444";

function defaultOrderData() {
  return {
    id: ORDER_ID,
    tier: "TIER2",
    delivery: {
      id: DELIVERY_ID,
      staging_url: "https://staging.example.com",
      contract_id: CONTRACT_ID,
      contracts: {
        id: CONTRACT_ID,
        title: "Test Sözleşmesi",
        client_id: "55555555-5555-4555-8555-555555555555",
        client_email: "client@example.com",
        objection_window_days: 7,
      },
    },
  };
}

function defaultRoutes(): Routes {
  return {
    order: () => ({ data: defaultOrderData(), error: null }),
    claim: () => ({ data: [{ id: ORDER_ID }], error: null }),
    insertRun: () => ({ data: { id: RUN_ID }, error: null }),
    criteria: () => ({ data: [{ description: "Ana sayfa 200 dönmeli" }], error: null }),
    updateRun: () => ({ error: null }),
    completeOrder: () => ({ error: null }),
    rpc: () => ({ data: null, error: null }),
  };
}

/**
 * Stands in for the Supabase admin client. Dispatches on (table, first
 * chain step) rather than call order, since the same table (qa_tier_orders,
 * qa_agent_runs) is queried multiple times per run with different shapes --
 * see the class doc comment for why that's enough to disambiguate every
 * call site agent.ts actually makes.
 */
function buildAdminMock(routes: Routes) {
  const calls: { table: string; steps: Step[] }[] = [];

  function resolveFrom(table: string, steps: Step[]): FromResult {
    calls.push({ table, steps });
    const first = steps[0];
    const firstArg = first?.args[0] as Record<string, unknown> | string | undefined;

    if (table === "qa_tier_orders" && first?.method === "select") return routes.order();
    if (table === "qa_tier_orders" && first?.method === "update") {
      const patch = firstArg as Record<string, unknown>;
      if (patch.agent_status === "RUNNING") return routes.claim();
      if (patch.agent_status === "COMPLETED") return routes.completeOrder();
    }
    if (table === "qa_agent_runs" && first?.method === "insert") return routes.insertRun();
    if (table === "qa_agent_runs" && first?.method === "update") {
      return routes.updateRun(firstArg as Record<string, unknown>);
    }
    if (table === "acceptance_criteria" && first?.method === "select") return routes.criteria();

    throw new Error(`unhandled mock call: ${table} ${JSON.stringify(steps)}`);
  }

  function makeBuilder(table: string, steps: Step[]): Record<string, unknown> {
    const append = (method: string) => (...args: unknown[]) =>
      makeBuilder(table, [...steps, { method, args }]);
    return {
      select: append("select"),
      eq: append("eq"),
      or: append("or"),
      update: append("update"),
      insert: append("insert"),
      single: async () => resolveFrom(table, [...steps, { method: "single", args: [] }]),
      then: (resolve: (v: FromResult) => void, reject: (e: unknown) => void) =>
        Promise.resolve()
          .then(() => resolveFrom(table, steps))
          .then(resolve, reject),
    };
  }

  const rpc = vi.fn(async (name: string, args: Record<string, unknown> = {}) => routes.rpc(name, args));
  const from = vi.fn((table: string) => makeBuilder(table, []));
  return { client: { from, rpc }, calls, rpc, from };
}

let routes: Routes;
let admin: ReturnType<typeof buildAdminMock>;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => admin.client),
}));

const notifyDeliverySubmitted = vi.fn(async () => ({ ok: true, reason: undefined }));
vi.mock("@/lib/notify/email", () => ({ notifyDeliverySubmitted }));

let generateTextImpl: () => Promise<{ text: string }>;
vi.mock("ai", () => ({
  generateText: vi.fn(async () => generateTextImpl()),
}));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => (modelId: string) => ({ modelId })),
}));

let launchImpl: () => Promise<{
  newPage: () => Promise<{ goto: () => Promise<void>; evaluate: () => Promise<string> }>;
  close: () => Promise<void>;
}>;
vi.mock("playwright-core", () => ({
  chromium: { launch: vi.fn(() => launchImpl()) },
}));
vi.mock("@sparticuz/chromium", () => ({
  default: { args: [], executablePath: vi.fn(async () => "/fake/chromium") },
}));

const DEFAULT_CRITERIA_VERDICT = [
  { description: "Ana sayfa 200 dönmeli", met: "PASS" as const, note: "GET / -> 200 OK gözlendi." },
];

function passVerdict(
  overrides: Partial<{
    status: string;
    findings: string;
    confidenceScore: number;
    criteria: unknown[];
  }> = {},
) {
  return JSON.stringify({
    status: "PASS",
    findings: "Tüm kriterler karşılandı.",
    confidenceScore: 95,
    criteria: DEFAULT_CRITERIA_VERDICT,
    ...overrides,
  });
}

function workingBrowser(pageText = "<html>ok</html>") {
  return async () => ({
    newPage: async () => ({
      goto: async () => {},
      evaluate: async () => pageText,
    }),
    close: async () => {},
  });
}

beforeEach(() => {
  routes = defaultRoutes();
  admin = buildAdminMock(routes);
  notifyDeliverySubmitted.mockClear();
  process.env.OPENAI_API_KEY = "test-key";
  generateTextImpl = async () => ({ text: passVerdict() });
  launchImpl = workingBrowser();
});

describe("processTier2Order", () => {
  it("returns early when the order can't be found", async () => {
    routes.order = () => ({ data: null, error: { message: "not found" } });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).not.toHaveBeenCalled();
    expect(notifyDeliverySubmitted).not.toHaveBeenCalled();
  });

  it("returns early when the order has no delivery", async () => {
    routes.order = () => ({ data: { ...defaultOrderData(), delivery: null }, error: null });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("backs off without creating a run when the claim matches nothing (already claimed)", async () => {
    routes.claim = () => ({ data: [], error: null });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    const runInsert = admin.calls.find((c) => c.table === "qa_agent_runs" && c.steps[0]?.method === "insert");
    expect(runInsert).toBeUndefined();
  });

  it("only claims a stale RUNNING order when allowReclaimStale is true (cron path)", async () => {
    const { processTier2Order } = await import("./agent");

    await processTier2Order(ORDER_ID);
    let claimCall = admin.calls.find(
      (c) => c.table === "qa_tier_orders" && (c.steps[0]?.args[0] as Record<string, unknown>)?.agent_status === "RUNNING",
    );
    let orArg = claimCall?.steps.find((s) => s.method === "or")?.args[0] as string;
    expect(orArg).not.toContain("RUNNING");

    admin = buildAdminMock(routes);
    await processTier2Order(ORDER_ID, true);
    claimCall = admin.calls.find(
      (c) => c.table === "qa_tier_orders" && (c.steps[0]?.args[0] as Record<string, unknown>)?.agent_status === "RUNNING",
    );
    orArg = claimCall?.steps.find((s) => s.method === "or")?.args[0] as string;
    expect(orArg).toContain("agent_status.eq.RUNNING");
  });

  it("escalates when the contract has no acceptance criteria, without touching the LLM", async () => {
    routes.criteria = () => ({ data: [], error: null });
    const generateText = vi.fn();
    generateTextImpl = async () => {
      generateText();
      return { text: passVerdict() };
    };

    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(generateText).not.toHaveBeenCalled();
    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "no acceptance criteria on this contract",
    });
    expect(notifyDeliverySubmitted).not.toHaveBeenCalled();
  });

  it("escalates when the staging URL can't be loaded", async () => {
    launchImpl = async () => {
      throw new Error("net::ERR_CONNECTION_REFUSED");
    };
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "could not load staging URL: https://staging.example.com",
    });
  });

  it("escalates when the LLM response fails schema validation", async () => {
    generateTextImpl = async () => ({ text: JSON.stringify({ status: "MAYBE", findings: "?" }) });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "LLM did not return a parseable verdict",
    });
  });

  it("escalates when the LLM omits the per-criterion breakdown -- an overall verdict alone is not a detailed report", async () => {
    generateTextImpl = async () => ({ text: passVerdict({ criteria: [] }) });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "LLM did not return a parseable verdict",
    });
  });

  it("escalates when OPENAI_API_KEY is not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "LLM did not return a parseable verdict",
    });
  });

  it("escalates an UNCERTAIN verdict without submitting a report", async () => {
    generateTextImpl = async () => ({ text: passVerdict({ status: "UNCERTAIN", confidenceScore: 40 }) });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "low confidence or uncertain result",
    });
    expect(admin.rpc).not.toHaveBeenCalledWith("submit_qa_report", expect.anything());
  });

  it("escalates a PASS verdict whose confidence is below the 80 threshold", async () => {
    generateTextImpl = async () => ({ text: passVerdict({ confidenceScore: 79 }) });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "low confidence or uncertain result",
    });
  });

  it("completes a high-confidence PASS: submits the report, marks the order COMPLETED, and notifies the client with the contract's real window", async () => {
    generateTextImpl = async () => ({ text: passVerdict({ findings: "Tüm testler geçti." }) });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    const expectedSha = createHash("sha256")
      .update(JSON.stringify({ findings: "Tüm testler geçti.", criteria: DEFAULT_CRITERIA_VERDICT }))
      .digest("hex");
    expect(admin.rpc).toHaveBeenCalledWith("submit_qa_report", {
      p_delivery_id: DELIVERY_ID,
      p_contract_id: CONTRACT_ID,
      p_status: "PASS",
      p_findings: "Tüm testler geçti.",
      p_document_sha256: expectedSha,
      p_criteria: DEFAULT_CRITERIA_VERDICT,
    });
    expect(
      admin.calls.some(
        (c) =>
          c.table === "qa_tier_orders" &&
          (c.steps[0]?.args[0] as Record<string, unknown>)?.agent_status === "COMPLETED",
      ),
    ).toBe(true);
    expect(notifyDeliverySubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ contractId: CONTRACT_ID, windowDays: 7 }),
    );
  });

  it("completes a high-confidence FAIL the same way as PASS -- FAIL is not itself a reason to escalate", async () => {
    generateTextImpl = async () => ({ text: passVerdict({ status: "FAIL", confidenceScore: 90 }) });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith(
      "submit_qa_report",
      expect.objectContaining({ p_status: "FAIL" }),
    );
    expect(admin.rpc).not.toHaveBeenCalledWith("auto_escalate_qa_tier", expect.anything());
  });

  it("escalates instead of crashing when submit_qa_report itself errors", async () => {
    routes.rpc = (name) =>
      name === "submit_qa_report"
        ? { data: null, error: { message: "only an admin or the agent worker (service_role) may submit a QA report" } }
        : { data: null, error: null };

    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    const escalateCall = admin.rpc.mock.calls.find(([name]) => name === "auto_escalate_qa_tier");
    expect(escalateCall?.[1]).toMatchObject({
      p_order_id: ORDER_ID,
      p_reason:
        "unhandled error: only an admin or the agent worker (service_role) may submit a QA report",
    });
    expect(notifyDeliverySubmitted).not.toHaveBeenCalled();
  });
});
