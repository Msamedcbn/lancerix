import type { Metadata } from "next";

import { SystemFlow } from "@/app/nasil-calisir/system-flow";
import { alternatesFor } from "@/lib/i18n/config";
import { SYSTEM_FLOW_COPY } from "@/lib/i18n/dictionaries/system-flow";

export const metadata: Metadata = {
  title: SYSTEM_FLOW_COPY.en.metaTitle,
  description: SYSTEM_FLOW_COPY.en.metaDescription,
  alternates: alternatesFor("howItWorks"),
};

export default function EnglishHowItWorksPage() {
  return <SystemFlow locale="en" />;
}
