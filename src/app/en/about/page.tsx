import type { Metadata } from "next";

import { AboutView } from "@/components/public/about-view";
import { ABOUT_COPY } from "@/lib/i18n/dictionaries/about";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "about",
  locale: "en",
  title: ABOUT_COPY.en.metaTitle,
  description: ABOUT_COPY.en.metaDescription,
});

export default function EnglishAboutPage() {
  return <AboutView locale="en" />;
}
