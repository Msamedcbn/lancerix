import type { Metadata } from "next";

import { ArbitrationCaseView } from "@/components/contracts/arbitration-case-view";
import { SHOWCASE_ECOMMERCE_45K_DATA, PRECEDENT_CASES } from "@/lib/data/precedent-cases";
import { appUrl } from "@/lib/env.server";
import { caseStudyJsonLd, pageMetadata } from "@/lib/seo";

const caseItem = PRECEDENT_CASES[3]!;

export const metadata: Metadata = pageMetadata({
  id: "caseStudyEcommerce",
  locale: "tr",
  title: caseItem.title.tr,
  description: caseItem.summary.tr,
});

export default function EcommerceCaseStudyTrPage() {
  const jsonLd = caseStudyJsonLd({
    origin: appUrl(),
    path: "/vaka/45k-e-ticaret-otomasyon",
    title: caseItem.title.tr,
    description: caseItem.summary.tr,
    locale: "tr",
    questions: caseItem.faq.map((f) => ({ q: f.q.tr, a: f.a.tr })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArbitrationCaseView
        locale="tr"
        record={SHOWCASE_ECOMMERCE_45K_DATA}
        caseItem={caseItem}
      />
    </>
  );
}
