import type { Metadata } from "next";

import { RoadmapView } from "@/components/public/roadmap-view";
import { ROADMAP_COPY } from "@/lib/i18n/dictionaries/roadmap";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  id: "roadmap",
  locale: "en",
  title: ROADMAP_COPY.en.metaTitle,
  description: ROADMAP_COPY.en.metaDescription,
});

export default function EnglishRoadmapPage() {
  return <RoadmapView locale="en" />;
}
