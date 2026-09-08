import type { Metadata } from "next";

import { ContractTiersView } from "@/components/public/contract-tiers-view";
import { CONTRACT_VERIFICATION_COPY } from "@/lib/i18n/dictionaries/contract-verification";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "contractVerification",
  locale: "tr",
  title: CONTRACT_VERIFICATION_COPY.tr.metaTitle,
  description: CONTRACT_VERIFICATION_COPY.tr.metaDescription,
});

export default function SozlesmeliDogrulamaPage() {
  return <ContractTiersView locale="tr" />;
}
