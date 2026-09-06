import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QaReportCard } from "@/components/public/qa-report-card";
import { getPublicQaReport } from "@/lib/data/public-report";
import { socialMetadata } from "@/lib/seo";

/**
 * No canonical/path here: a token URL is unique per share and not meant to
 * rank on its own (see robots.ts / the noindex-by-omission-from-PUBLIC_ROUTES
 * comment in sitemap.ts) -- the Open Graph tags exist so the link itself
 * looks like Lancerix when a freelancer pastes it to a client, not for search.
 */
export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>): Promise<Metadata> {
  const { token } = await params;
  const report = await getPublicQaReport(token);
  if (!report) return { title: "Rapor bulunamadı — Lancerix" };

  const title = `${report.contractTitle} — Doğrulama Raporu — Lancerix`;
  const description = "Lancerix üzerinde bağımsız olarak doğrulanmış bir teslim raporu.";

  return { title, description, ...socialMetadata({ title, description }) };
}

/**
 * A shared QA report as a stranger sees it (Faz E #1).
 *
 * Deliberately shows only what public_qa_report() returns -- no party
 * names, no money, no contact info. This page must never fetch anything
 * beyond that RPC's result; adding "just one more field" here would mean
 * reaching past the one function that is this whole feature's privacy
 * boundary.
 */
export default async function PublicReportPage({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  const report = await getPublicQaReport(token);

  if (!report) notFound();

  return <QaReportCard report={report} />;
}
