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
  // never sees the runtime path.join(__dirname, '../../whatever') paths
  // lighthouse's report generator uses to reach its own template/bundle
  // files. Two rounds of including one specific missing file at a time
  // (flow-report/assets/*.html, then report/assets/*.html) each just
  // surfaced the next one lighthouse touches (dist/report/flow.js) --
  // whack-a-mole, not a fix. The package is 21MB with no nested
  // node_modules, so including all of it outright is cheaper than guessing
  // its internal file-read patterns one ENOENT at a time (2026-09-09).
  outputFileTracingIncludes: {
    "/**": ["node_modules/lighthouse/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
