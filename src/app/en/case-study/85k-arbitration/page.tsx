import type { Metadata } from "next";

import { ArbitrationCaseView } from "@/components/contracts/arbitration-case-view";
import { SHOWCASE_KUYUMCU_DATA } from "@/lib/data/verification";
import { appUrl } from "@/lib/env.server";
import { ARBITRATION_CASE_COPY } from "@/lib/i18n/dictionaries/arbitration-case";
import { caseStudyJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "caseStudy",
  locale: "en",
  title: ARBITRATION_CASE_COPY.en.metaTitle,
  description: ARBITRATION_CASE_COPY.en.metaDescription,
});

export default function EnglishCaseStudyPage() {
  const jsonLd = caseStudyJsonLd({
    origin: appUrl(),
    path: "/en/case-study/85k-arbitration",
    title: ARBITRATION_CASE_COPY.en.metaTitle,
    description: ARBITRATION_CASE_COPY.en.metaDescription,
    locale: "en",
    questions: [
      {
        q: "Can a client unilaterally cancel a contract citing 'we dislike the design'?",
        a: "No. Under Turkish Code of Obligations Art. 477, once objective contractual criteria are fulfilled and the inspection deadline lapses without specific defect reports, subjective aesthetic dissatisfaction is not legal grounds for contract termination.",
      },
      {
        q: "Does Lancerix's SHA-256 sealed telemetry report qualify as valid legal evidence in Turkish courts?",
        a: "Yes. Under Civil Procedure Code Art. 193 (Evidence Agreement), cryptographic server telemetry and SHA-256 timestamps stipulated in the contract qualify as binding exclusive documentary evidence.",
      },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArbitrationCaseView locale="en" record={SHOWCASE_KUYUMCU_DATA} />
    </>
  );
}
