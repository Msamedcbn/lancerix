import type { Metadata } from "next";

import { GuideDeliveryAcceptanceView } from "@/components/public/guide-teslim-kabul-view";
import { alternatesFor } from "@/lib/i18n/config";
import { GUIDE_DELIVERY_ACCEPTANCE_COPY } from "@/lib/i18n/dictionaries/guide-teslim-kabul";

export const metadata: Metadata = {
  title: GUIDE_DELIVERY_ACCEPTANCE_COPY.tr.metaTitle,
  description: GUIDE_DELIVERY_ACCEPTANCE_COPY.tr.metaDescription,
  alternates: alternatesFor("guideDeliveryAcceptance"),
};

export default function FreelanceTeslimVeKabulPage() {
  return <GuideDeliveryAcceptanceView locale="tr" />;
}
