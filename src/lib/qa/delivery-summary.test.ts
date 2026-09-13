import { describe, expect, it } from "vitest";

import {
  buildDeliverySummary,
  computeDocumentSeal,
  computeOverallStatus,
  splitByEvidenceValue,
} from "@/lib/qa/delivery-summary";
import type { StandaloneQaReport } from "@/lib/data/standalone-qa";

let nextId = 0;

function report(overrides: Partial<StandaloneQaReport> & { check_type: string }): StandaloneQaReport {
  nextId += 1;
  return {
    id: `report-${nextId}`,
    order_id: "order-1",
    generated_at: "2026-09-13T00:00:00.000Z",
    document_sha256: `sha-${nextId}`,
    status: "PASS",
    results: {},
    ...overrides,
  };
}

describe("splitByEvidenceValue", () => {
  it("separates evidence modules from technical modules", () => {
    const reports = [
      report({ check_type: "SEO_META" }),
      report({ check_type: "INTERACTION_SCAN" }),
      report({ check_type: "ACCESSIBILITY" }),
      report({ check_type: "DEAD_LINKS" }),
    ];

    const { evidence, technical } = splitByEvidenceValue(reports);

    expect(evidence.map((r) => r.check_type)).toEqual(["INTERACTION_SCAN", "DEAD_LINKS"]);
    expect(technical.map((r) => r.check_type)).toEqual(["ACCESSIBILITY", "SEO_META"]);
  });

  it("orders each bucket by the fixed evidence/technical priority regardless of input order", () => {
    const reports = [
      report({ check_type: "VISUAL_OVERFLOW" }),
      report({ check_type: "FORM_VALIDATION" }),
      report({ check_type: "INTERACTION_SCAN" }),
      report({ check_type: "DEAD_LINKS" }),
      report({ check_type: "PERFORMANCE" }),
      report({ check_type: "ACCESSIBILITY" }),
    ];

    const { evidence, technical } = splitByEvidenceValue(reports);

    expect(evidence.map((r) => r.check_type)).toEqual([
      "INTERACTION_SCAN",
      "FORM_VALIDATION",
      "DEAD_LINKS",
      "VISUAL_OVERFLOW",
    ]);
    expect(technical.map((r) => r.check_type)).toEqual(["ACCESSIBILITY", "PERFORMANCE"]);
  });

  it("treats a legacy null check_type as technical, not evidence", () => {
    const reports = [report({ check_type: null as unknown as string })];
    const { evidence, technical } = splitByEvidenceValue(reports);
    expect(evidence).toHaveLength(0);
    expect(technical).toHaveLength(1);
  });
});

