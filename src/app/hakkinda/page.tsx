import type { Metadata } from "next";

import { AboutView } from "@/components/public/about-view";
import { ABOUT_COPY } from "@/lib/i18n/dictionaries/about";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "about",
  locale: "tr",
  title: ABOUT_COPY.tr.metaTitle,
  description: ABOUT_COPY.tr.metaDescription,
});

export default function HakkindaPage() {
  return <AboutView locale="tr" />;
}
