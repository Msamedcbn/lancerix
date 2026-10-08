import type { Metadata } from "next";

import { CasesHubView } from "@/components/contracts/cases-hub-view";
import { appUrl } from "@/lib/env.server";
import { casesHubJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "casesHub",
  locale: "tr",
  title: "Yazılımcı Hak Edişini Kurtaran Emsal Davalar — Lancerix Tahkim Dosyaları",
  description:
    "TBK m. 477 zımni kabul, HMK m. 193 delil sözleşmesi ve Lancerix SHA-256 delil mührüyle çözülen emsal freelance yazılım davaları ve bilirkişi kararları.",
});

export default function TurkishCasesHubPage() {
  const jsonLd = casesHubJsonLd({
    origin: appUrl(),
    path: "/vaka",
    title: "Yazılımcı Hak Edişini Kurtaran Emsal Davalar & Tahkim Dosyaları",
    description:
      "TBK m. 477 zımni kabul ve HMK m. 193 delil sözleşmesi ile çözülen emsal freelance davaları.",
    locale: "tr",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CasesHubView locale="tr" />
    </>
  );
}
