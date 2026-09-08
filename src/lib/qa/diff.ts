import type { StandaloneCheckType } from "@/lib/validations/standalone-qa";

/**
 * What changed between two scans of the same site.
 *
 * This is the monitoring subscription's actual product. Re-running a scan on a
 * schedule is worth nothing on its own -- the customer already knows their
 * site has 2 contrast violations, they read it last week. What they cannot get
 * anywhere else is "the deploy you shipped last night pushed LCP from 1.8s to
 * 4.2s". So the scheduled run emails only when this returns something.
 *
 * Deliberately a pure function over two result payloads: no database, no
 * network, no clock. That keeps it testable, and keeps the notification
 * decision ("is there news?") separate from the delivery of it.
 */

/** One human-readable change, plus enough structure to sort and style it. */
export type ScanChange = {
  checkType: StandaloneCheckType;
  /** WORSE and BETTER are movements in the customer's outcome, not in the raw
   * number: fewer broken links is BETTER, a higher LCP is WORSE. */
  direction: "WORSE" | "BETTER";
  /** Short Turkish sentence, ready to drop into an email line. */
  summary: string;
};

export type ScanReportLike = {
  checkType: StandaloneCheckType;
  status: string;
  results: unknown;
};

/** Metric deltas below this are noise, not news. Lighthouse's own numbers move
 * a few points between identical runs (network jitter, CPU contention on the
 * runner), and a subscription that emails about a 3-point score wobble trains
 * the customer to ignore it -- which costs more than missing a small change. */
const PERFORMANCE_SCORE_NOISE = 5;
const TIMING_NOISE_MS = 400;
const CLS_NOISE = 0.02;

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function field(results: unknown, key: string): unknown {
  if (typeof results !== "object" || results === null) return undefined;
  return (results as Record<string, unknown>)[key];
}

function arrayLength(results: unknown, key: string): number | null {
  const value = field(results, key);
  return Array.isArray(value) ? value.length : null;
}

/** A count going up is worse for the customer; going down is better. */
function countChange(
  checkType: StandaloneCheckType,
  before: number | null,
  after: number | null,
  noun: string,
): ScanChange | null {
  if (before === null || after === null || before === after) return null;
  const worse = after > before;
  return {
    checkType,
    direction: worse ? "WORSE" : "BETTER",
    summary: worse
      ? `${noun}: ${before} → ${after} (${after - before} yeni)`
      : `${noun}: ${before} → ${after} (${before - after} tanesi düzelmiş)`,
  };
}

/** A timing/score metric, where which direction is "worse" depends on the
 * metric: a higher Lighthouse score is better, a higher LCP is worse. */
function metricChange(
  checkType: StandaloneCheckType,
  before: number | null,
  after: number | null,
  opts: { label: string; noise: number; higherIsBetter: boolean; format: (v: number) => string },
): ScanChange | null {
  if (before === null || after === null) return null;
  if (Math.abs(after - before) < opts.noise) return null;
  const improved = opts.higherIsBetter ? after > before : after < before;
  return {
    checkType,
    direction: improved ? "BETTER" : "WORSE",
    summary: `${opts.label}: ${opts.format(before)} → ${opts.format(after)}`,
  };
}

const ms = (v: number) => `${(v / 1000).toFixed(2)}s`;

/** Per-module comparison. Each branch only reads fields that module writes. */
function diffModule(checkType: StandaloneCheckType, before: unknown, after: unknown): ScanChange[] {
  switch (checkType) {
    case "ACCESSIBILITY": {
      const change = countChange(
        checkType,
        num(field(before, "violationCount")),
        num(field(after, "violationCount")),
        "Erişilebilirlik ihlali",
      );
      return change ? [change] : [];
    }
    case "PERFORMANCE": {
      const out: ScanChange[] = [];
      const score = metricChange(
        checkType,
        num(field(before, "performanceScore")),
        num(field(after, "performanceScore")),
        { label: "Performans skoru", noise: PERFORMANCE_SCORE_NOISE, higherIsBetter: true, format: (v) => `${v}/100` },
      );
      if (score) out.push(score);
      const lcp = metricChange(checkType, num(field(before, "lcpMs")), num(field(after, "lcpMs")), {
        label: "LCP",
        noise: TIMING_NOISE_MS,
        higherIsBetter: false,
        format: ms,
      });
      if (lcp) out.push(lcp);
      const cls = metricChange(checkType, num(field(before, "clsScore")), num(field(after, "clsScore")), {
        label: "CLS",
        noise: CLS_NOISE,
        higherIsBetter: false,
        format: (v) => v.toFixed(3),
      });
      if (cls) out.push(cls);
      return out;
    }
    case "DEAD_LINKS": {
      const change = countChange(
        checkType,
        num(field(before, "brokenCount")),
        num(field(after, "brokenCount")),
        "Kırık link",
      );
      return change ? [change] : [];
    }
    case "SEO_META": {
      const beforeMissing =
        (arrayLength(before, "missingCritical") ?? 0) + (arrayLength(before, "missingRecommended") ?? 0);
      const afterMissing =
        (arrayLength(after, "missingCritical") ?? 0) + (arrayLength(after, "missingRecommended") ?? 0);
      const change = countChange(checkType, beforeMissing, afterMissing, "Eksik SEO etiketi");
      return change ? [change] : [];
    }
    case "VISUAL_OVERFLOW": {
      const change = countChange(
        checkType,
        arrayLength(before, "overflows"),
        arrayLength(after, "overflows"),
        "Mobil/görsel taşma",
      );
      return change ? [change] : [];
    }
    case "FORM_VALIDATION": {
      const change = countChange(checkType, arrayLength(before, "issues"), arrayLength(after, "issues"), "Form sorunu");
      return change ? [change] : [];
    }
    case "INTERACTION_SCAN": {
      const change = countChange(
        checkType,
        arrayLength(before, "consoleErrors"),
        arrayLength(after, "consoleErrors"),
        "Konsol hatası",
      );
      return change ? [change] : [];
    }
  }
}

/**
 * Compares the newest scan against the one before it.
 *
 * A module present in only one of the two runs produces no change: a module
 * that failed (ERROR) says nothing about the site, and treating "we could not
 * measure it" as "it went to zero" would report a fake improvement -- exactly
 * the class of false reporting the ERROR status exists to prevent.
 */
export function diffScans(previous: ScanReportLike[], current: ScanReportLike[]): ScanChange[] {
  const previousByType = new Map(previous.filter((r) => r.status !== "ERROR").map((r) => [r.checkType, r]));

  const changes: ScanChange[] = [];
  for (const report of current) {
    if (report.status === "ERROR") continue;
    const before = previousByType.get(report.checkType);
    if (!before) continue;
    changes.push(...diffModule(report.checkType, before.results, report.results));
  }

  // Regressions first: the reason the customer opens the email.
  return changes.sort((a, b) => (a.direction === b.direction ? 0 : a.direction === "WORSE" ? -1 : 1));
}

/** Whether a scheduled run is worth an email at all. */
export function hasNews(changes: ScanChange[]): boolean {
  return changes.length > 0;
}
