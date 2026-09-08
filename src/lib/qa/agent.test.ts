/**
 * processTier2Order: the TS orchestration around one Tier2 (Agentic QA)
 * order -- claim, criteria lookup, the interactive click/type/finish loop,
 * escalate-or-complete. The "ai" SDK, "playwright-core", and the chromium
 * resolver are all mocked at the module boundary; this proves
 * our own orchestration and tool-execute logic (element-ref clicking, the
 * off-origin guard, budget exhaustion, confidence gating, hashing), not
 * what the real OpenAI model or a real browser would actually do -- same
 * disclaimer as mock-rpc-client.ts for the Postgres side.
 *
 * "ai"'s tool() is mocked as an identity function, so `options.tools.click`
 * etc. in a test's generateTextImpl are the REAL tool objects agent.ts
 * built (real inputSchema, real execute) -- calling `.execute(...)` runs
 * our actual click/type_text/wait_and_read/finish logic against the mocked
 * Playwright page, the same way the real "ai" SDK would when the model
 * decides to call a tool.
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
const STAGING_URL = "https://staging.example.com";

function defaultOrderData() {
  return {
    id: ORDER_ID,
    tier: "TIER2",
    delivery: {
      id: DELIVERY_ID,
      staging_url: STAGING_URL,
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
 * qa_agent_runs) is queried multiple times per run with different shapes.
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
// Without this, openStagingPage's SSRF guard would run a real DNS lookup for
// STAGING_URL on every test -- slow, network-dependent, and pointless since
// isBlockedTarget's own logic is covered by ssrf-guard.test.ts, not here.
vi.mock("@/lib/qa/ssrf-guard", () => ({ isBlockedTarget: vi.fn(async () => false) }));

/**
 * generateTextImpl stands in for what the real model would decide to do:
 * each test drives the tool-call sequence itself by calling
 * `options.tools.<name>.execute(input, {} )` directly, in whatever order
 * represents the scenario under test. tool() below is an identity function,
 * so `options.tools` is exactly the object agent.ts built -- these execute
 * calls run our real logic, not a stub.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock boundary: the real tool inputs are validated by the real "ai" SDK, not exercised here.
type MockTool = { execute: (input: any, ctx?: unknown) => Promise<unknown> };
let generateTextImpl: (options: {
  tools: { click: MockTool; type_text: MockTool; wait_and_read: MockTool; finish: MockTool };
}) => Promise<unknown>;

vi.mock("ai", () => ({
  generateText: vi.fn(async (options: Parameters<typeof generateTextImpl>[0]) => generateTextImpl(options)),
  tool: (def: unknown) => def,
  hasToolCall: () => () => false,
  stepCountIs: () => () => false,
}));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => (modelId: string) => ({ modelId })),
}));

interface MockPageState {
  url: string;
  elements: { ref: number; role: string; label: string }[];
  visibleText: string;
  clicks: number[];
  typed: { ref: number; text: string }[];
}

function refFromSelector(selector: string): number {
  return Number(selector.match(/data-qa-ref="(\d+)"/)?.[1]);
}

function makeMockPage(state: MockPageState) {
  return {
    url: () => state.url,
    goto: async (url: string) => {
      state.url = url;
    },
    goBack: async () => {
      state.url = STAGING_URL;
    },
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    evaluate: async (_fn: unknown, arg?: unknown) => {
      // snapshotPage calls evaluate twice: once with a `max` arg (element
      // query), once with none (visible text). That argument count is the
      // only thing distinguishing the two calls from outside real DOM code.
      if (arg !== undefined) return state.elements;
      return state.visibleText;
    },
    locator: (selector: string) => ({
      click: async () => {
        state.clicks.push(refFromSelector(selector));
      },
      fill: async (text: string) => {
        state.typed.push({ ref: refFromSelector(selector), text });
      },
    }),
  };
}

let pageState: MockPageState;
type MockBrowser = {
  newContext: () => Promise<{ newPage: () => Promise<unknown> }>;
  close: () => Promise<void>;
};
let launchImpl: () => Promise<MockBrowser>;

vi.mock("playwright-core", () => ({
  chromium: { launch: vi.fn(() => launchImpl()) },
}));
// Which binary to launch is resolveChromium()'s problem (and its own unit's
// to test); openStagingPage only cares that it got one.
vi.mock("@/lib/qa/chromium", () => ({
  resolveChromium: vi.fn(async () => ({ executablePath: "/fake/chromium", args: [] })),
}));

/** Mirrors the real launch path: a browser hands out contexts, and pages come
 * from a context -- never browser.newPage(), which @axe-core/playwright
 * rejects downstream. */
function workingBrowser() {
  return async () => ({
    newContext: async () => ({ newPage: async () => makeMockPage(pageState) }),
    close: async () => {},
  });
}

const DEFAULT_CRITERIA_VERDICT = [
  { description: "Ana sayfa 200 dönmeli", met: "PASS" as const, note: "GET / -> 200 OK gözlendi." },
];

