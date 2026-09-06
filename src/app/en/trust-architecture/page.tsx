import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUVEN_MIMARISI_COPY } from "@/lib/i18n/dictionaries/guide-guven-mimarisi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "trustArchitecture",
  locale: "en",
  title: GUVEN_MIMARISI_COPY.en.metaTitle,
  description: GUVEN_MIMARISI_COPY.en.metaDescription,
});

export default function EnglishTrustArchitecturePage() {
  return (
    <GuideView
      copy={GUVEN_MIMARISI_COPY.en}
      locale="en"
      related={[
        {
          href: PUBLIC_ROUTES.guideQaVerification.en,
          label: "What Is Independent QA Verification",
        },
        { href: "/report/ornek", label: "See an example verification report" },
      ]}
    />
  );
}
