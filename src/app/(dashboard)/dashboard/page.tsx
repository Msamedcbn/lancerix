import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Globe,
  Terminal,
  ArrowUpRight,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Cpu,
} from "lucide-react";

import { getTargetsAction, getSecurityOverviewAction } from "@/app/(dashboard)/security-actions";
import { getGradeFromScore, SEVERITY_CONFIG } from "@/lib/security/types";

export const metadata: Metadata = {
  title: "Güvenlik Merkezi — Lancerix AI Security Agent",
};

export default async function DashboardPage() {
  const [overview, targets] = await Promise.all([
    getSecurityOverviewAction(),
    getTargetsAction(),
  ]);

  const { grade, color: gradeColor } = getGradeFromScore(overview.overallScore);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card/90 to-muted/20 p-6 md:p-8 backdrop-blur-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Otonom AI Güvenlik & Pentest Ajanı Aktif
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Güvenlik Kontrol Merkezi
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Web uygulamalarınızı, API ve saldırı yüzeylerinizi sürekli denetleyin. Zafiyetleri bilgisayar korsanlarından önce tespit edip anında onarın.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/targets/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-primary/20 active:scale-[0.98]"
            >
              <Plus className="size-4" />
              Yeni Hedef Ekle
            </Link>
            <Link
              href="/izleme"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98]"
            >
              <RefreshCw className="size-4 text-muted-foreground" />
              Sürekli İzleme Planları
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Security Health Score */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Güvenlik Duruşu
            </span>
            <ShieldCheck className="size-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              %{overview.overallScore}
            </span>
            <span className={`text-xl font-bold ${gradeColor}`}>{grade}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {overview.overallScore >= 80 ? "Saldırı direnci yüksek" : "Kritik zafiyetler mevcut"}
          </div>
        </div>

        {/* Monitored Assets */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              İzlenen Hedefler
            </span>
            <Globe className="size-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {overview.targetCount}
            </span>
            <span className="text-xs text-muted-foreground">
              ({overview.verifiedTargetCount} doğrulanmış)
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Web sitesi ve API uç noktaları</div>
        </div>

        {/* Critical & High Vulnerabilities */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kritik Açıklar
            </span>
            <ShieldAlert className="size-4 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold tracking-tight text-red-400">
              {overview.vulnerabilities.critical}
            </span>
            <span className="text-sm font-semibold text-orange-400">
              +{overview.vulnerabilities.high} Yüksek
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Derhal müdahale gerektiren bulgular</div>
        </div>

        {/* Total Scans & Agent Operations */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ajan Taramaları
            </span>
            <Terminal className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {overview.totalScansCount}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Tamamlandı</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Otonom güvenlik denetimi</div>
        </div>
      </div>

      {/* Main Content Layout: Targets & Threat Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Monitored Targets List */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Kayıtlı Güvenlik Hedefleri</h2>
              <p className="text-xs text-muted-foreground">
                Doğrulanmış etki alanları ve en son tarama sonuçları
              </p>
            </div>
            <Link
              href="/targets"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Tümünü Gör <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/50 p-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Globe className="size-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">Henüz bir hedef eklenmedi</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Güvenlik açıklarını ve saldırı yüzeyinizi haritalamak için ilk web sitenizi veya API adresinizi ekleyin.
              </p>
              <Link
                href="/targets/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                <Plus className="size-3.5" />
                İlk Hedefi Tanımla
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
              {targets.slice(0, 5).map((target) => {
                const latestScan = target.security_scans?.[0];
                return (
                  <div
                    key={target.id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate text-sm">
                          {target.name}
                        </span>
                        {target.is_verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="size-2.5" /> Doğrulandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="size-2.5" /> Doğrulama Bekliyor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{target.target_url}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {latestScan ? (
                        <div className="text-right">
                          <span className="text-xs font-semibold text-foreground">
                            %{latestScan.health_score} Puan
                          </span>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            {latestScan.status.toLowerCase()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Tarama yok</span>
                      )}

                      <Link
                        href={`/targets/${target.id}`}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted"
                      >
                        İncele
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Vulnerability Distribution & Engine Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Zafiyet Dağılımı</h2>

          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
              const count =
                sev === "CRITICAL"
                  ? overview.vulnerabilities.critical
                  : sev === "HIGH"
                  ? overview.vulnerabilities.high
                  : sev === "MEDIUM"
                  ? overview.vulnerabilities.medium
                  : overview.vulnerabilities.low;

              const config = SEVERITY_CONFIG[sev];

              return (
                <div key={sev} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${config.color}`}>{config.label}</span>
                    <span className="font-mono text-muted-foreground">{count} bulgu</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        sev === "CRITICAL"
                          ? "bg-red-500"
                          : sev === "HIGH"
                          ? "bg-orange-500"
                          : sev === "MEDIUM"
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${overview.vulnerabilities.total ? Math.min(100, (count / overview.vulnerabilities.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-border/60">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cpu className="size-4 text-primary" />
                <span>Motor: Playwright + Nuclei + AI Triage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
