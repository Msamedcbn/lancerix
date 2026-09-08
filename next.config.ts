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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
