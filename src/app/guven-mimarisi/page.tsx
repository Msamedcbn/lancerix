import type { Metadata } from "next";

import { GuideView } from "@/components/public/guide-view";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";
import { GUVEN_MIMARISI_COPY } from "@/lib/i18n/dictionaries/guide-guven-mimarisi";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "trustArchitecture",
  locale: "tr",
  title: GUVEN_MIMARISI_COPY.tr.metaTitle,
  description: GUVEN_MIMARISI_COPY.tr.metaDescription,
});

export default function GuvenMimarisiPage() {
  return (
    <GuideView
      copy={GUVEN_MIMARISI_COPY.tr}
      locale="tr"
      related={[
        {
          href: PUBLIC_ROUTES.guideQaVerification.tr,
          label: "Bağımsız QA Doğrulama Nedir",
        },
        { href: "/report/ornek", label: "Örnek bir doğrulama raporu gör" },
      ]}
    />
  );
}
