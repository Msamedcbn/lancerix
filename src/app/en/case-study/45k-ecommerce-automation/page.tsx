import type { Metadata } from "next";

import { ArbitrationCaseView } from "@/components/contracts/arbitration-case-view";
import { SHOWCASE_ECOMMERCE_45K_DATA, PRECEDENT_CASES } from "@/lib/data/precedent-cases";
import { appUrl } from "@/lib/env.server";
import { caseStudyJsonLd, pageMetadata } from "@/lib/seo";

const caseItem = PRECEDENT_CASES[3]!;

export const metadata: Metadata = pageMetadata({
  id: "caseStudyEcommerce",
  locale: "en",
  title: caseItem.title.en,
  description: caseItem.summary.en,
});

export default function EcommerceCaseStudyEnPage() {
  const jsonLd = caseStudyJsonLd({
    origin: appUrl(),
    path: "/en/case-study/45k-ecommerce-automation",
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
        record={SHOWCASE_ECOMMERCE_45K_DATA}
        caseItem={caseItem}
      />
    </>
  );
}
