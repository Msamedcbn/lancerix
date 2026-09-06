import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUIDE_SIRKETSIZ_KORUNMA_COPY } from "@/lib/i18n/dictionaries/guide-sirketsiz-korunma";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "guideNoCompanyProtection",
  locale: "en",
  title: GUIDE_SIRKETSIZ_KORUNMA_COPY.en.metaTitle,
  description: GUIDE_SIRKETSIZ_KORUNMA_COPY.en.metaDescription,
});

export default function EnglishProtectingYourselfAsAnIndividualFreelancerPage() {
  return (
    <GuideView
      copy={GUIDE_SIRKETSIZ_KORUNMA_COPY.en}
      locale="en"
      related={[
        {
          href: PUBLIC_ROUTES.guideClientNonPayment.en,
          label: "What To Do If A Client Doesn't Pay",
        },
        {
          href: PUBLIC_ROUTES.guideDeliveryAcceptance.en,
          label: "Freelance Delivery & Acceptance Guide",
        },
        { href: PUBLIC_ROUTES.trustArchitecture.en, label: "Trust Architecture" },
      ]}
    />
  );
}