describe("buildDeliverySummary", () => {
  it("reports a clean interaction scan as ok with counts in the sentence", () => {
    const items = buildDeliverySummary([
      report({
        check_type: "INTERACTION_SCAN",
        status: "PASS",
        results: { interactiveElementsFound: 52, clickedCount: 3, consoleErrors: [] },
      }),
    ]);

    expect(items).toEqual([
      { ok: true, text: "Sitede 52 etkileşimli öğe bulundu, 3 tanesi hatasız çalıştı." },
    ]);
  });

  it("flags an interaction scan with console errors as not ok", () => {
    const items = buildDeliverySummary([
      report({
        check_type: "INTERACTION_SCAN",
        status: "PARTIAL",
        results: { interactiveElementsFound: 10, clickedCount: 2, consoleErrors: ["TypeError: x"] },
      }),
    ]);

    expect(items[0]?.ok).toBe(false);
    expect(items[0]?.text).toContain("1 konsol hatası");
  });

  it("treats zero forms found as ok, distinct from forms with no issues", () => {
    const zeroForms = buildDeliverySummary([
      report({ check_type: "FORM_VALIDATION", results: { formsFound: 0, issues: [] } }),
    ]);
    expect(zeroForms[0]).toEqual({ ok: true, text: "Sayfada test edilecek form bulunamadı." });

    const cleanForms = buildDeliverySummary([
      report({ check_type: "FORM_VALIDATION", results: { formsFound: 2, issues: [] } }),
    ]);
    expect(cleanForms[0]).toEqual({ ok: true, text: "2 form tespit edildi, hepsi sorunsuz çalışıyor." });
  });

  it("flags forms with issues as not ok", () => {
    const items = buildDeliverySummary([
      report({
        check_type: "FORM_VALIDATION",
        status: "FAIL",
        results: { formsFound: 3, issues: [{ formIndex: 0, issue: "no submit button" }] },
      }),
    ]);
    expect(items[0]).toEqual({ ok: false, text: "3 formdan 1 tanesinde sorun tespit edildi." });
  });

  it("reports dead links as ok only when brokenCount is zero", () => {
    const clean = buildDeliverySummary([
      report({ check_type: "DEAD_LINKS", results: { totalLinks: 49, brokenCount: 0, brokenLinks: [] } }),
    ]);
    expect(clean[0]).toEqual({ ok: true, text: "49 link tarandı, kırık link bulunmadı." });

    const broken = buildDeliverySummary([
      report({
        check_type: "DEAD_LINKS",
        status: "FAIL",
        results: { totalLinks: 49, brokenCount: 2, brokenLinks: [] },
      }),
    ]);
    expect(broken[0]).toEqual({ ok: false, text: "49 linkten 2 tanesi kırık çıktı." });
  });

  it("reports visual overflow as ok only when no overflows were found", () => {
    const clean = buildDeliverySummary([
      report({
        check_type: "VISUAL_OVERFLOW",
        results: { viewportsTested: [375, 768, 1440], overflows: [] },
      }),
    ]);
    expect(clean[0]).toEqual({
      ok: true,
      text: "3 farklı ekran genişliğinde görünüm test edildi, taşma sorunu bulunmadı.",
    });

    const broken = buildDeliverySummary([
      report({
        check_type: "VISUAL_OVERFLOW",
        status: "FAIL",
        results: { viewportsTested: [375], overflows: [{ width: 375, overflowPx: 40 }] },
      }),
    ]);
    expect(broken[0]).toEqual({ ok: false, text: "1 ekran genişliğinde yatay taşma tespit edildi." });
  });

  it("excludes ERROR-status modules entirely -- a failed scanner says nothing about the site", () => {
    const items = buildDeliverySummary([
      report({
        check_type: "INTERACTION_SCAN",
        status: "ERROR",
        results: { interactiveElementsFound: 0, clickedCount: 0, consoleErrors: [] },
      }),
      report({ check_type: "DEAD_LINKS", results: { totalLinks: 10, brokenCount: 0, brokenLinks: [] } }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.text).toContain("link tarandı");
  });

  it("omits a line for any evidence module that never ran, without erroring", () => {
    const items = buildDeliverySummary([
      report({ check_type: "DEAD_LINKS", results: { totalLinks: 5, brokenCount: 0, brokenLinks: [] } }),
    ]);
    expect(items).toHaveLength(1);
  });

  it("ignores technical modules entirely, even if present in the input", () => {
    const items = buildDeliverySummary([
      report({ check_type: "SEO_META", status: "FAIL", results: {} }),
      report({ check_type: "ACCESSIBILITY", status: "FAIL", results: {} }),
    ]);
    expect(items).toHaveLength(0);
  });

  it("always orders lines interaction -> forms -> links -> overflow, regardless of input order", () => {
    const items = buildDeliverySummary([
      report({
        check_type: "VISUAL_OVERFLOW",
        results: { viewportsTested: [375], overflows: [] },
      }),
      report({ check_type: "DEAD_LINKS", results: { totalLinks: 1, brokenCount: 0, brokenLinks: [] } }),
      report({ check_type: "FORM_VALIDATION", results: { formsFound: 0, issues: [] } }),
      report({
        check_type: "INTERACTION_SCAN",
        results: { interactiveElementsFound: 1, clickedCount: 1, consoleErrors: [] },
      }),
    ]);

    expect(items.map((i) => i.text)).toEqual([
      expect.stringContaining("etkileşimli öğe"),
      expect.stringContaining("form bulunamadı"),
      expect.stringContaining("link tarandı"),
      expect.stringContaining("ekran genişliğinde görünüm"),
    ]);
  });
});

describe("computeOverallStatus", () => {
  it("scores from evidence modules only -- a technical FAIL does not drag down a clean evidence set", () => {
    const status = computeOverallStatus([
      report({ check_type: "DEAD_LINKS", status: "PASS" }),
      report({ check_type: "INTERACTION_SCAN", status: "PASS" }),
      report({ check_type: "ACCESSIBILITY", status: "FAIL" }),
    ]);
    expect(status).toBe("PASS");
  });

  it("returns FAIL when any evidence module failed, ignoring a passing technical module", () => {
    const status = computeOverallStatus([
      report({ check_type: "DEAD_LINKS", status: "FAIL" }),
      report({ check_type: "SEO_META", status: "PASS" }),
    ]);
    expect(status).toBe("FAIL");
  });

  it("returns PARTIAL when the worst evidence result is PARTIAL", () => {
    const status = computeOverallStatus([
      report({ check_type: "DEAD_LINKS", status: "PASS" }),
      report({ check_type: "INTERACTION_SCAN", status: "PARTIAL" }),
    ]);
    expect(status).toBe("PARTIAL");
  });

  it("falls back to technical modules when no evidence module ran, so the badge is never silently blank", () => {
    const status = computeOverallStatus([report({ check_type: "SEO_META", status: "FAIL" })]);
    expect(status).toBe("FAIL");
  });

  it("returns ERROR for an empty ran-reports list", () => {
    expect(computeOverallStatus([])).toBe("ERROR");
  });
});

describe("computeDocumentSeal", () => {
  it("returns null for an empty report list", () => {
    expect(computeDocumentSeal([])).toBeNull();
  });

  it("is deterministic and order-independent", () => {
    const a = report({ check_type: "DEAD_LINKS", document_sha256: "hash-a" });
    const b = report({ check_type: "INTERACTION_SCAN", document_sha256: "hash-b" });

    expect(computeDocumentSeal([a, b])).toBe(computeDocumentSeal([b, a]));
  });

  it("changes when any module's status or seal changes", () => {
    const a = report({ check_type: "DEAD_LINKS", status: "PASS", document_sha256: "hash-a" });
    const aChanged = report({ check_type: "DEAD_LINKS", status: "FAIL", document_sha256: "hash-a" });

    expect(computeDocumentSeal([a])).not.toBe(computeDocumentSeal([aChanged]));
  });
});
