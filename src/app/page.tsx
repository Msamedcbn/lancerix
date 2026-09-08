import type { Metadata } from "next";
import { headers } from "next/headers";

import { HomeClient } from "@/app/home-client";
import { getVerifiedCount } from "@/lib/data/public-stats";
import { appUrl } from "@/lib/env.server";
import { resolveVisitorCurrency } from "@/lib/i18n/currency-detect";
import { HOME_COPY } from "@/lib/i18n/dictionaries/home";
import { organizationJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "home",
  locale: "tr",
  title: HOME_COPY.tr.metaTitle,
  description: HOME_COPY.tr.metaDescription,
});

/** The Turkish landing page. Its English twin is src/app/en/page.tsx. */
export default async function HomePage() {
  const jsonLd = organizationJsonLd(appUrl(), HOME_COPY.tr.metaDescription);
  const defaultCurrency = resolveVisitorCurrency(await headers());

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient
        verifiedCount={await getVerifiedCount()}
        locale="tr"
        defaultCurrency={defaultCurrency}
      />
    </>
  );
}
