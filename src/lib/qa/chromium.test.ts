import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * resolveChromium() is the only thing standing between a paid scan and the
 * failure mode that made 5 of 7 modules return null on a dev machine, so the
 * cases locked in here are: the serverless binary is still used on Vercel,
 * a local machine finds a real Chrome, precedence between the candidates,
 * and "nothing installed" degrades to null instead of throwing.
 */

const sparticuzExecutablePath = vi.fn(async () => "/var/task/chromium");
vi.mock("@sparticuz/chromium", () => ({
  default: { args: ["--single-process"], executablePath: () => sparticuzExecutablePath() },
}));

let playwrightPath: string | (() => string) = "/registry/chromium";
vi.mock("playwright-core", () => ({
  chromium: {
    executablePath: () => (typeof playwrightPath === "function" ? playwrightPath() : playwrightPath),
  },
}));

let systemPath: string | (() => string) = "/usr/bin/google-chrome";
vi.mock("chrome-launcher", () => ({
  getChromePath: () => (typeof systemPath === "function" ? systemPath() : systemPath),
}));

let existing: string[] = [];
vi.mock("fs", () => ({ existsSync: (p: string) => existing.includes(p) }));

import { resolveChromium } from "./chromium";

const SERVERLESS_VARS = ["VERCEL", "AWS_LAMBDA_FUNCTION_NAME", "AWS_EXECUTION_ENV"] as const;

beforeEach(() => {
  for (const v of SERVERLESS_VARS) delete process.env[v];
  delete process.env.QA_CHROMIUM_PATH;
  playwrightPath = "/registry/chromium";
  systemPath = "/usr/bin/google-chrome";
  existing = ["/registry/chromium", "/usr/bin/google-chrome"];
  sparticuzExecutablePath.mockClear();
});

afterEach(() => {
  for (const v of SERVERLESS_VARS) delete process.env[v];
});

describe("resolveChromium", () => {
  it.each(SERVERLESS_VARS)("uses @sparticuz/chromium when %s is set", async (envVar) => {
    process.env[envVar] = "1";
    // Deliberately no local candidate exists: on Lambda there is none, and
    // the serverless branch must not depend on one.
    existing = [];

    const runtime = await resolveChromium();

    expect(runtime).toEqual({ executablePath: "/var/task/chromium", args: ["--single-process"] });
  });

  it("uses a local Chrome off a serverless runtime, not the Lambda binary", async () => {
    const runtime = await resolveChromium();

    expect(runtime?.executablePath).toBe("/registry/chromium");
    expect(sparticuzExecutablePath).not.toHaveBeenCalled();
    // Lambda's --single-process et al. must not leak onto a desktop Chrome.
    expect(runtime?.args).not.toContain("--single-process");
  });

  it("prefers QA_CHROMIUM_PATH over every discovered candidate", async () => {
    process.env.QA_CHROMIUM_PATH = "/opt/custom/chrome";
    existing = ["/opt/custom/chrome", "/registry/chromium", "/usr/bin/google-chrome"];

    expect((await resolveChromium())?.executablePath).toBe("/opt/custom/chrome");
  });

  it("skips a candidate whose file is missing and takes the next one", async () => {
    existing = ["/usr/bin/google-chrome"];

    expect((await resolveChromium())?.executablePath).toBe("/usr/bin/google-chrome");
  });

  it("keeps searching when a resolver throws instead of returning a path", async () => {
    // playwright-core throws when the browser was never downloaded; that must
    // not abort the search before chrome-launcher gets asked.
    playwrightPath = () => {
      throw new Error("Executable doesn't exist");
    };

    expect((await resolveChromium())?.executablePath).toBe("/usr/bin/google-chrome");
  });

  it("returns null when no browser is installed anywhere", async () => {
    playwrightPath = () => {
      throw new Error("Executable doesn't exist");
    };
    systemPath = () => {
      throw new Error("no Chrome installations found");
    };
    existing = [];

    expect(await resolveChromium()).toBeNull();
  });
});
