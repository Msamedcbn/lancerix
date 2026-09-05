import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { alternatesFor, PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUIDE_QA_VERIFICATION_COPY } from "@/lib/i18n/dictionaries/guide-qa-nedir";

export const metadata: Metadata = {
  title: GUIDE_QA_VERIFICATION_COPY.tr.metaTitle,
  description: GUIDE_QA_VERIFICATION_COPY.tr.metaDescription,
  alternates: alternatesFor("guideQaVerification"),
};

export default function BagimsizQaDogrulamaNedirPage() {
  return (
    <GuideView
      copy={GUIDE_QA_VERIFICATION_COPY.tr}
      locale="tr"
      related={[
        {
          href: PUBLIC_ROUTES.guideDeliveryAcceptance.tr,
          label: "Freelance Teslim ve Kabul Rehberi",
        },
        { href: "/report/ornek", label: "Örnek bir doğrulama raporu gör" },
      ]}
    />
  );
}
