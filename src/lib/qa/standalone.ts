import "server-only";

import crypto from "crypto";

import { createServer } from "net";

import AxeBuilder from "@axe-core/playwright";
import * as cheerio from "cheerio";
import { LinkChecker } from "linkinator";
import lighthouse from "lighthouse";
import { chromium as playwrightChromium } from "playwright-core";

import { openStagingPage } from "@/lib/qa/agent";
import { resolveChromium } from "@/lib/qa/chromium";
import { isBlockedTarget } from "@/lib/qa/ssrf-guard";
import {
  STANDALONE_PACKAGES,
  type StandaloneCheckType,
  type StandalonePackageId,
} from "@/lib/validations/standalone-qa";

/** The seal every report row carries. Exported because a module that never
 * ran is recorded too (status ERROR, see createOrderAndRunCheck) and has to
 * be sealed the same way as one that produced findings. */
export function hashResults(results: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(results)).digest("hex");
}

/**
 * Fetches raw HTML without a browser -- for checks (SEO/meta) that only
 * need the document, never JS execution. Its own SSRF check, same as
 * runPerformanceCheck: this never touches openStagingPage(), so nothing
 * else guards it.
 */
async function fetchHtmlSafely(url: string): Promise<string | null> {
  if (await isBlockedTarget(url)) {
    console.error(`[standalone-qa] refusing ${url}: resolves to a private/internal address`);
    return null;
  }
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`[standalone-qa] fetch failed for ${url}`, err);
    return null;
  }
}

/** axe-core's own impact scale, trimmed to what a report needs to show. */
type AxeViolation = {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  description: string;
  help: string;
  helpUrl: string;
  nodeCount: number;
};

export type AccessibilityResults = {
  violationCount: number;
  passCount: number;
  violations: AxeViolation[];
};

export type AccessibilityCheckOutcome = {
  status: "PASS" | "FAIL" | "PARTIAL";
  results: AccessibilityResults;
  documentSha256: string;
};

/**
 * Runs one standalone accessibility check to completion: opens the URL,
 * runs axe-core's WCAG 2.1 AA ruleset against the loaded DOM, and reduces the
 * result to a PASS/FAIL/PARTIAL verdict. Deterministic -- no LLM call, no
 * step budget, no escalation path -- so unlike processTier2Order() this runs
 * synchronously inside the server action that creates the order rather than
 * via after()/a cron sweep: there is no multi-step agent loop whose latency
 * would need to be hidden from the request.
 *
 * Null on any failure to load the page (same contract as openStagingPage,
 * which this reuses instead of resolving and relaunching chromium itself).
 */
