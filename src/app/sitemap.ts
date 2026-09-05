import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/env.server";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";

/**
 * Built from PUBLIC_ROUTES, the same registry the language switcher and
 * hreflang alternates already read -- add a page there and it appears here,
 * in both languages with the correct alternates, with nothing else to touch.
 *
 * Deliberately excludes per-user pages (/profile/[publicId], /report/[token]):
 * a static sitemap enumerating those would mean crawling every user's
 * account to build it, which is not what this file is for. /report/ornek is
 * the one exception -- a single static page, Turkish-only like every other
 * /report route, so it is listed by hand rather than earning its own
 * PUBLIC_ROUTES/language-switcher entry for one URL.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const lastModified = new Date();

  const fromPublicRoutes = Object.values(PUBLIC_ROUTES).flatMap((route) => {
    const languages = {
      tr: `${base}${route.tr}`,
      en: `${base}${route.en}`,
    };

    return [
      { url: languages.tr, lastModified, alternates: { languages } },
      { url: languages.en, lastModified, alternates: { languages } },
    ];
  });

  return [...fromPublicRoutes, { url: `${base}/report/ornek`, lastModified }];
}
