import type { Metadata } from "next";

import { ArbitrationCaseView } from "@/components/contracts/arbitration-case-view";
import { SHOWCASE_LOGISTICS_210K_DATA, PRECEDENT_CASES } from "@/lib/data/precedent-cases";
import { appUrl } from "@/lib/env.server";
import { caseStudyJsonLd, pageMetadata } from "@/lib/seo";

const caseItem = PRECEDENT_CASES[2]!;

export const metadata: Metadata = pageMetadata({
  id: "caseStudyLogistics",
  locale: "tr",
  title: caseItem.title.tr,
  description: caseItem.summary.tr,
});

export default function LogisticsCaseStudyTrPage() {
  const jsonLd = caseStudyJsonLd({
    origin: appUrl(),
    path: "/vaka/210k-lojistik-erp-kapsam",
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
        record={SHOWCASE_LOGISTICS_210K_DATA}
        caseItem={caseItem}
      />
    </>
  );
}
