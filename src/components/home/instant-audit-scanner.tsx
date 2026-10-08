"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, ArrowRight, Loader2 } from "lucide-react";

import { runInstantAuditAction } from "@/app/(dashboard)/security-actions";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const SCANNER_COPY: Record<
  Locale,
  {
    placeholder: string;
    submitIdle: string;
    submitLoading: string;
    samplePrompt: string;
    assessmentTitle: string;
    healthScore: string;
    findingsTitle: (count: number) => string;
    ctaHeadline: string;
    ctaSubtext: string;
    ctaButton: string;
  }
> = {
  tr: {
    placeholder: "Web sitenizi veya canlı test adresinizi yazın (örn: https://app.sirketiniz.com)",
    submitIdle: "Canlı Örnekle Tara",
    submitLoading: "Otonom Denetleniyor...",
    samplePrompt: "Hazır örnekle dene:",
    assessmentTitle: "Hızlı Güvenlik Değerlendirmesi",
    healthScore: "Sağlık Skoru",
    findingsTitle: (count) => `Tespit Edilen Bulgular (${count} Zafiyet):`,
    ctaHeadline: "Tam teknik raporu ve otomatik onarım kodlarını (Fix PR) inceleyin.",
    ctaSubtext: "Ücretsiz hesap açarak bu hedefi sürekli izlemeye alabilirsiniz.",
    ctaButton: "Ücretsiz Kayıt Ol & Yamaları Gör",
  },
  en: {
    placeholder: "Enter your website or live staging URL (e.g. https://app.yourcompany.com)",
    submitIdle: "Run Live Audit",
    submitLoading: "Autonomously Auditing...",
    samplePrompt: "Try sample:",
    assessmentTitle: "Instant Security Assessment",
    healthScore: "Health Score",
    findingsTitle: (count) => `Detected Findings (${count} Issues):`,
    ctaHeadline: "Review full technical report and autonomous fix pull requests.",
    ctaSubtext: "Create a free account to continuously monitor this target.",
    ctaButton: "Sign Up Free & View Fixes",
  },
};

export function InstantAuditScanner({
  locale = DEFAULT_LOCALE,
}: Readonly<{ locale?: Locale }>) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    healthScore: number;
    grade: string;
    vulnerabilitiesCount: number;
    criticalCount: number;
    highCount: number;
    findingsPreview: { title: string; severity: string }[];
    logs: { stepName: string; message: string; level: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = SCANNER_COPY[locale];

  async function handleScan(e: React.FormEvent, customUrl?: string) {
    if (e) e.preventDefault();
    const target = (customUrl || url).trim();
    if (!target) return;

    if (customUrl) setUrl(customUrl);
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await runInstantAuditAction(target);
    setLoading(false);

    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="mx-auto max-w-3xl w-full">
      {/* Search Input Bar */}
      <form onSubmit={(e) => handleScan(e)} className="relative flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Globe className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t.placeholder}
            required
            className="w-full rounded-2xl border border-border/80 bg-background/80 pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 backdrop-blur-md transition-all shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {t.submitLoading}
            </>
          ) : (
            <>
              {t.submitIdle} <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Example Suggestions */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="text-[11px] font-medium text-muted-foreground/80">{t.samplePrompt}</span>
        {[
          { label: "example.com", target: "https://example.com" },
          { label: "react.dev", target: "https://react.dev" },
          { label: "nextjs.org", target: "https://nextjs.org" },
        ].map((sample) => (
          <button
            key={sample.target}
            type="button"
            onClick={(e) => {
              setUrl(sample.target);
              handleScan(e, sample.target);
            }}
            disabled={loading}
            className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[11px] font-mono text-muted-foreground transition hover:border-brand/60 hover:text-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400 font-medium text-center">
          {error}
        </div>
      )}

      {/* Result Card Modal/Box */}
      {result && (
        <div className="mt-6 rounded-2xl border border-border/80 bg-card p-6 shadow-lg space-y-5 animate-in fade-in-50 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                {t.assessmentTitle}
              </span>
              <h3 className="font-semibold text-foreground text-base truncate max-w-md">
                {result.url}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">{t.healthScore}</span>
                <span className="text-2xl font-extrabold text-foreground">
                  %{result.healthScore} ({result.grade})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Findings Preview */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              {t.findingsTitle(result.vulnerabilitiesCount)}
            </span>
            <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-muted/20">
              {result.findingsPreview.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 text-xs">
                  <span className="font-medium text-foreground">{f.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      f.severity === "CRITICAL"
                        ? "bg-red-500/10 text-red-400"
                        : f.severity === "HIGH"
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {f.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Box */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                {t.ctaHeadline}
              </p>
              <p>{t.ctaSubtext}</p>
            </div>

            <Link
              href="/register"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              {t.ctaButton} <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
