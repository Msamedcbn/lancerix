import type { Metadata } from "next";
import { headers } from "next/headers";

import { HomeClient } from "@/app/home-client";
import { appUrl } from "@/lib/env.server";
import { resolveVisitorCurrency } from "@/lib/i18n/currency-detect";
import { HOME_COPY } from "@/lib/i18n/dictionaries/home";
import { organizationJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "home",
  locale: "en",
  title: HOME_COPY.en.metaTitle,
  description: HOME_COPY.en.metaDescription,
});

/** The English landing page. Same component as /, different dictionary. */
export default async function EnglishHomePage() {
  const jsonLd = organizationJsonLd(appUrl(), HOME_COPY.en.metaDescription);
  const defaultCurrency = resolveVisitorCurrency(await headers());

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient locale="en" currency={defaultCurrency} />
    </>
  );
}
