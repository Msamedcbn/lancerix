import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUIDE_SIRKETSIZ_KORUNMA_COPY } from "@/lib/i18n/dictionaries/guide-sirketsiz-korunma";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "guideNoCompanyProtection",
  locale: "tr",
  title: GUIDE_SIRKETSIZ_KORUNMA_COPY.tr.metaTitle,
  description: GUIDE_SIRKETSIZ_KORUNMA_COPY.tr.metaDescription,
});

export default function SirketKurmadanFreelanceKorunmaPage() {
  return (
    <GuideView
      copy={GUIDE_SIRKETSIZ_KORUNMA_COPY.tr}
      locale="tr"
      related={[
        {
          href: PUBLIC_ROUTES.guideClientNonPayment.tr,
          label: "Müşteri Ödeme Yapmazsa Ne Yapabilirsin",
        },
        {
          href: PUBLIC_ROUTES.guideDeliveryAcceptance.tr,
          label: "Freelance Teslim ve Kabul Rehberi",
        },
        { href: PUBLIC_ROUTES.trustArchitecture.tr, label: "Güven Mimarisi" },
      ]}
    />
  );
}
