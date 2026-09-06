import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUIDE_MUSTERI_ODEMEZSE_COPY } from "@/lib/i18n/dictionaries/guide-musteri-odemezse";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "guideClientNonPayment",
  locale: "tr",
  title: GUIDE_MUSTERI_ODEMEZSE_COPY.tr.metaTitle,
  description: GUIDE_MUSTERI_ODEMEZSE_COPY.tr.metaDescription,
});

export default function MusteriOdemeYapmazsaNeYapilirPage() {
  return (
    <GuideView
      copy={GUIDE_MUSTERI_ODEMEZSE_COPY.tr}
      locale="tr"
      related={[
        {
          href: PUBLIC_ROUTES.guideNoCompanyProtection.tr,
          label: "Şirket Kurmadan Freelance Çalışırken Kendini Nasıl Korursun",
        },
        {
          href: PUBLIC_ROUTES.guideDeliveryAcceptance.tr,
          label: "Freelance Teslim ve Kabul Rehberi",
        },
      ]}
    />
  );
}
