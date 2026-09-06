import type { Metadata } from "next";

import { TermsView } from "@/components/public/terms-view";
import { TERMS_COPY } from "@/lib/i18n/dictionaries/terms";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "terms",
  locale: "en",
  title: TERMS_COPY.en.metaTitle,
  description: TERMS_COPY.en.metaDescription,
});

export default function EnglishTermsPage() {
  return <TermsView locale="en" />;
}
