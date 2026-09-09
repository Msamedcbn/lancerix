import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  // lighthouse (src/lib/qa/standalone.ts, PERFORMANCE check) pulls in
  // @paulirish/trace_engine, which ships an ESM/CJS export shape webpack's
  // bundler can't statically resolve ("'ParsedURL' is not exported from
  // ../../core/common/common.js"). linkinator (DEAD_LINKS check) has its own
  // incompatible pattern: a dynamic `import(\`file://${...}\`)` template
  // literal webpack can't statically analyze either ("Module not found:
  // Can't resolve 'file:/'"). Excluding both from the server bundle and
  // letting Node require()/import() them natively at runtime is Next.js's
  // documented fix for this class of large, non-bundler-friendly server-only
  // package (same reason sharp/puppeteer need this).
  //
  // @sparticuz/chromium (src/lib/qa/chromium.ts, every check that needs a
  // real browser -- accessibility, performance, visual overflow, form
  // validation, interaction scan) has the same problem in its own words:
  // bundling it relocates its files and breaks its own path to its bin/
  // directory ('The input directory ".../@sparticuz/chromium/bin" does not
  // exist... you must externalize @sparticuz/chromium so it is not
  // relocated' -- its error message names the exact fix). Found 2026-09-09
  // testing the admin free trial: every browser-based module was silently
  // never running in production, only the plain-HTTP ones (dead links, SEO
  // meta) worked.
  //
  // @axe-core/playwright (ACCESSIBILITY) has a different failure mode again:
  // bundled, it produced "page.evaluate: ReferenceError: b is not defined"
  // inside Playwright's own UtilityScript, on the real target site, in
  // production only. Root cause (confirmed against known Playwright issues
  // with the identical signature -- #5395, #17872, both
  // "ReferenceError: <tslib helper> is not defined" at UtilityScript.evaluate):
  // page.evaluate() serializes a function to a string and re-runs it in the
  // browser, so if that function was compiled down to use a tslib helper
  // (__read, __name, ...) for destructuring/spread, minifying it renames
  // that helper -- to a single letter here -- and the stringified version
  // sent to the browser calls a name that only ever existed in the Node
  // module scope, never in the browser. playwright-core itself was already
  // safe (Next.js externalizes it by default); @axe-core/playwright, which
  // builds and evaluates its own complex injected script, was not.
  serverExternalPackages: [
    "lighthouse",
    "chrome-launcher",
    "@paulirish/trace_engine",
    "linkinator",
    "@sparticuz/chromium",
    "@axe-core/playwright",
  ],
  // Being external keeps webpack from choking on lighthouse's module shape,
  // but Vercel's own file tracer still decides what actually ships in the
  // deployed function -- and it walks require()/import() statically, so it
  // never sees the runtime path.join(__dirname, '../../whatever') paths
  // lighthouse's report generator uses to reach its own template/bundle
  // files. Two rounds of including one specific missing file at a time
  // (flow-report/assets/*.html, then report/assets/*.html) each just
  // surfaced the next one lighthouse touches (dist/report/flow.js) --
  // whack-a-mole, not a fix. The package is 21MB with no nested
  // node_modules, so including all of it outright is cheaper than guessing
  // its internal file-read patterns one ENOENT at a time (2026-09-09).
  outputFileTracingIncludes: {
    "/**": [
      "node_modules/lighthouse/**/*",
      // Belt-and-suspenders alongside externalizing @sparticuz/chromium
      // above: its error was about bundling relocating its files, not
      // about nft missing a dynamic path, so externalizing alone should be
      // the whole fix -- but lighthouse looked the same way right up until
      // it needed both, so this is included preemptively rather than
      // spending another deploy-and-retest round finding out.
      "node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
