import type { Metadata } from "next";

import { TermsView } from "@/components/public/terms-view";
import { TERMS_COPY } from "@/lib/i18n/dictionaries/terms";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "terms",
  locale: "tr",
  title: TERMS_COPY.tr.metaTitle,
  description: TERMS_COPY.tr.metaDescription,
});

export default function TermsPage() {
  return <TermsView locale="tr" />;
}
