import type { Metadata } from "next";

import { GuideDeliveryAcceptanceView } from "@/components/public/guide-teslim-kabul-view";
import { alternatesFor } from "@/lib/i18n/config";
import { GUIDE_DELIVERY_ACCEPTANCE_COPY } from "@/lib/i18n/dictionaries/guide-teslim-kabul";

export const metadata: Metadata = {
  title: GUIDE_DELIVERY_ACCEPTANCE_COPY.en.metaTitle,
  description: GUIDE_DELIVERY_ACCEPTANCE_COPY.en.metaDescription,
  alternates: alternatesFor("guideDeliveryAcceptance"),
};

export default function EnglishFreelanceDeliveryAcceptancePage() {
  return <GuideDeliveryAcceptanceView locale="en" />;
}
