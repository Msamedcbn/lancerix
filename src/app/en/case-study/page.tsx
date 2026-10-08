import type { Metadata } from "next";

import { CasesHubView } from "@/components/contracts/cases-hub-view";
import { appUrl } from "@/lib/env.server";
import { casesHubJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "casesHub",
  locale: "en",
  title: "Freelance Disputes & Legal Precedents — Lancerix Arbitration Cases",
  description:
    "Explore real-world software contract disputes resolved in favor of freelance engineers via statutory tacit acceptance (Art. 477) and cryptographic evidence seals.",
});

export default function EnglishCasesHubPage() {
  const jsonLd = casesHubJsonLd({
    origin: appUrl(),
    path: "/en/case-study",
    title: "Freelance Software Contract Disputes & Binding Legal Precedents",
    description:
      "Explore real-world software contract disputes resolved in favor of freelance engineers via statutory tacit acceptance and cryptographic evidence seals.",
    locale: "en",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CasesHubView locale="en" />
    </>
  );
}
