import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/env.server";

/**
 * No AI-crawler blocklist here on purpose: GPTBot, ClaudeBot, PerplexityBot,
 * Google-Extended and the rest are left implicitly allowed. A verification
 * platform that search and answer engines cannot cite defeats its own GEO
 * strategy before it starts.
 *
 * Every private path segment under (dashboard) is listed explicitly, since a
 * Next.js route group has no shared URL prefix to disallow in one line. This
 * is the crawl-budget hint; the authoritative "don't index" signal is the
 * `robots: { index: false }` metadata on the (dashboard) layout itself.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/admin",
        "/client",
        "/contracts",
        "/dashboard",
        "/freelancer",
        "/profil",
      ],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
