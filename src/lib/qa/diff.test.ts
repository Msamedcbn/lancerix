import { describe, expect, it } from "vitest";

import { diffScans, hasNews, type ScanReportLike } from "@/lib/qa/diff";

function report(checkType: string, results: unknown, status = "PASS"): ScanReportLike {
  return { checkType, results, status } as ScanReportLike;
}

describe("diffScans", () => {
  it("reports nothing when the two scans are identical", () => {
    const scan = [report("ACCESSIBILITY", { violationCount: 2 }), report("DEAD_LINKS", { brokenCount: 0 })];
    expect(diffScans(scan, scan)).toEqual([]);
    expect(hasNews(diffScans(scan, scan))).toBe(false);
  });

  it("calls a new violation WORSE and a fixed one BETTER", () => {
    const worse = diffScans(
      [report("ACCESSIBILITY", { violationCount: 2 })],
      [report("ACCESSIBILITY", { violationCount: 5 })],
    );
    expect(worse).toHaveLength(1);
    expect(worse[0]?.direction).toBe("WORSE");
    expect(worse[0]?.summary).toContain("2 → 5");

    const better = diffScans(
      [report("ACCESSIBILITY", { violationCount: 5 })],
      [report("ACCESSIBILITY", { violationCount: 2 })],
    );
    expect(better[0]?.direction).toBe("BETTER");
  });

  it("reads performance in the customer's direction, not the number's", () => {
    // Score up = better, LCP up = worse. Getting this backwards would tell a
    // customer their site improved on the run where it got slower.
    const changes = diffScans(
      [report("PERFORMANCE", { performanceScore: 88, lcpMs: 1800, clsScore: 0.01 })],
      [report("PERFORMANCE", { performanceScore: 58, lcpMs: 4200, clsScore: 0.01 })],
    );
    expect(changes.map((c) => c.direction)).toEqual(["WORSE", "WORSE"]);
    expect(changes.find((c) => c.summary.startsWith("LCP"))?.summary).toBe("LCP: 1.80s → 4.20s");
    expect(changes.find((c) => c.summary.startsWith("Performans"))?.summary).toBe(
      "Performans skoru: 88/100 → 58/100",
    );
  });

  it("ignores metric noise below the threshold", () => {
    // Lighthouse moves a few points between identical runs. Emailing about
    // that trains the customer to ignore the emails.
    const changes = diffScans(
      [report("PERFORMANCE", { performanceScore: 88, lcpMs: 1800, clsScore: 0.01 })],
      [report("PERFORMANCE", { performanceScore: 90, lcpMs: 1900, clsScore: 0.02 })],
    );
    expect(changes).toEqual([]);
  });

  it("says nothing about a module that failed in either run", () => {
    // An ERROR module did not measure the site. Treating a missing measurement
    // as "it went to zero" would report an improvement that never happened.
    expect(
      diffScans(
        [report("DEAD_LINKS", { brokenCount: 4 })],
        [report("DEAD_LINKS", { error: "MODULE_FAILED" }, "ERROR")],
      ),
    ).toEqual([]);

    expect(
      diffScans(
        [report("DEAD_LINKS", { error: "MODULE_FAILED" }, "ERROR")],
        [report("DEAD_LINKS", { brokenCount: 0 })],
      ),
    ).toEqual([]);
  });

  it("says nothing about a module that only exists in the newer scan", () => {
    // Plan upgraded mid-subscription: the first run of a new module has no
    // baseline, so it is not news yet.
    expect(diffScans([], [report("FORM_VALIDATION", { issues: [] })])).toEqual([]);
  });

  it("sorts regressions ahead of improvements", () => {
    const changes = diffScans(
      [report("ACCESSIBILITY", { violationCount: 5 }), report("DEAD_LINKS", { brokenCount: 0 })],
      [report("ACCESSIBILITY", { violationCount: 1 }), report("DEAD_LINKS", { brokenCount: 3 })],
    );
    expect(changes.map((c) => c.direction)).toEqual(["WORSE", "BETTER"]);
  });

  it("counts SEO gaps across both missing lists", () => {
    const changes = diffScans(
      [report("SEO_META", { missingCritical: [], missingRecommended: ["og:image"] })],
      [report("SEO_META", { missingCritical: ["title"], missingRecommended: ["og:image", "canonical"] })],
    );
    expect(changes).toHaveLength(1);
    expect(changes[0]?.direction).toBe("WORSE");
    expect(changes[0]?.summary).toContain("1 → 3");
  });

  it("handles malformed payloads without throwing", () => {
    // Report payloads are jsonb written by an older build; a shape change must
    // degrade to "no news", never to a crashed cron run.
    expect(diffScans([report("ACCESSIBILITY", null)], [report("ACCESSIBILITY", { violationCount: 3 })])).toEqual([]);
    expect(diffScans([report("DEAD_LINKS", { brokenCount: "4" })], [report("DEAD_LINKS", { brokenCount: 9 })])).toEqual(
      [],
    );
  });
});
