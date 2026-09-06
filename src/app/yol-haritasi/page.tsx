import type { Metadata } from "next";

import { RoadmapView } from "@/components/public/roadmap-view";
import { ROADMAP_COPY } from "@/lib/i18n/dictionaries/roadmap";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "roadmap",
  locale: "tr",
  title: ROADMAP_COPY.tr.metaTitle,
  description: ROADMAP_COPY.tr.metaDescription,
});

export default function YolHaritasiPage() {
  return <RoadmapView locale="tr" />;
}