function verdictInput(
  overrides: Partial<{
    status: string;
    findings: string;
    confidenceScore: number;
    criteria: unknown[];
  }> = {},
) {
  return {
    status: "PASS",
    findings: "Tüm kriterler karşılandı.",
    confidenceScore: 95,
    criteria: DEFAULT_CRITERIA_VERDICT,
    ...overrides,
  };
}

/** Most tests just need the agent to reach a verdict immediately -- no
 * interaction, straight to finish. */
function finishOnly(overrides?: Parameters<typeof verdictInput>[0]) {
  return async (options: Parameters<typeof generateTextImpl>[0]) => {
    await options.tools.finish.execute(verdictInput(overrides));
    return {};
  };
}

beforeEach(() => {
  routes = defaultRoutes();
  admin = buildAdminMock(routes);
  notifyDeliverySubmitted.mockClear();
  process.env.OPENAI_API_KEY = "test-key";
  pageState = {
    url: STAGING_URL,
    elements: [{ ref: 0, role: "button", label: "Gönder" }],
    visibleText: "<html>ok</html>",
    clicks: [],
    typed: [],
  };
  generateTextImpl = finishOnly();
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
    const generateTextSpy = vi.fn();
    generateTextImpl = async (options) => {
      generateTextSpy();
      return finishOnly()(options);
    };

    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(generateTextSpy).not.toHaveBeenCalled();
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
      p_reason: `could not load staging URL: ${STAGING_URL}`,
    });
  });

  it("escalates when OPENAI_API_KEY is not configured, without launching a browser session for nothing", async () => {
    delete process.env.OPENAI_API_KEY;
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "agent exhausted its interaction budget without reaching a verdict",
    });
  });

  it("escalates when the model never calls finish -- budget exhausted or a malformed final call", async () => {
    // Real SDK behavior: a tool call that fails inputSchema validation never
    // reaches execute(). Simulated here by simply not calling finish at all,
    // e.g. after burning the step budget on other tools.
    generateTextImpl = async (options) => {
      await options.tools.click.execute({ ref: 0 });
      return {};
    };
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "agent exhausted its interaction budget without reaching a verdict",
    });
    expect(admin.rpc).not.toHaveBeenCalledWith("submit_qa_report", expect.anything());
  });

  it("clicking an element runs the real click against the page, keyed by its ref", async () => {
    pageState.elements = [{ ref: 0, role: "button", label: "Gönder" }];
    generateTextImpl = async (options) => {
      const result = (await options.tools.click.execute({ ref: 0 })) as { ok: boolean };
      expect(result.ok).toBe(true);
      await options.tools.finish.execute(verdictInput());
      return {};
    };
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(pageState.clicks).toEqual([0]);
  });

  it("typing into a field runs the real fill against the page", async () => {
    generateTextImpl = async (options) => {
      await options.tools.type_text.execute({ ref: 2, text: "test@example.com" });
      await options.tools.finish.execute(verdictInput());
      return {};
    };
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(pageState.typed).toEqual([{ ref: 2, text: "test@example.com" }]);
  });

  it("blocks a click that navigates off-origin and reports it back to the model instead of following it", async () => {
    generateTextImpl = async (options) => {
      // The mocked click doesn't itself navigate; simulate the page having
      // drifted off-site (an <a href> to an external domain, say) by
      // mutating pageState.url as the click's side effect.
      pageState.url = "https://not-the-same-site.example.com/";
      const result = (await options.tools.click.execute({ ref: 0 })) as { ok: boolean; error?: string };
      expect(result.ok).toBe(false);
      expect(result.error).toContain("off-origin");
      await options.tools.finish.execute(verdictInput());
      return {};
    };
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    // The guard navigates back rather than leaving the run stranded off-site.
    expect(pageState.url).toBe(STAGING_URL);
  });

  it("escalates an UNCERTAIN verdict without submitting a report", async () => {
    generateTextImpl = finishOnly({ status: "UNCERTAIN", confidenceScore: 40 });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "low confidence or uncertain result",
    });
    expect(admin.rpc).not.toHaveBeenCalledWith("submit_qa_report", expect.anything());
  });

  it("escalates a PASS verdict whose confidence is below the 80 threshold", async () => {
    generateTextImpl = finishOnly({ confidenceScore: 79 });
    const { processTier2Order } = await import("./agent");
    await processTier2Order(ORDER_ID);

    expect(admin.rpc).toHaveBeenCalledWith("auto_escalate_qa_tier", {
      p_order_id: ORDER_ID,
      p_reason: "low confidence or uncertain result",
    });
  });

  it("completes a high-confidence PASS: submits the report, marks the order COMPLETED, and notifies the client with the contract's real window", async () => {
    generateTextImpl = finishOnly({ findings: "Tüm testler geçti." });
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
    generateTextImpl = finishOnly({ status: "FAIL", confidenceScore: 90 });
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
