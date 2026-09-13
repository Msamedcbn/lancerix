import { createHash } from "crypto";

import type { StandaloneQaReport } from "@/lib/data/standalone-qa";
import type {
  DeadLinksResults,
  FormValidationResults,
  InteractionScanResults,
  VisualOverflowResults,
} from "@/lib/qa/standalone";

/**
 * "Was the delivered work actually there and working" vs. "does the site
 * meet QA/marketing standards" are different questions with different
 * audiences. A dispute arbiter (Upwork, Brief, a client's lawyer) cares
 * about the first; SEO_META and PERFORMANCE answer the second and are
 * rarely what a delivery dispute is about. Evidence modules render first
 * on the public report and feed the plain-language summary below; technical
 * modules stay available but demoted to a clearly labeled secondary section.
 */
export const EVIDENCE_CHECK_TYPES = [
  "INTERACTION_SCAN",
  "FORM_VALIDATION",
  "DEAD_LINKS",
  "VISUAL_OVERFLOW",
] as const;
export const TECHNICAL_CHECK_TYPES = ["ACCESSIBILITY", "PERFORMANCE", "SEO_META"] as const;

export function isEvidenceCheckType(checkType: string | null): boolean {
  return EVIDENCE_CHECK_TYPES.includes((checkType ?? "") as (typeof EVIDENCE_CHECK_TYPES)[number]);
}

export function splitByEvidenceValue(reports: StandaloneQaReport[]): {
  evidence: StandaloneQaReport[];
  technical: StandaloneQaReport[];
} {
  const order = [...EVIDENCE_CHECK_TYPES, ...TECHNICAL_CHECK_TYPES];
  const byOrder = (a: StandaloneQaReport, b: StandaloneQaReport) =>
    order.indexOf((a.check_type ?? "") as (typeof order)[number]) -
    order.indexOf((b.check_type ?? "") as (typeof order)[number]);

  return {
    evidence: reports.filter((r) => isEvidenceCheckType(r.check_type)).sort(byOrder),
    technical: reports.filter((r) => !isEvidenceCheckType(r.check_type)).sort(byOrder),
  };
}

export type SummaryItem = { ok: boolean; text: string };

/**
 * Translates the evidence modules' raw findings into sentences a
 * non-technical reader (an arbiter, a client, the freelancer themselves)
 * can act on without knowing what CLS or axe-core are. Only modules that
 * actually ran contribute a line -- an ERROR row says nothing about the
 * site, so it stays out of the summary same as in computeOverallStatus.
 */
export function buildDeliverySummary(reports: StandaloneQaReport[]): SummaryItem[] {
  const byType = new Map(reports.map((r) => [r.check_type, r]));
  const items: SummaryItem[] = [];

  const interaction = byType.get("INTERACTION_SCAN");
  if (interaction && interaction.status !== "ERROR") {
    const results = interaction.results as InteractionScanResults;
    const hasErrors = results.consoleErrors.length > 0;
    items.push({
      ok: !hasErrors,
      text: hasErrors
        ? `Sitede ${results.interactiveElementsFound} etkileşimli öğe bulundu, ${results.clickedCount} tanesi test edildi -- test sırasında ${results.consoleErrors.length} konsol hatası tespit edildi.`
        : `Sitede ${results.interactiveElementsFound} etkileşimli öğe bulundu, ${results.clickedCount} tanesi hatasız çalıştı.`,
    });
  }

  const forms = byType.get("FORM_VALIDATION");
  if (forms && forms.status !== "ERROR") {
    const results = forms.results as FormValidationResults;
    items.push({
      ok: results.issues.length === 0,
      text:
        results.formsFound === 0
          ? "Sayfada test edilecek form bulunamadı."
          : results.issues.length === 0
            ? `${results.formsFound} form tespit edildi, hepsi sorunsuz çalışıyor.`
            : `${results.formsFound} formdan ${results.issues.length} tanesinde sorun tespit edildi.`,
    });
  }

  const links = byType.get("DEAD_LINKS");
  if (links && links.status !== "ERROR") {
    const results = links.results as DeadLinksResults;
    items.push({
      ok: results.brokenCount === 0,
      text:
        results.brokenCount === 0
          ? `${results.totalLinks} link tarandı, kırık link bulunmadı.`
          : `${results.totalLinks} linkten ${results.brokenCount} tanesi kırık çıktı.`,
    });
  }

  const overflow = byType.get("VISUAL_OVERFLOW");
  if (overflow && overflow.status !== "ERROR") {
    const results = overflow.results as VisualOverflowResults;
    items.push({
      ok: results.overflows.length === 0,
      text:
        results.overflows.length === 0
          ? `${results.viewportsTested.length} farklı ekran genişliğinde görünüm test edildi, taşma sorunu bulunmadı.`
          : `${results.overflows.length} ekran genişliğinde yatay taşma tespit edildi.`,
    });
  }

  return items;
}

export type OverallStatus = "PASS" | "PARTIAL" | "FAIL" | "ERROR";

/**
 * The document's headline verdict, scored from the evidence modules only --
 * "was this delivered and working", not "does it meet QA/marketing
 * standards". Folding ACCESSIBILITY/PERFORMANCE/SEO_META in here would let a
 * color-contrast finding badge the whole report "Serious Issue" while the
 * delivery summary right below it reads clean, contradicting itself on the
 * same page. Falls back to every ran module for the rare package with zero
 * evidence modules, so the badge is never silently blank. `ranReports` must
 * already exclude ERROR rows -- a module that failed to run says nothing
 * about the site and does not belong in the verdict.
 */
export function computeOverallStatus(ranReports: StandaloneQaReport[]): OverallStatus {
  const ranEvidenceReports = ranReports.filter((r) => isEvidenceCheckType(r.check_type));
  const verdictSource = ranEvidenceReports.length > 0 ? ranEvidenceReports : ranReports;

  if (verdictSource.some((r) => r.status === "FAIL")) return "FAIL";
  if (verdictSource.some((r) => r.status === "PARTIAL")) return "PARTIAL";
  if (verdictSource.length > 0) return "PASS";
  return "ERROR";
}

/**
 * One seal for the whole document, derived from every module's own seal
 * rather than borrowing a single row's hash and captioning it as the
 * report's own. Sorted, because PostgREST does not promise row order and a
 * seal that changes between two renders of the same data is not a seal.
 */
export function computeDocumentSeal(reports: StandaloneQaReport[]): string | null {
  if (reports.length === 0) return null;

  return createHash("sha256")
    .update(
      reports
        .map((r) => `${r.check_type ?? ""}:${r.status}:${r.document_sha256}`)
        .sort()
        .join("|"),
    )
    .digest("hex");
}
