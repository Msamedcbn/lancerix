import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { alternatesFor, PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUIDE_DELIVERY_ACCEPTANCE_COPY } from "@/lib/i18n/dictionaries/guide-teslim-kabul";

export const metadata: Metadata = {
  title: GUIDE_DELIVERY_ACCEPTANCE_COPY.tr.metaTitle,
  description: GUIDE_DELIVERY_ACCEPTANCE_COPY.tr.metaDescription,
  alternates: alternatesFor("guideDeliveryAcceptance"),
};

export default function FreelanceTeslimVeKabulPage() {
  return (
    <GuideView
      copy={GUIDE_DELIVERY_ACCEPTANCE_COPY.tr}
      locale="tr"
      related={[
        {
          href: PUBLIC_ROUTES.guideQaVerification.tr,
          label: "Bağımsız QA Doğrulama Nedir",
        },
      ]}
    />
  );
}
