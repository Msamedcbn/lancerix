import type { Metadata } from "next";

import { ArbitrationCaseView } from "@/components/contracts/arbitration-case-view";
import { SHOWCASE_KUYUMCU_DATA } from "@/lib/data/verification";
import { appUrl } from "@/lib/env.server";
import { ARBITRATION_CASE_COPY } from "@/lib/i18n/dictionaries/arbitration-case";
import { caseStudyJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "caseStudy",
  locale: "tr",
  title: ARBITRATION_CASE_COPY.tr.metaTitle,
  description: ARBITRATION_CASE_COPY.tr.metaDescription,
});

export default function TurkishCaseStudyPage() {
  const jsonLd = caseStudyJsonLd({
    origin: appUrl(),
    path: "/vaka/85k-kuyumculuk-tahkim",
    title: ARBITRATION_CASE_COPY.tr.metaTitle,
    description: ARBITRATION_CASE_COPY.tr.metaDescription,
    locale: "tr",
    questions: [
      {
        q: "Müşteri 'tasarımı beğenmedim' diyerek sözleşmeyi tek taraflı feshedebilir mi?",
        a: "Hayır. TBK m. 477 ve Yargıtay içtihatlarına göre, sözleşmede kararlaştırılan objektif kriterler karşılandığı ve süresinde kusur bildirilmediği takdirde soyut estetik beğeniler fesih ve ödeme kesintisi sebebi olamaz.",
      },
      {
        q: "Lancerix'in SHA-256 damgalı telemetri raporu Türk mahkemelerinde delil sayılır mı?",
        a: "Evet. 6100 sayılı HMK m. 193 (Delil Sözleşmesi) uyarınca tarafların sözleşmede kararlaştırdığı telemetri kütükleri ve SHA-256 mühürlü delil raporları münhasır bağlayıcı delil niteliğindedir.",
      },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArbitrationCaseView locale="tr" record={SHOWCASE_KUYUMCU_DATA} />
    </>
  );
}