export async function runAccessibilityCheck(url: string): Promise<AccessibilityCheckOutcome | null> {
  const opened = await openStagingPage(url);
  if (!opened) return null;

  const { browser, page } = opened;
  try {
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const violations: AxeViolation[] = axeResults.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? null,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodeCount: v.nodes.length,
    }));

    const results: AccessibilityResults = {
      violationCount: violations.length,
      passCount: axeResults.passes.length,
      violations,
    };

    // Deterministic reduction, not a judgment call: any critical/serious
    // finding fails the check outright; minor/moderate-only findings are a
    // partial pass; zero findings is a clean pass. No LLM in this path to
    // ask "does this matter" -- axe-core's own impact rating decides.
    const hasSevere = violations.some((v) => v.impact === "critical" || v.impact === "serious");
    const status: AccessibilityCheckOutcome["status"] =
      violations.length === 0 ? "PASS" : hasSevere ? "FAIL" : "PARTIAL";

    const documentSha256 = hashResults(results);

    return { status, results, documentSha256 };
  } catch (err) {
    console.error(`[standalone-qa] axe-core scan failed for ${url}`, err);
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Lighthouse's own metric names, trimmed to what a report needs to show. */
export type PerformanceResults = {
  performanceScore: number;
  lcpMs: number;
  fcpMs: number;
  clsScore: number;
  totalBlockingTimeMs: number;
};

export type PerformanceCheckOutcome = {
  status: "PASS" | "FAIL" | "PARTIAL";
  results: PerformanceResults;
  documentSha256: string;
};

/**
 * Reserves an OS-assigned free TCP port and immediately releases it, so the
 * caller can hand a specific --remote-debugging-port to Chrome instead of
 * discovering whatever port it picked afterwards. There is a narrow race
 * (something else could claim the port between release and Chrome's bind),
 * but only against other processes on the same Lambda instance, which this
 * codebase does not run concurrently against itself.
 */
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (!address || typeof address !== "object") {
        server.close(() => reject(new Error("could not determine a free port")));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

/**
 * Runs one standalone Core Web Vitals check via Lighthouse.
 *
 * Launches its own Chromium via Playwright -- the same launch path
 * openStagingPage() already proves reliable, rather than chrome-launcher's
 * separate spawn-and-detect-the-DevTools-port mechanism, which turned out
 * not to work against @sparticuz/chromium's serverless build: chrome-
 * launcher believed it had a port, but nothing was listening on it
 * (ECONNREFUSED), a documented flaky combination in the wild
 * (GoogleChrome/lighthouse#2661, #3275), not something a next.config.ts
 * tracing tweak can fix. Instead: pick a free port ourselves, tell Chrome
 * to open its DevTools protocol there via --remote-debugging-port, and
 * point Lighthouse at that same port. Playwright still owns the actual
 * process; Lighthouse only needs a CDP port to attach to, not to be the one
 * that launched it.
 *
 * Unlike runAccessibilityCheck, this does not reuse openStagingPage() --
 * Lighthouse needs its own tab, and sharing one with another check would
 * mean whichever failed first takes the other down with it. That means the
 * SSRF guard openStagingPage() applies internally has to be re-checked
 * explicitly here, first, before any Chrome process is launched against the
 * target.
 */
export async function runPerformanceCheck(url: string): Promise<PerformanceCheckOutcome | null> {
  if (await isBlockedTarget(url)) {
    console.error(`[standalone-qa] refusing ${url}: resolves to a private/internal address`);
    return null;
  }

  // resolveChromium() picks the binary for this runtime (sparticuz on
  // Vercel, a real local Chrome otherwise) and verifies it exists, so the
  // "no file at all" case is already ruled out by the time we get here.
  const runtime = await resolveChromium();
  if (!runtime) return null;

  const debugPort = await getFreePort();

  let browser: Awaited<ReturnType<typeof playwrightChromium.launch>> | undefined;
  try {
    browser = await playwrightChromium.launch({
      executablePath: runtime.executablePath,
      args: [...runtime.args, `--remote-debugging-port=${debugPort}`],
      headless: true,
    });
  } catch (err) {
    console.error(`[standalone-qa] failed to launch chrome for lighthouse scan of ${url}`, err);
    return null;
  }

  // lighthouse's own report-generator module reads its flow-report HTML/CSS
  // assets via a runtime path.join(__dirname, '../../flow-report/...') that
  // Vercel's file tracer cannot see statically (outputFileTracingIncludes in
  // next.config.ts is the fix for that), so on a deploy where that file is
  // still missing, lighthouse() throws ENOENT from somewhere in its own
  // internals as an unhandled rejection rather than surfacing through the
  // returned promise -- verified 2026-09-09: it crashed the whole server,
  // not just this request. Guarding it turns "every in-flight request dies"
  // into "this one performance check comes back ERROR."
  try {
    const runnerResult = await new Promise<Awaited<ReturnType<typeof lighthouse>>>((resolve, reject) => {
      const onCrash = (err: unknown) => reject(err instanceof Error ? err : new Error(String(err)));
      process.once("uncaughtException", onCrash);
      process.once("unhandledRejection", onCrash);
      const settle = () => {
        process.removeListener("uncaughtException", onCrash);
        process.removeListener("unhandledRejection", onCrash);
      };
      lighthouse(url, {
        port: debugPort,
        output: "json",
        onlyCategories: ["performance"],
        logLevel: "error",
      }).then((result) => {
        settle();
        resolve(result);
      }).catch((err: unknown) => {
        settle();
        reject(err);
      });
    });
    if (!runnerResult?.lhr) return null;

    const { lhr } = runnerResult;
    const audits = lhr.audits;
    const results: PerformanceResults = {
      performanceScore: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      lcpMs: Math.round(audits["largest-contentful-paint"]?.numericValue ?? 0),
      fcpMs: Math.round(audits["first-contentful-paint"]?.numericValue ?? 0),
      clsScore: Number((audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
      totalBlockingTimeMs: Math.round(audits["total-blocking-time"]?.numericValue ?? 0),
    };

    // Deterministic reduction on Lighthouse's own 0-100 performance score --
    // no LLM judgment here either. Thresholds match Lighthouse's own
    // published "good/needs improvement/poor" score bands.
    const status: PerformanceCheckOutcome["status"] =
      results.performanceScore >= 90 ? "PASS" : results.performanceScore >= 50 ? "PARTIAL" : "FAIL";

    const documentSha256 = hashResults(results);

    return { status, results, documentSha256 };
  } catch (err) {
    console.error(`[standalone-qa] lighthouse scan failed for ${url}`, err);
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

export type SeoMetaResults = {
  title: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  canonical: string | null;
  hasFavicon: boolean;
  missingCritical: string[];
  missingRecommended: string[];
};

export type SeoMetaCheckOutcome = {
  status: "PASS" | "FAIL" | "PARTIAL";
  results: SeoMetaResults;
  documentSha256: string;
};

/**
 * Runs a static SEO/meta-tag check -- no browser at all, just fetch() + a
 * Cheerio parse of the raw HTML. This is the one check type where that's
 * actually correct rather than a shortcut: a page's <title>/OG/canonical
 * tags are meant to be readable by crawlers that don't execute JS either,
 * and any modern framework's metadata API (this project's own Next.js
 * pages included) renders them server-side into the initial HTML already.
 */
export async function runSeoMetaCheck(url: string): Promise<SeoMetaCheckOutcome | null> {
  const html = await fetchHtmlSafely(url);
  if (html === null) return null;

  try {
    const $ = cheerio.load(html);
    const attr = (selector: string, attrName: string) => $(selector).first().attr(attrName)?.trim() || null;

    const results: SeoMetaResults = {
      title: $("title").first().text().trim() || null,
      metaDescription: attr('meta[name="description"]', "content"),
      ogTitle: attr('meta[property="og:title"]', "content"),
      ogDescription: attr('meta[property="og:description"]', "content"),
      ogImage: attr('meta[property="og:image"]', "content"),
      twitterCard: attr('meta[name="twitter:card"]', "content"),
      canonical: attr('link[rel="canonical"]', "href"),
      hasFavicon: $('link[rel="icon"], link[rel="shortcut icon"]').length > 0,
      missingCritical: [],
      missingRecommended: [],
    };

    // title/canonical missing is a real crawler/SEO problem (FAIL); the
    // rest degrade the social-share preview but not indexability (PARTIAL).
    if (!results.title) results.missingCritical.push("title");
    if (!results.canonical) results.missingCritical.push("canonical");
    if (!results.metaDescription) results.missingRecommended.push("meta description");
    if (!results.ogTitle) results.missingRecommended.push("og:title");
    if (!results.ogImage) results.missingRecommended.push("og:image");
    if (!results.twitterCard) results.missingRecommended.push("twitter:card");
    if (!results.hasFavicon) results.missingRecommended.push("favicon");

    const status: SeoMetaCheckOutcome["status"] =
      results.missingCritical.length > 0 ? "FAIL" : results.missingRecommended.length > 0 ? "PARTIAL" : "PASS";

    return { status, results, documentSha256: hashResults(results) };
  } catch (err) {
    console.error(`[standalone-qa] SEO/meta parse failed for ${url}`, err);
    return null;
  }
}

export type DeadLinksResults = {
  totalLinks: number;
  brokenCount: number;
  brokenLinks: { url: string; status: number }[];
};

export type DeadLinksCheckOutcome = {
  status: "PASS" | "FAIL" | "PARTIAL";
  results: DeadLinksResults;
  documentSha256: string;
};

/**
 * Checks every link found on the one page (recurse: false -- this is not a
 * whole-site crawl) for a broken (4xx/5xx/unreachable) target, via
 * linkinator. Residual risk, accepted rather than closed: linkinator issues
 * its own HEAD/GET to every discovered link, which could in principle probe
 * an internal address if the page itself links to one -- a much narrower
 * surface than the DNS-rebinding gap ssrf-guard.ts already documents (this
 * needs the target page to contain such a link, and only leaks a status
 * code, never a response body), so it's noted here rather than re-plumbing
 * linkinator's internals to route through isBlockedTarget per-link.
 */
export async function runDeadLinksCheck(url: string): Promise<DeadLinksCheckOutcome | null> {
  if (await isBlockedTarget(url)) {
    console.error(`[standalone-qa] refusing ${url}: resolves to a private/internal address`);
    return null;
  }

  try {
    const checker = new LinkChecker();
    const result = await checker.check({ path: url, recurse: false, timeout: 15000 });

    const broken = result.links.filter((l) => l.state === "BROKEN");
    const results: DeadLinksResults = {
      totalLinks: result.links.length,
      brokenCount: broken.length,
      brokenLinks: broken.slice(0, 50).map((l) => ({ url: l.url, status: l.status ?? 0 })),
    };

    const brokenRatio = results.totalLinks > 0 ? results.brokenCount / results.totalLinks : 0;
    const status: DeadLinksCheckOutcome["status"] =
      results.brokenCount === 0 ? "PASS" : brokenRatio <= 0.2 ? "PARTIAL" : "FAIL";

    return { status, results, documentSha256: hashResults(results) };
  } catch (err) {
    console.error(`[standalone-qa] link check failed for ${url}`, err);
    return null;
  }
}

export type VisualOverflowResults = {
  viewportsTested: number[];
  overflows: { width: number; overflowPx: number }[];
};

export type VisualOverflowCheckOutcome = {
  status: "PASS" | "FAIL" | "PARTIAL";
  results: VisualOverflowResults;
  documentSha256: string;
};

const OVERFLOW_VIEWPORTS = [320, 768, 1440];

/**
 * Loads the page at three widths (phone/tablet/desktop) and checks whether
 * the document itself is wider than its own viewport -- the classic
 * "yatay kaydırma var" complaint. Tolerance of 5px absorbs scrollbar
 * width/subpixel rounding, not a real overflow.
 */
export async function runVisualOverflowCheck(url: string): Promise<VisualOverflowCheckOutcome | null> {
  const opened = await openStagingPage(url);
  if (!opened) return null;

  const { browser, page } = opened;
  try {
    const overflows: VisualOverflowResults["overflows"] = [];
    for (const width of OVERFLOW_VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      const overflowPx = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflowPx > 5) overflows.push({ width, overflowPx });
    }

    const results: VisualOverflowResults = { viewportsTested: [...OVERFLOW_VIEWPORTS], overflows };
    // A phone-width overflow is the complaint this module exists for --
    // wider viewports overflowing is real but lower stakes.
    const status: VisualOverflowCheckOutcome["status"] = overflows.some((o) => o.width === 320)
      ? "FAIL"
      : overflows.length > 0
        ? "PARTIAL"
        : "PASS";

    return { status, results, documentSha256: hashResults(results) };
  } catch (err) {
    console.error(`[standalone-qa] visual overflow scan failed for ${url}`, err);
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

export type FormValidationResults = {
  formsFound: number;
  issues: { formIndex: number; issue: string }[];
};

export type FormValidationCheckOutcome = {
  status: "PASS" | "FAIL" | "PARTIAL";
  results: FormValidationResults;
  documentSha256: string;
};

/**
 * Inspects every <form>'s structure -- does it have a working submit
 * control, does it mark any field required, do email fields actually use
 * type="email". Deliberately never submits a form: this runs against
 * arbitrary third-party sites nobody here owns, and a real submit could
 * create a real signup/order/email on someone's production system. A
 * structural check catches the same class of real bug ("kayıt ol butonu
 * basmıyor" turns out to mean the button is disabled or missing) without
 * that risk.
 */
export async function runFormValidationCheck(url: string): Promise<FormValidationCheckOutcome | null> {
  const opened = await openStagingPage(url);
  if (!opened) return null;

  const { browser, page } = opened;
  try {
    const forms = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("form")).map((form) => {
        const fields = Array.from(form.querySelectorAll("input, textarea, select"));
        const emailFields = fields.filter(
          (el) => el instanceof HTMLInputElement && (el.type === "email" || /e-?mail/i.test(el.name + el.id)),
        );
        const emailFieldsTypedCorrectly = emailFields.filter(
          (el) => el instanceof HTMLInputElement && el.type === "email",
        );
        const submit = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
        return {
          fieldCount: fields.length,
          requiredCount: fields.filter((el) => el.hasAttribute("required")).length,
          emailFieldCount: emailFields.length,
          emailFieldsTypedCorrectly: emailFieldsTypedCorrectly.length,
          hasSubmitControl: submit !== null,
          submitDisabled: submit instanceof HTMLButtonElement || submit instanceof HTMLInputElement ? submit.disabled : false,
        };
      });
    });

    const issues: FormValidationResults["issues"] = [];
    forms.forEach((f, formIndex) => {
      if (!f.hasSubmitControl) issues.push({ formIndex, issue: "Gönder butonu bulunamadı" });
      if (f.submitDisabled) issues.push({ formIndex, issue: "Gönder butonu devre dışı bırakılmış" });
      if (f.fieldCount > 0 && f.requiredCount === 0) {
        issues.push({ formIndex, issue: "Hiçbir alan zorunlu (required) olarak işaretlenmemiş" });
      }
      if (f.emailFieldCount > f.emailFieldsTypedCorrectly) {
        issues.push({ formIndex, issue: "E-posta alanı type=\"email\" kullanmıyor -- tarayıcı doğrulaması çalışmaz" });
      }
    });

    const results: FormValidationResults = { formsFound: forms.length, issues };
    const status: FormValidationCheckOutcome["status"] =
      forms.length === 0 || issues.length === 0 ? "PASS" : issues.length <= 1 ? "PARTIAL" : "FAIL";

    return { status, results, documentSha256: hashResults(results) };
  } catch (err) {
    console.error(`[standalone-qa] form validation scan failed for ${url}`, err);
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

export type InteractionScanResults = {
  interactiveElementsFound: number;
  clickedCount: number;
  consoleErrors: string[];
};

export type InteractionScanCheckOutcome = {
  status: "PASS" | "FAIL" | "PARTIAL";
  results: InteractionScanResults;
  documentSha256: string;
};

const INTERACTION_CLICK_CAP = 40;

/**
 * A generic interaction smoke test -- fills every visible input with safe
 * placeholder data, clicks every visible non-submit link/button, and
 * watches for console/page errors. This is NOT "Agentic QA": there is no
 * LLM, it reads nothing about a project's specific acceptance criteria (the
 * standalone side has none), it only answers "does this site error out
 * under generic interaction". Never labeled as Agentic QA in copy for
 * exactly that reason.
 *
 * Never clicks a submit control (a <button> with no explicit type defaults
 * to type="submit" inside a form, per the HTML spec -- excluded on that
 * basis, not just an explicit type="submit"). This runs against arbitrary
 * third-party sites nobody here owns; a real form submission could create a
 * real signup/order/email on someone's production system, which filling
 * fields without submitting cannot.
 */
export async function runInteractionScanCheck(url: string): Promise<InteractionScanCheckOutcome | null> {
  const opened = await openStagingPage(url);
  if (!opened) return null;

  const { browser, page } = opened;
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message.slice(0, 300)));

  try {
    const originalUrl = url;
    const originOf = (href: string) => {
      try {
        return new URL(href).origin;
      } catch {
        return "";
      }
    };
    const startOrigin = originOf(page.url());

    await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll("input, textarea")) as (
        | HTMLInputElement
        | HTMLTextAreaElement
      )[];
      for (const el of fields) {
        if (el.hidden || el.disabled) continue;
        if (el instanceof HTMLInputElement && ["hidden", "submit", "button", "checkbox", "radio", "file"].includes(el.type)) {
          continue;
        }
        el.value = el instanceof HTMLInputElement && el.type === "email" ? "test@example.com" : "Test";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    const refs: string[] = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("a[href], button")) as HTMLElement[];
      const tagged: string[] = [];
      let n = 0;
      for (const el of els) {
        if (el.tagName === "BUTTON") {
          const type = (el.getAttribute("type") || "submit").toLowerCase();
          if (el.closest("form") && type !== "button") continue;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        el.setAttribute("data-qa-scan-ref", String(n));
        tagged.push(String(n));
        n++;
      }
      return tagged;
    });

    let clickedCount = 0;
    for (const ref of refs.slice(0, INTERACTION_CLICK_CAP)) {
      const locator = page.locator(`[data-qa-scan-ref="${ref}"]`);
      const visible = await locator.isVisible().catch(() => false);
      if (!visible) continue;

      await locator.click({ timeout: 2000 }).catch(() => {});
      clickedCount++;

      // Same guard agent.ts's own tool loop uses: a click that navigated
      // off-origin gets reversed, so later refs still target the intended
      // page rather than whatever site was linked to.
      if (originOf(page.url()) !== startOrigin) {
        await page.goto(originalUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
      }
    }

    const results: InteractionScanResults = {
      interactiveElementsFound: refs.length,
      clickedCount,
      consoleErrors: [...new Set(consoleErrors)].slice(0, 20),
    };
    const status: InteractionScanCheckOutcome["status"] =
      results.consoleErrors.length === 0 ? "PASS" : results.consoleErrors.length <= 2 ? "PARTIAL" : "FAIL";

    return { status, results, documentSha256: hashResults(results) };
  } catch (err) {
    console.error(`[standalone-qa] interaction scan failed for ${url}`, err);
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

export type StandaloneCheckOutcome =
  | AccessibilityCheckOutcome
  | PerformanceCheckOutcome
  | SeoMetaCheckOutcome
  | DeadLinksCheckOutcome
  | VisualOverflowCheckOutcome
  | FormValidationCheckOutcome
  | InteractionScanCheckOutcome;

/**
 * Dispatches to the right scan by check_type -- the one place
 * standalone-qa-actions.ts needs to know about, so adding another
 * check_type later is a new case here, not a new call site in the Server
 * Action.
 */
export async function runStandaloneCheck(
  checkType: StandaloneCheckType,
  url: string,
): Promise<StandaloneCheckOutcome | null> {
  switch (checkType) {
    case "ACCESSIBILITY":
      return runAccessibilityCheck(url);
    case "PERFORMANCE":
      return runPerformanceCheck(url);
    case "SEO_META":
      return runSeoMetaCheck(url);
    case "DEAD_LINKS":
      return runDeadLinksCheck(url);
    case "VISUAL_OVERFLOW":
      return runVisualOverflowCheck(url);
    case "FORM_VALIDATION":
      return runFormValidationCheck(url);
    case "INTERACTION_SCAN":
      return runInteractionScanCheck(url);
  }
}

export type PackageCheckOutcome = {
  checkType: StandaloneCheckType;
  outcome: StandaloneCheckOutcome | null;
};

/**
 * Runs all module checks included in the given package, one at a time.
 *
 * onModuleComplete fires after each module settles, before the next one
 * starts -- runScanForPaidOrder uses it to save each report row as soon as
 * it exists rather than batching every row until the whole package
 * finishes, so a customer watching the order fill in sees modules complete
 * one by one instead of everything appearing at once at the very end.
 */
export async function runStandalonePackage(
  packageId: StandalonePackageId,
  url: string,
  onModuleComplete?: (result: PackageCheckOutcome) => void | Promise<void>,
): Promise<PackageCheckOutcome[]> {
  const pkg = STANDALONE_PACKAGES[packageId];
  if (!pkg) return [];

  const results: PackageCheckOutcome[] = [];
  for (const checkType of pkg.modules) {
    const outcome = await runStandaloneCheck(checkType, url);
    const result = { checkType, outcome };
    results.push(result);
    await onModuleComplete?.(result);
  }
  return results;
}

