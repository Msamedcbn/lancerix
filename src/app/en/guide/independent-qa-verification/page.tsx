import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUIDE_QA_VERIFICATION_COPY } from "@/lib/i18n/dictionaries/guide-qa-nedir";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "guideQaVerification",
  locale: "en",
  title: GUIDE_QA_VERIFICATION_COPY.en.metaTitle,
  description: GUIDE_QA_VERIFICATION_COPY.en.metaDescription,
});

export default function EnglishIndependentQaVerificationPage() {
  return (
    <GuideView
      copy={GUIDE_QA_VERIFICATION_COPY.en}
      locale="en"
      related={[
        {
          href: PUBLIC_ROUTES.guideDeliveryAcceptance.en,
          label: "Freelance Delivery & Acceptance Guide",
        },
        { href: "/report/ornek", label: "See an example verification report" },
      ]}
    />
  );
}
