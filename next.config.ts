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
  serverExternalPackages: ["lighthouse", "chrome-launcher", "@paulirish/trace_engine", "linkinator"],
  // Being external keeps webpack from choking on lighthouse's module shape,
  // but Vercel's own file tracer still decides what actually ships in the
  // deployed function -- and it walks require()/import() statically, so it
  // never sees the `../../flow-report/assets/...html` path lighthouse's
  // report generator builds at runtime with path.join(). Without this, that
  // file is simply missing on the server (2026-09-09: ENOENT crashed every
  // in-flight request on Vercel, same failure class as the uncaught-exception
  // note on chrome-launcher in standalone.ts -- an unhandled error from
  // lighthouse's own asset loading, not something the try/catch around
  // lighthouse() can see because it's thrown from outside that call).
  outputFileTracingIncludes: {
    "/**": [
      "node_modules/lighthouse/flow-report/assets/**/*",
      "node_modules/lighthouse/report/assets/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
