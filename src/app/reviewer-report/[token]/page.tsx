import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getReviewerReportTokenInfo } from "@/lib/data/reviewer-report";

import { ReviewerReportForm } from "./reviewer-report-form";

export const metadata: Metadata = {
  title: "Reviewer raporu — Lancerix",
  robots: { index: false, follow: false },
};

const REASON_COPY: Record<"used" | "expired", { title: string; description: string }> = {
  used: {
    title: "Bu rapor zaten gönderildi",
    description:
      "Bu link tek kullanımlıktır ve daha önce bir rapor göndermek için kullanılmış. Yanlışlıkla tekrar açtıysan endişelenme -- ilk gönderimin kayıtlı.",
  },
  expired: {
    title: "Bu linkin süresi doldu",
    description:
      "Reviewer linkleri 14 gün geçerlidir. Süre dolduğunda platform yöneticisine haber gider -- sana yeni bir link gönderilecek.",
  },
};

/**
 * A Tier 3/4 reviewer's own report entry -- no login (2026-09-06 four-role
 * audit, Finding 1). Mirrors /report/[token]'s shape: read the token's state
 * through a security-definer function with a hand-picked column list, never
 * fetch anything beyond what that function returns.
 */
export default async function ReviewerReportPage({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  const info = await getReviewerReportTokenInfo(token);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        {!info ? (
          <div className="text-center">
            <p className="font-mono text-brand text-sm font-bold tracking-widest uppercase">
              Geçersiz link
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Bu link bulunamadı</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Linki e-postandan kopyaladığından emin ol. Sorun devam ederse platform
              yöneticisiyle iletişime geç.
            </p>
          </div>
        ) : !info.valid ? (
          <div className="text-center">
            <p className="font-mono text-brand text-sm font-bold tracking-widest uppercase">
              {info.contractTitle}
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              {REASON_COPY[info.reason ?? "expired"].title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {REASON_COPY[info.reason ?? "expired"].description}
            </p>
          </div>
        ) : (
          <>
            <p className="font-mono text-brand text-sm font-bold tracking-widest uppercase">
              QA incelemesi
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{info.contractTitle}</h1>
            <p className="mt-2 mb-8 text-sm leading-relaxed text-muted-foreground">
              Raporunu aşağıya yaz. Gönderdikten sonra bu link geçersiz olur.
            </p>
            <ReviewerReportForm token={token} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
