import "server-only";

import { existsSync } from "fs";

import sparticuz from "@sparticuz/chromium";
import { getChromePath } from "chrome-launcher";
import { chromium as playwrightChromium } from "playwright-core";

/**
 * The single place that answers "which Chrome binary do the QA checks run
 * against?" -- for both browser engines this codebase drives: Playwright
 * (openStagingPage, and every axe-core/DOM check built on it) and
 * chrome-launcher (Lighthouse, which needs its own CDP-attached Chrome).
 *
 * In production that is @sparticuz/chromium: a Linux build packaged for
 * Lambda-style runtimes, and the only Chrome that exists on Vercel. Off
 * that runtime it is simply the wrong binary -- executablePath() returns a
 * fixed temp location (%TEMP%\chromium on Windows) that either does not
 * exist or holds a Linux ELF this OS cannot spawn.
 *
 * The cost of not handling that was measured, not hypothetical: a full
 * package scan on a dev machine failed to launch a browser for 5 of the 7
 * modules (accessibility, performance, visual overflow, form validation,
 * interaction scan), leaving only the two fetch-only checks (SEO/meta,
 * dead links) with results -- a run that reports "no findings" for most of
 * what the customer paid for while looking like it completed.
 *
 * So: serverless keeps sparticuz; everywhere else resolves a real local
 * Chrome. `null` means no usable browser was found, which every caller
 * already handles as a graceful per-module failure rather than a crash.
 */

export type ChromiumRuntime = {
  executablePath: string;
  /** Flags appropriate for the resolved binary -- NOT interchangeable
   * between runtimes; see LOCAL_CHROMIUM_ARGS. */
  args: string[];
};

/** Lambda-shaped runtimes, where @sparticuz/chromium is the only option.
 * VERCEL covers our own deployment; the AWS_* pair covers a bare Lambda
 * (Vercel functions set them too, so either check alone would do -- both
 * are here so this stays correct if we ever deploy elsewhere). */
function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV,
  );
}

/** sparticuz's args are tuned for a single-CPU, small-memory container
 * (--single-process, --no-zygote, swiftshader GL). Passing those to a
 * desktop Chrome is at best pointless and at worst destabilising, so a
 * local launch gets its own minimal list. */
const LOCAL_CHROMIUM_ARGS = ["--no-sandbox", "--disable-dev-shm-usage"];

/** Local candidates, most-specific first:
 *   1. QA_CHROMIUM_PATH -- explicit override for CI or an unusual install.
 *   2. Playwright's own registry (`npx playwright install chromium`) --
 *      preferred because it is the exact build playwright-core expects.
 *   3. Whatever Chrome the OS has installed, via chrome-launcher.
 * Both library calls throw when nothing is installed, so each is guarded
 * individually: a miss should fall through to the next candidate, not
 * abort the search. */
function localChromiumCandidates(): string[] {
  const candidates: string[] = [];

  const override = process.env.QA_CHROMIUM_PATH;
  if (override) candidates.push(override);

  try {
    const fromPlaywright = playwrightChromium.executablePath();
    if (fromPlaywright) candidates.push(fromPlaywright);
  } catch {
    // playwright-core throws when the browser was never downloaded.
  }

  try {
    const fromSystem = getChromePath();
    if (fromSystem) candidates.push(fromSystem);
  } catch {
    // chrome-launcher throws when it finds no Chrome installation.
  }

  return candidates;
}

/** Resolves the browser for this runtime, or null if none is usable. */
export async function resolveChromium(): Promise<ChromiumRuntime | null> {
  if (isServerlessRuntime()) {
    const executablePath = await sparticuz.executablePath();
    if (!executablePath) {
      console.error("[qa-chromium] @sparticuz/chromium returned no executable path");
      return null;
    }
    return { executablePath, args: sparticuz.args };
  }

  for (const executablePath of localChromiumCandidates()) {
    if (existsSync(executablePath)) {
      return { executablePath, args: LOCAL_CHROMIUM_ARGS };
    }
  }

  console.error(
    "[qa-chromium] no local Chrome found -- run `npx playwright install chromium`, " +
      "or set QA_CHROMIUM_PATH to a Chrome binary",
  );
  return null;
}
