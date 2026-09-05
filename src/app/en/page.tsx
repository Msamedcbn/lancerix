import type { Metadata } from "next";

import { HomeClient } from "@/app/home-client";
import { getVerifiedCount } from "@/lib/data/public-stats";
import { alternatesFor } from "@/lib/i18n/config";
import { HOME_COPY } from "@/lib/i18n/dictionaries/home";

export const metadata: Metadata = {
  title: HOME_COPY.en.metaTitle,
  description: HOME_COPY.en.metaDescription,
  alternates: alternatesFor("home"),
};

/** The English landing page. Same component as /, different dictionary. */
export default async function EnglishHomePage() {
  return <HomeClient verifiedCount={await getVerifiedCount()} locale="en" />;
}
