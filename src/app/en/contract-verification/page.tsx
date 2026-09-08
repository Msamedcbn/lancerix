import type { Metadata } from "next";

import { ContractTiersView } from "@/components/public/contract-tiers-view";
import { CONTRACT_VERIFICATION_COPY } from "@/lib/i18n/dictionaries/contract-verification";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "contractVerification",
  locale: "en",
  title: CONTRACT_VERIFICATION_COPY.en.metaTitle,
  description: CONTRACT_VERIFICATION_COPY.en.metaDescription,
});

export default function ContractVerificationPage() {
  return <ContractTiersView locale="en" />;
}
