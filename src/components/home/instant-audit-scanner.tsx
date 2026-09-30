"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

import { runInstantAuditAction } from "@/app/(dashboard)/security-actions";

export function InstantAuditScanner() {
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

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const res = await runInstantAuditAction(url);
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
      <form onSubmit={handleScan} className="relative flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Globe className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Web sitenizi yazın (örn: https://app.sirketiniz.com)"
            required
            className="w-full rounded-2xl border border-border/80 bg-background/80 pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-md transition-all shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Otonom Denetleniyor...
            </>
          ) : (
            <>
              Ücretsiz Tara <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

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
                Hızlı Güvenlik Değerlendirmesi
              </span>
              <h3 className="font-semibold text-foreground text-base truncate max-w-md">
                {result.url}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Sağlık Skoru</span>
                <span className="text-2xl font-extrabold text-foreground">
                  %{result.healthScore} ({result.grade})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Findings Preview */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              Tespit Edilen Bulgular ({result.vulnerabilitiesCount} Zafiyet):
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
                Tam teknik raporu ve otomatik onarım kodlarını (Fix PR) inceleyin.
              </p>
              <p>Ücretsiz hesap açarak bu hedefi sürekli izlemeye alabilirsiniz.</p>
            </div>

            <Link
              href="/register"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              Ücretsiz Kayıt Ol & Yamaları Gör <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
