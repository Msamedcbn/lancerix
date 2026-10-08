import type { Metadata } from "next";

import { ArbitrationCaseView } from "@/components/contracts/arbitration-case-view";
import { SHOWCASE_FINTECH_120K_DATA, PRECEDENT_CASES } from "@/lib/data/precedent-cases";
import { appUrl } from "@/lib/env.server";
import { caseStudyJsonLd, pageMetadata } from "@/lib/seo";

const caseItem = PRECEDENT_CASES[1]!;

export const metadata: Metadata = pageMetadata({
  id: "caseStudyFintech",
  locale: "en",
  title: caseItem.title.en,
  description: caseItem.summary.en,
});

export default function FintechCaseStudyEnPage() {
  const jsonLd = caseStudyJsonLd({
    origin: appUrl(),
    path: "/en/case-study/120k-fintech-mobile-app",
    title: caseItem.title.en,
    description: caseItem.summary.en,
    locale: "en",
    questions: caseItem.faq.map((f) => ({ q: f.q.en, a: f.a.en })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArbitrationCaseView
        locale="en"
        record={SHOWCASE_FINTECH_120K_DATA}
        caseItem={caseItem}
      />
    </>
  );
}
