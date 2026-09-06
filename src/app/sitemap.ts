import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/env.server";
import { PUBLIC_ROUTES, type Locale, type PublicRouteId } from "@/lib/i18n/config";
import { GUIDE_DELIVERY_ACCEPTANCE_COPY } from "@/lib/i18n/dictionaries/guide-teslim-kabul";
import { GUIDE_MUSTERI_ODEMEZSE_COPY } from "@/lib/i18n/dictionaries/guide-musteri-odemezse";
import { GUIDE_QA_VERIFICATION_COPY } from "@/lib/i18n/dictionaries/guide-qa-nedir";
import { GUIDE_SIRKETSIZ_KORUNMA_COPY } from "@/lib/i18n/dictionaries/guide-sirketsiz-korunma";
import { GUVEN_MIMARISI_COPY } from "@/lib/i18n/dictionaries/guide-guven-mimarisi";

/**
 * The five PUBLIC_ROUTES ids backed by a GuideCopy dictionary carry a real,
 * hand-edited `updated` date (see guide-shared.ts) -- read it instead of
 * stamping every URL with the build timestamp, which is what this file did
 * before and which makes lastmod worthless to a crawler (a date that is
 * always "today" for every page, changed or not, is a signal search engines
 * are documented to discount). Routes with no editorial date (home, terms,
 * roadmap) keep the build-time fallback; there is no dishonesty either way,
 * since the fallback never claims a specific edit date, just "as of this
 * deploy".
 */
const GUIDE_UPDATED: Partial<Record<PublicRouteId, Record<Locale, string>>> = {
  guideDeliveryAcceptance: {
    tr: GUIDE_DELIVERY_ACCEPTANCE_COPY.tr.updated,
    en: GUIDE_DELIVERY_ACCEPTANCE_COPY.en.updated,
  },
  guideQaVerification: {
    tr: GUIDE_QA_VERIFICATION_COPY.tr.updated,
    en: GUIDE_QA_VERIFICATION_COPY.en.updated,
  },
  trustArchitecture: {
    tr: GUVEN_MIMARISI_COPY.tr.updated,
    en: GUVEN_MIMARISI_COPY.en.updated,
  },
  guideNoCompanyProtection: {
    tr: GUIDE_SIRKETSIZ_KORUNMA_COPY.tr.updated,
    en: GUIDE_SIRKETSIZ_KORUNMA_COPY.en.updated,
  },
  guideClientNonPayment: {
    tr: GUIDE_MUSTERI_ODEMEZSE_COPY.tr.updated,
    en: GUIDE_MUSTERI_ODEMEZSE_COPY.en.updated,
  },
};

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
  const buildTime = new Date();

  const fromPublicRoutes = (Object.entries(PUBLIC_ROUTES) as [PublicRouteId, (typeof PUBLIC_ROUTES)[PublicRouteId]][]).flatMap(
    ([id, route]) => {
      const languages = {
        tr: `${base}${route.tr}`,
        en: `${base}${route.en}`,
      };
      const updated = GUIDE_UPDATED[id];

      return [
        {
          url: languages.tr,
          lastModified: updated ? new Date(updated.tr) : buildTime,
          alternates: { languages },
        },
        {
          url: languages.en,
          lastModified: updated ? new Date(updated.en) : buildTime,
          alternates: { languages },
        },
      ];
    },
  );

  return [...fromPublicRoutes, { url: `${base}/report/ornek`, lastModified: buildTime }];
}
