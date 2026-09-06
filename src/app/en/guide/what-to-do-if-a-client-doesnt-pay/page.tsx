import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUIDE_MUSTERI_ODEMEZSE_COPY } from "@/lib/i18n/dictionaries/guide-musteri-odemezse";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "guideClientNonPayment",
  locale: "en",
  title: GUIDE_MUSTERI_ODEMEZSE_COPY.en.metaTitle,
  description: GUIDE_MUSTERI_ODEMEZSE_COPY.en.metaDescription,
});

export default function EnglishWhatToDoIfAClientDoesntPayPage() {
  return (
    <GuideView
      copy={GUIDE_MUSTERI_ODEMEZSE_COPY.en}
      locale="en"
      related={[
        {
          href: PUBLIC_ROUTES.guideNoCompanyProtection.en,
          label: "How To Protect Yourself Freelancing Without A Company",
        },
        {
          href: PUBLIC_ROUTES.guideDeliveryAcceptance.en,
          label: "Freelance Delivery & Acceptance Guide",
        },
      ]}
    />
  );
}
