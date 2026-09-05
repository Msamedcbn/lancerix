import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { alternatesFor, PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUIDE_DELIVERY_ACCEPTANCE_COPY } from "@/lib/i18n/dictionaries/guide-teslim-kabul";

export const metadata: Metadata = {
  title: GUIDE_DELIVERY_ACCEPTANCE_COPY.en.metaTitle,
  description: GUIDE_DELIVERY_ACCEPTANCE_COPY.en.metaDescription,
  alternates: alternatesFor("guideDeliveryAcceptance"),
};

export default function EnglishFreelanceDeliveryAcceptancePage() {
  return (
    <GuideView
      copy={GUIDE_DELIVERY_ACCEPTANCE_COPY.en}
      locale="en"
      related={[
        {
          href: PUBLIC_ROUTES.guideQaVerification.en,
          label: "What Is Independent QA Verification",
        },
      ]}
    />
  );
}
