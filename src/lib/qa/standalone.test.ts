/**
 * runAccessibilityCheck's own logic -- the PASS/FAIL/PARTIAL severity
 * reduction and the sha256 hash -- was previously only exercised indirectly
 * through a mock in standalone-qa-actions.test.ts. This tests the real
 * function, mocking only its two external boundaries (openStagingPage's
 * browser launch, AxeBuilder's scan) the same way agent.test.ts mocks
 * playwright-core/the chromium resolver rather than mocking agent.ts's own
 * functions.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const closeMock = vi.fn(async () => {});
const pageEvaluateMock = vi.fn(async () => undefined as unknown);
const pageSetViewportSizeMock = vi.fn(async () => {});
const pageWaitForTimeoutMock = vi.fn(async () => {});
const pageUrlMock = vi.fn(() => "https://example.com/");
const pageGotoMock = vi.fn(async () => {});
const pageOnMock = vi.fn();
const locatorClickMock = vi.fn(async () => {});
const locatorIsVisibleMock = vi.fn(async () => true);
const pageLocatorMock = vi.fn(() => ({ click: locatorClickMock, isVisible: locatorIsVisibleMock }));

function mockPage() {
  return {
    evaluate: pageEvaluateMock,
    setViewportSize: pageSetViewportSizeMock,
    waitForTimeout: pageWaitForTimeoutMock,
    url: pageUrlMock,
    goto: pageGotoMock,
    on: pageOnMock,
    locator: pageLocatorMock,
  };
}

vi.mock("@/lib/qa/agent", () => ({
  openStagingPage: vi.fn(async (url: string) =>
    url.includes("unreachable") ? null : { browser: { close: closeMock }, page: mockPage() },
  ),
}));

// SEO_META/DEAD_LINKS don't go through openStagingPage at all -- fetch()
// and linkinator do their own I/O, mocked directly.
const fetchMock = vi.fn(async (..._args: unknown[]) => ({ ok: true, text: async () => "<html></html>" }));
vi.stubGlobal("fetch", (...args: unknown[]) => fetchMock(...args));

let linkCheckResult: { links: { url: string; status?: number; state: string }[] };
const linkCheckMock = vi.fn(async (..._args: unknown[]) => linkCheckResult);
vi.mock("linkinator", () => ({
  LinkChecker: vi.fn().mockImplementation(() => ({ check: linkCheckMock })),
}));

let analyzeResult: { violations: unknown[]; passes: unknown[] };
const withTagsMock = vi.fn().mockReturnThis();
const analyzeMock = vi.fn(async () => analyzeResult);
vi.mock("@axe-core/playwright", () => ({
  default: vi.fn().mockImplementation(() => ({
    withTags: withTagsMock,
    analyze: analyzeMock,
  })),
}));

// runPerformanceCheck doesn't go through openStagingPage (it needs its own
// tab, not one shared with another check), so its SSRF check is a separate
// call site -- mocked here the same way agent.test.ts mocks it for
// openStagingPage's internal check.
let blockedTarget = false;
vi.mock("@/lib/qa/ssrf-guard", () => ({
  isBlockedTarget: vi.fn(async () => blockedTarget),
}));

// Picking (and existence-checking) the binary belongs to resolveChromium();
// runPerformanceCheck's contract is just "no browser -> null, and don't
// spawn anything".
let chromiumAvailable = true;
vi.mock("@/lib/qa/chromium", () => ({
  resolveChromium: vi.fn(async () =>
    chromiumAvailable ? { executablePath: "/fake/chromium", args: [] } : null,
  ),
}));

// runPerformanceCheck launches its own Chromium directly via playwright-core
// (openStagingPage, mocked wholesale above, is a separate call path) and
// hands Lighthouse an explicit --remote-debugging-port to attach to instead
// of going through chrome-launcher's own spawn-and-detect-the-port mechanism
// -- same deferred-wrapper reasoning as the axe-core mock above applies to
// browserCloseMock here.
const browserCloseMock = vi.fn(async () => {});
const playwrightLaunchMock = vi.fn(async (..._args: unknown[]) => ({ close: browserCloseMock }));
vi.mock("playwright-core", () => ({
  chromium: { launch: (...args: unknown[]) => playwrightLaunchMock(...args) },
}));

type LighthouseAudits = Record<string, { numericValue: number } | undefined>;
let lighthouseResult: { lhr: { categories: { performance?: { score: number } }; audits: LighthouseAudits } } | null;
const lighthouseMock = vi.fn(async (..._args: unknown[]) => lighthouseResult);
vi.mock("lighthouse", () => ({
  default: (...args: unknown[]) => lighthouseMock(...args),
}));

import {
  runAccessibilityCheck,
  runDeadLinksCheck,
  runFormValidationCheck,
  runInteractionScanCheck,
  runPerformanceCheck,
  runSeoMetaCheck,
  runStandaloneCheck,
  runStandalonePackage,
  runVisualOverflowCheck,
} from "./standalone";

function perfAudits(overrides: Partial<Record<string, number>> = {}): LighthouseAudits {
  const base = {
    "largest-contentful-paint": 1200,
    "first-contentful-paint": 800,
    "cumulative-layout-shift": 0.05,
    "total-blocking-time": 150,
    ...overrides,
  };
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { numericValue: v }]));
}

function violation(impact: "critical" | "serious" | "moderate" | "minor", nodeCount = 1) {
  return {
    id: `rule-${impact}`,
    impact,
    description: `${impact} issue`,
    help: `Fix the ${impact} issue`,
    helpUrl: "https://dequeuniversity.com/rules/axe/rule",
    nodes: Array.from({ length: nodeCount }, () => ({})),
  };
}

beforeEach(() => {
  closeMock.mockClear();
  analyzeMock.mockClear();
  withTagsMock.mockClear();
  analyzeResult = { violations: [], passes: [] };
  blockedTarget = false;
  chromiumAvailable = true;
  browserCloseMock.mockClear();
  playwrightLaunchMock.mockClear();
  lighthouseMock.mockClear();
  lighthouseResult = { lhr: { categories: { performance: { score: 1 } }, audits: perfAudits() } };

  pageEvaluateMock.mockReset();
  pageSetViewportSizeMock.mockClear();
  pageWaitForTimeoutMock.mockClear();
  pageUrlMock.mockReturnValue("https://example.com/");
  pageGotoMock.mockClear();
  pageOnMock.mockClear();
  pageLocatorMock.mockClear();
  locatorClickMock.mockClear();
  locatorIsVisibleMock.mockReset().mockResolvedValue(true);

  fetchMock.mockReset().mockResolvedValue({ ok: true, text: async () => "<html></html>" });
  linkCheckMock.mockClear();
  linkCheckResult = { links: [] };
});

describe("runAccessibilityCheck", () => {
  it("returns null when the page can't be loaded, without calling axe", async () => {
    const result = await runAccessibilityCheck("https://unreachable.example");
    expect(result).toBeNull();
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("PASS when there are zero violations", async () => {
    analyzeResult = { violations: [], passes: [1, 2, 3] };
    const result = await runAccessibilityCheck("https://example.com");
    expect(result?.status).toBe("PASS");
    expect(result?.results.violationCount).toBe(0);
    expect(result?.results.passCount).toBe(3);
  });

  it("PARTIAL when only minor/moderate violations exist", async () => {
    analyzeResult = { violations: [violation("minor"), violation("moderate")], passes: [] };
    const result = await runAccessibilityCheck("https://example.com");
    expect(result?.status).toBe("PARTIAL");
  });

  it("FAIL when any critical or serious violation exists, even alongside minor ones", async () => {
    analyzeResult = { violations: [violation("minor"), violation("critical")], passes: [] };
    const result = await runAccessibilityCheck("https://example.com");
    expect(result?.status).toBe("FAIL");
  });

  it("FAIL on a serious-only violation set", async () => {
    analyzeResult = { violations: [violation("serious")], passes: [] };
    const result = await runAccessibilityCheck("https://example.com");
    expect(result?.status).toBe("FAIL");
  });

  it("computes a 64-char hex sha256 that changes when results change", async () => {
    analyzeResult = { violations: [], passes: [] };
    const a = await runAccessibilityCheck("https://example.com");
    analyzeResult = { violations: [violation("minor")], passes: [] };
    const b = await runAccessibilityCheck("https://example.com");

    expect(a?.documentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(b?.documentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(a?.documentSha256).not.toBe(b?.documentSha256);
  });

  it("closes the browser after a successful scan", async () => {
    await runAccessibilityCheck("https://example.com");
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("closes the browser even when axe itself throws", async () => {
    analyzeMock.mockRejectedValueOnce(new Error("axe crashed"));
    const result = await runAccessibilityCheck("https://example.com");
    expect(result).toBeNull();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});

describe("runPerformanceCheck", () => {
  it("refuses a blocked target without launching chrome", async () => {
    blockedTarget = true;
    const result = await runPerformanceCheck("https://169.254.169.254/");
    expect(result).toBeNull();
    expect(playwrightLaunchMock).not.toHaveBeenCalled();
    expect(lighthouseMock).not.toHaveBeenCalled();
  });

  it("returns null without launching chrome when no browser is available", async () => {
    // Picking (and existence-checking) the binary belongs to
    // resolveChromium(); when it can't find one, nothing should be spawned.
    chromiumAvailable = false;
    const result = await runPerformanceCheck("https://example.com");
    expect(result).toBeNull();
    expect(playwrightLaunchMock).not.toHaveBeenCalled();
  });

  it("returns null when lighthouse produces no result", async () => {
    lighthouseResult = null;
    const result = await runPerformanceCheck("https://example.com");
    expect(result).toBeNull();
    expect(browserCloseMock).toHaveBeenCalledTimes(1);
  });

  it("PASS when the performance score is 90 or above", async () => {
    lighthouseResult = { lhr: { categories: { performance: { score: 0.95 } }, audits: perfAudits() } };
    const result = await runPerformanceCheck("https://example.com");
    expect(result?.status).toBe("PASS");
    expect(result?.results.performanceScore).toBe(95);
  });

  it("PARTIAL when the score is between 50 and 89", async () => {
    lighthouseResult = { lhr: { categories: { performance: { score: 0.7 } }, audits: perfAudits() } };
    const result = await runPerformanceCheck("https://example.com");
    expect(result?.status).toBe("PARTIAL");
  });

  it("FAIL when the score is below 50", async () => {
    lighthouseResult = { lhr: { categories: { performance: { score: 0.2 } }, audits: perfAudits() } };
    const result = await runPerformanceCheck("https://example.com");
    expect(result?.status).toBe("FAIL");
  });

  it("maps Lighthouse audit values onto the results shape", async () => {
    lighthouseResult = {
      lhr: {
        categories: { performance: { score: 1 } },
        audits: perfAudits({
          "largest-contentful-paint": 2500,
          "first-contentful-paint": 1000,
          "cumulative-layout-shift": 0.123456,
          "total-blocking-time": 300,
        }),
      },
    };
    const result = await runPerformanceCheck("https://example.com");
    expect(result?.results).toEqual({
      performanceScore: 100,
      lcpMs: 2500,
      fcpMs: 1000,
      clsScore: 0.123,
      totalBlockingTimeMs: 300,
    });
  });

  it("closes the browser after a successful scan", async () => {
    await runPerformanceCheck("https://example.com");
    expect(browserCloseMock).toHaveBeenCalledTimes(1);
  });

  it("closes the browser even when lighthouse itself throws", async () => {
    lighthouseMock.mockRejectedValueOnce(new Error("lighthouse crashed"));
    const result = await runPerformanceCheck("https://example.com");
    expect(result).toBeNull();
    expect(browserCloseMock).toHaveBeenCalledTimes(1);
  });

  it("returns null without calling lighthouse when chrome fails to launch", async () => {
    playwrightLaunchMock.mockRejectedValueOnce(new Error("chrome launch failed"));
    const result = await runPerformanceCheck("https://example.com");
    expect(result).toBeNull();
    expect(lighthouseMock).not.toHaveBeenCalled();
  });
});

describe("runSeoMetaCheck", () => {
  function html(head: string) {
    return `<!doctype html><html><head>${head}</head><body></body></html>`;
  }

  it("refuses a blocked target without fetching", async () => {
    blockedTarget = true;
    const result = await runSeoMetaCheck("https://169.254.169.254/");
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when the fetch itself fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, text: async () => "" });
    const result = await runSeoMetaCheck("https://example.com");
    expect(result).toBeNull();
  });

  it("FAILs when title and canonical are both missing", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => html("") });
    const result = await runSeoMetaCheck("https://example.com");
    expect(result?.status).toBe("FAIL");
    expect(result?.results.missingCritical).toEqual(["title", "canonical"]);
  });

  it("PARTIAL when title/canonical exist but og:image is missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        html(
          '<title>Örnek</title><link rel="canonical" href="https://example.com"><meta name="description" content="d"><meta property="og:title" content="t"><meta name="twitter:card" content="summary"><link rel="icon" href="/f.ico">',
        ),
    });
    const result = await runSeoMetaCheck("https://example.com");
    expect(result?.status).toBe("PARTIAL");
    expect(result?.results.missingRecommended).toEqual(["og:image"]);
  });

  it("PASSes when every critical and recommended tag is present", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        html(
          '<title>Örnek</title><link rel="canonical" href="https://example.com">' +
            '<meta name="description" content="d"><meta property="og:title" content="t">' +
            '<meta property="og:image" content="i.png"><meta name="twitter:card" content="summary">' +
            '<link rel="icon" href="/f.ico">',
        ),
    });
    const result = await runSeoMetaCheck("https://example.com");
    expect(result?.status).toBe("PASS");
    expect(result?.results.missingCritical).toEqual([]);
    expect(result?.results.missingRecommended).toEqual([]);
  });
});

describe("runDeadLinksCheck", () => {
  it("refuses a blocked target without checking links", async () => {
    blockedTarget = true;
    const result = await runDeadLinksCheck("https://169.254.169.254/");
    expect(result).toBeNull();
    expect(linkCheckMock).not.toHaveBeenCalled();
  });

  it("PASSes when every link is OK", async () => {
    linkCheckResult = { links: [{ url: "https://example.com/a", state: "OK" }] };
    const result = await runDeadLinksCheck("https://example.com");
    expect(result?.status).toBe("PASS");
    expect(result?.results.brokenCount).toBe(0);
  });

  it("PARTIAL when a small share of links are broken", async () => {
    linkCheckResult = {
      links: Array.from({ length: 10 }, (_, i) => ({
        url: `https://example.com/${i}`,
        state: i === 0 ? "BROKEN" : "OK",
        status: i === 0 ? 404 : 200,
      })),
    };
    const result = await runDeadLinksCheck("https://example.com");
    expect(result?.status).toBe("PARTIAL");
    expect(result?.results.brokenCount).toBe(1);
  });

  it("FAILs when most links are broken", async () => {
    linkCheckResult = {
      links: [
        { url: "https://example.com/a", state: "BROKEN", status: 404 },
        { url: "https://example.com/b", state: "BROKEN", status: 500 },
      ],
    };
    const result = await runDeadLinksCheck("https://example.com");
    expect(result?.status).toBe("FAIL");
  });

  it("returns null when the link checker itself throws", async () => {
    linkCheckMock.mockRejectedValueOnce(new Error("network down"));
    const result = await runDeadLinksCheck("https://example.com");
    expect(result).toBeNull();
  });
});

describe("runVisualOverflowCheck", () => {
  it("returns null when the page can't be loaded", async () => {
    const result = await runVisualOverflowCheck("https://unreachable.example");
    expect(result).toBeNull();
  });

  it("PASSes when no viewport overflows", async () => {
    pageEvaluateMock.mockResolvedValue(0);
    const result = await runVisualOverflowCheck("https://example.com");
    expect(result?.status).toBe("PASS");
    expect(result?.results.overflows).toEqual([]);
    expect(pageSetViewportSizeMock).toHaveBeenCalledTimes(3);
  });

  it("FAILs when the 320px (phone) viewport overflows", async () => {
    pageEvaluateMock
      .mockResolvedValueOnce(40) // 320px
      .mockResolvedValueOnce(0) // 768px
      .mockResolvedValueOnce(0); // 1440px
    const result = await runVisualOverflowCheck("https://example.com");
    expect(result?.status).toBe("FAIL");
    expect(result?.results.overflows).toEqual([{ width: 320, overflowPx: 40 }]);
  });

  it("PARTIAL when only a wider viewport overflows", async () => {
    pageEvaluateMock
      .mockResolvedValueOnce(0) // 320px
      .mockResolvedValueOnce(0) // 768px
      .mockResolvedValueOnce(30); // 1440px
    const result = await runVisualOverflowCheck("https://example.com");
    expect(result?.status).toBe("PARTIAL");
  });

  it("closes the browser even when evaluate throws", async () => {
    pageEvaluateMock.mockRejectedValueOnce(new Error("crashed"));
    const result = await runVisualOverflowCheck("https://example.com");
    expect(result).toBeNull();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});

describe("runFormValidationCheck", () => {
  function formShape(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      fieldCount: 2,
      requiredCount: 2,
      emailFieldCount: 1,
      emailFieldsTypedCorrectly: 1,
      hasSubmitControl: true,
      submitDisabled: false,
      ...overrides,
    };
  }

  it("returns null when the page can't be loaded", async () => {
    const result = await runFormValidationCheck("https://unreachable.example");
    expect(result).toBeNull();
  });

  it("PASSes when there are no forms at all", async () => {
    pageEvaluateMock.mockResolvedValueOnce([]);
    const result = await runFormValidationCheck("https://example.com");
    expect(result?.status).toBe("PASS");
    expect(result?.results.formsFound).toBe(0);
  });

  it("PASSes a well-formed form", async () => {
    pageEvaluateMock.mockResolvedValueOnce([formShape()]);
    const result = await runFormValidationCheck("https://example.com");
    expect(result?.status).toBe("PASS");
    expect(result?.results.issues).toEqual([]);
  });

  it("FAILs a form with a missing submit control and no required fields", async () => {
    pageEvaluateMock.mockResolvedValueOnce([
      formShape({ hasSubmitControl: false, requiredCount: 0 }),
    ]);
    const result = await runFormValidationCheck("https://example.com");
    expect(result?.status).toBe("FAIL");
    expect(result?.results.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("flags an email field that isn't type=\"email\"", async () => {
    pageEvaluateMock.mockResolvedValueOnce([
      formShape({ emailFieldCount: 1, emailFieldsTypedCorrectly: 0 }),
    ]);
    const result = await runFormValidationCheck("https://example.com");
    expect(result?.results.issues[0]?.issue).toMatch(/type="email"/);
  });
});

describe("runInteractionScanCheck", () => {
  it("returns null when the page can't be loaded", async () => {
    const result = await runInteractionScanCheck("https://unreachable.example");
    expect(result).toBeNull();
  });

  it("PASSes with zero console errors and clicks every tagged element", async () => {
    pageEvaluateMock
      .mockResolvedValueOnce(undefined) // fill inputs
      .mockResolvedValueOnce(["0", "1", "2"]); // tagged refs
    const result = await runInteractionScanCheck("https://example.com");
    expect(result?.status).toBe("PASS");
    expect(result?.results.clickedCount).toBe(3);
    expect(result?.results.consoleErrors).toEqual([]);
  });

  it("records a console error raised during the scan and reduces status accordingly", async () => {
    let capturedHandler: ((msg: { type: () => string; text: () => string }) => void) | null = null;
    pageOnMock.mockImplementationOnce((event: string, handler: typeof capturedHandler) => {
      if (event === "console") capturedHandler = handler;
    });
    pageEvaluateMock
      .mockImplementationOnce(async () => {
        capturedHandler?.({ type: () => "error", text: () => "TypeError: boom" });
        return undefined;
      })
      .mockResolvedValueOnce([]);
    const result = await runInteractionScanCheck("https://example.com");
    expect(result?.status).toBe("PARTIAL");
    expect(result?.results.consoleErrors).toEqual(["TypeError: boom"]);
  });

  it("closes the browser even when evaluate throws", async () => {
    pageEvaluateMock.mockRejectedValueOnce(new Error("crashed"));
    const result = await runInteractionScanCheck("https://example.com");
    expect(result).toBeNull();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});

describe("runStandaloneCheck", () => {
  it("dispatches ACCESSIBILITY to the axe-core scan", async () => {
    const result = await runStandaloneCheck("ACCESSIBILITY", "https://example.com");
    expect(result?.status).toBe("PASS");
    expect(playwrightLaunchMock).not.toHaveBeenCalled();
  });

  it("dispatches PERFORMANCE to the lighthouse scan", async () => {
    const result = await runStandaloneCheck("PERFORMANCE", "https://example.com");
    expect(result?.status).toBe("PASS");
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("dispatches SEO_META to the fetch+cheerio scan", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '<title>t</title><link rel="canonical" href="https://example.com"><meta name="description" content="d"><meta property="og:title" content="t"><meta property="og:image" content="i"><meta name="twitter:card" content="c"><link rel="icon" href="/f.ico">',
    });
    const result = await runStandaloneCheck("SEO_META", "https://example.com");
    expect(result?.status).toBe("PASS");
    expect(playwrightLaunchMock).not.toHaveBeenCalled();
  });

  it("dispatches DEAD_LINKS to the linkinator scan", async () => {
    linkCheckResult = { links: [] };
    const result = await runStandaloneCheck("DEAD_LINKS", "https://example.com");
    expect(result?.status).toBe("PASS");
    expect(linkCheckMock).toHaveBeenCalled();
  });

  it("dispatches VISUAL_OVERFLOW to the viewport-loop scan", async () => {
    pageEvaluateMock.mockResolvedValue(0);
    const result = await runStandaloneCheck("VISUAL_OVERFLOW", "https://example.com");
    expect(result?.status).toBe("PASS");
    expect(pageSetViewportSizeMock).toHaveBeenCalled();
  });

  it("dispatches FORM_VALIDATION to the form-structure scan", async () => {
    pageEvaluateMock.mockResolvedValueOnce([]);
    const result = await runStandaloneCheck("FORM_VALIDATION", "https://example.com");
    expect(result?.status).toBe("PASS");
  });

  it("dispatches INTERACTION_SCAN to the heuristic crawler", async () => {
    pageEvaluateMock.mockResolvedValueOnce(undefined).mockResolvedValueOnce([]);
    const result = await runStandaloneCheck("INTERACTION_SCAN", "https://example.com");
    expect(result?.status).toBe("PASS");
  });
});

describe("runStandalonePackage", () => {
  it("runs all 3 modules for BASIC package", async () => {
    analyzeResult = { violations: [], passes: [] };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '<title>t</title><link rel="canonical" href="https://example.com">',
    });
    linkCheckResult = { links: [] };

    const results = await runStandalonePackage("BASIC", "https://example.com");
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.checkType)).toEqual(["ACCESSIBILITY", "SEO_META", "DEAD_LINKS"]);
  });

  it("runs all 7 modules for FULL package", async () => {
    pageEvaluateMock.mockResolvedValue(0);
    const results = await runStandalonePackage("FULL", "https://example.com");
    expect(results).toHaveLength(7);
  });
});

