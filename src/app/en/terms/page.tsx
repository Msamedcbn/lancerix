import type { Metadata } from "next";

import { TermsView } from "@/components/public/terms-view";
import { alternatesFor } from "@/lib/i18n/config";
import { TERMS_COPY } from "@/lib/i18n/dictionaries/terms";

export const metadata: Metadata = {
  title: TERMS_COPY.en.metaTitle,
  description: TERMS_COPY.en.metaDescription,
  alternates: alternatesFor("terms"),
};

export default function EnglishTermsPage() {
  return <TermsView locale="en" />;
}
