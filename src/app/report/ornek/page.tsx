import type { Metadata } from "next";

import { HASH } from "@/app/home-client";
import { QaReportCard } from "@/components/public/qa-report-card";
import type { PublicQaReport } from "@/lib/data/public-report";
import { socialMetadata } from "@/lib/seo";

const TITLE = "Örnek QA Doğrulama Raporu — Lancerix";
const DESCRIPTION =
  "Bağımsız bir QA doğrulama raporu neye benzer? Kabul kriterleri, sonuç ve değiştirilemez kriptografik zaman damgasıyla örnek bir rapor.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...socialMetadata({ title: TITLE, description: DESCRIPTION, path: "/report/ornek" }),
};

/**
 * A static stand-in for /report/[token], at a URL that doesn't need a real
 * contract behind it -- this is a sibling folder to [token], so Next.js
 * resolves the literal "ornek" segment before it ever reaches the dynamic
 * route. Same renderer as a real report (QaReportCard), so what a visitor
 * sees here is exactly what a real verification looks like; only the
 * `isExample` badge tells them it isn't one.
 *
 * The numbers match the teaser card on the homepage (same reference hash,
 * same "Ödeme entegrasyonu" contract) rather than inventing a second example
 * -- one fictional report, not two that could quietly drift apart.
 */
const EXAMPLE_REPORT: PublicQaReport = {
  contractTitle: "Ödeme entegrasyonu — kriter doğrulaması",
  projectCategory: "SOFTWARE",
  criteria: [
    "Ödeme formu Visa, Mastercard ve Troy kartlarını kabul etmeli",
    "Başarısız bir ödeme denemesinde kullanıcıya anlaşılır bir hata mesajı gösterilmeli",
    "Ödeme onaylandığında sipariş durumu otomatik olarak güncellenmeli",
  ],
  status: "PASS",
  documentSha256: HASH,
  generatedAt: "2026-08-21T14:05:00.000Z",
};

export default function OrnekRaporPage() {
  return <QaReportCard report={EXAMPLE_REPORT} isExample />;
}
