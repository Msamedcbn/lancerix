import type { Metadata } from "next";

import { RoadmapView } from "@/components/public/roadmap-view";
import { alternatesFor } from "@/lib/i18n/config";
import { ROADMAP_COPY } from "@/lib/i18n/dictionaries/roadmap";

export const metadata: Metadata = {
  title: ROADMAP_COPY.en.metaTitle,
  description: ROADMAP_COPY.en.metaDescription,
  alternates: alternatesFor("roadmap"),
};

export default function EnglishRoadmapPage() {
  return <RoadmapView locale="en" />;
}
