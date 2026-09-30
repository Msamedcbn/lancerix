import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  FileText,
  Lock,
  Cpu,
} from "lucide-react";

import { getScanDetailsAction } from "@/app/(dashboard)/security-actions";
import {
  getGradeFromScore,
  SEVERITY_CONFIG,
  type SecurityScan,
  type Severity,
  type VulnerabilityCategory,
} from "@/lib/security/types";
import type { Tables } from "@/lib/supabase/database.types";
import { AgentTerminal, VulnerabilityCard } from "./scan-terminal";

type TargetRow = Pick<Tables<"security_targets">, "id" | "name" | "target_url" | "is_verified">;
type VulnerabilityRow = Tables<"security_vulnerabilities">;
type ScanLogRow = Tables<"security_scan_logs">;
type ScanSummary = SecurityScan["summary"];

export const metadata: Metadata = {
  title: "Güvenlik Denetim Raporu — Lancerix",
};

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scan = await getScanDetailsAction(id);

  if (!scan) {
    notFound();
  }

  const target = scan.security_targets as TargetRow | null;
  const vulns = (scan.security_vulnerabilities || []) as VulnerabilityRow[];
  const logs = (scan.security_scan_logs || []) as ScanLogRow[];
  const summary = (scan.summary || {}) as Partial<ScanSummary>;

  const score = scan.health_score ?? 100;
  const { grade, color: gradeColor } = getGradeFromScore(score);

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="flex items-center gap-2">
        <Link
          href={`/targets/${target?.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Hedefe Dön
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {target?.name || "Hedef"} Güvenlik Denetim Raporu
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                scan.status === "COMPLETED"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : scan.status === "RUNNING"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {scan.status}
            </span>
          </div>
          <p className="font-mono text-xs text-muted-foreground">{target?.target_url}</p>
        </div>

        {scan.document_sha256 && (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
              Kriptografik SHA-256 Rapor Mührü
            </span>
            <code className="text-[10px] font-mono text-primary truncate max-w-xs block">
              {scan.document_sha256.slice(0, 24)}...
            </code>
          </div>
        )}
      </div>

      {/* Executive KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Güvenlik Sağlık Skoru
          </span>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              %{score}
            </span>
            <span className={`text-2xl font-bold ${gradeColor}`}>{grade}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {score >= 80 ? "Güçlü güvenlik savunması" : "Düzeltilmesi gereken zafiyetler var"}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Bulgu Dağılımı
          </span>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-foreground">{vulns.length}</span>
            <span className="text-xs text-muted-foreground">Toplam Güvenlik Bulgusu</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-red-400 font-semibold">{summary.criticalCount || 0} Kritik</span>
            <span>•</span>
            <span className="text-orange-400 font-semibold">{summary.highCount || 0} Yüksek</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{summary.mediumCount || 0} Orta</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ajan Motoru
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">Playwright + Nuclei + AI Triage</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3" />
            {new Date(scan.created_at).toLocaleString("tr-TR")}
          </p>
        </div>
      </div>

      {/* Real-Time Agent Terminal Execution Log */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Terminal className="size-4 text-primary" /> Otonom Ajan Yürütme Kayıtları
        </h2>
        <AgentTerminal logs={logs} />
      </div>

      {/* Findings & Vulnerabilities Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tespit Edilen Güvenlik Açıkları</h2>
            <p className="text-xs text-muted-foreground">
              Her bulgu için etki analizi ve doğrudan uygulanabilir onarım kodları (Remediation) listelenmiştir.
            </p>
          </div>
        </div>

        {vulns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-12 text-center">
            <ShieldCheck className="size-12 text-emerald-400" />
            <h3 className="mt-4 text-base font-semibold text-foreground">Harika! Zafiyet Tespit Edilemedi</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Bu tarama kapsamında taranan güvenlik başlıkları, TLS konfigürasyonu ve hassas dosya kontrolleri başarıyla tamamlandı.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vulns.map((v) => (
              <VulnerabilityCard
                key={v.id}
                vuln={{
                  ...v,
                  severity: v.severity as Severity,
                  category: v.category as VulnerabilityCategory,
                  cvss_score: v.cvss_score ?? 0,
                  evidence: v.evidence ?? undefined,
                  remediation_patch: v.remediation_patch ?? undefined,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
