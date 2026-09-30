import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Calendar, Lock, ExternalLink, CheckCircle2, ArrowRight } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { getGradeFromScore, SEVERITY_CONFIG, type Severity, type SecurityScan } from "@/lib/security/types";
import type { Tables } from "@/lib/supabase/database.types";
import { PublicAuditBadgeWidget } from "./badge-widget";

type TargetRow = Pick<Tables<"security_targets">, "id" | "name" | "target_url" | "is_verified">;
type VulnerabilityRow = Tables<"security_vulnerabilities">;
type ScanSummary = SecurityScan["summary"];

interface Props {
  params: Promise<{ scanId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scanId } = await params;
  const admin = createAdminClient();

  const { data: scan } = await admin
    .from("security_scans")
    .select("user_id, health_score, security_targets(name, target_url)")
    .eq("id", scanId)
    .maybeSingle();

  if (!scan) return { title: "Güvenlik Raporu Bulunamadı — Lancerix" };

  const target = scan.security_targets as TargetRow | null;
  const score = scan.health_score ?? 100;
  const { grade } = getGradeFromScore(score);

  // Same live subscription check as the page body below -- a canceled
  // Ajans subscription should drop the custom provider name here too.
  const { data: metaAgencySub } = await admin
    .from("monitoring_subscriptions")
    .select("id")
    .eq("subscriber_id", scan.user_id)
    .eq("plan_id", "AGENCY")
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  const { data: branding } = metaAgencySub
    ? await admin
        .from("security_agency_branding")
        .select("agency_name")
        .eq("user_id", scan.user_id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  const providerName = branding?.agency_name || "Lancerix Security Vault";

  return {
    title: `Siber Güvenlik Denetim Raporu (%${score} - ${grade}) — ${target?.name || "Hedef"} | ${providerName}`,
    description: `${providerName} siber güvenlik motoru tarafından üretilen SHA-256 mühürlü kamusal güvenlik denetim ve uyumluluk raporu.`,
  };
}

export default async function PublicAuditPage({ params }: Props) {
  const { scanId } = await params;
  const admin = createAdminClient();

  const { data: scan, error } = await admin
    .from("security_scans")
    .select(`
      id,
      user_id,
      scan_type,
      status,
      health_score,
      summary,
      document_sha256,
      completed_at,
      created_at,
      security_targets (
        id,
        name,
        target_url,
        is_verified
      ),
      security_vulnerabilities (
        id,
        title,
        description,
        severity,
        category,
        cvss_score,
        affected_url,
        evidence,
        remediation_patch,
        status
      )
    `)
    .eq("id", scanId)
    .maybeSingle();

  if (error || !scan) {
    notFound();
  }

  // White-labeling is an Ajans-plan feature (2026-10-01): re-checked here
  // against the live subscription rather than trusting the branding row's
  // own is_active flag, so a canceled subscription stops showing the
  // customer's branding on reports the same day it stops being paid for --
  // same "ACTIVE status is the authorization" rule monitoring-run.ts
  // already applies to scanning itself.
  const { data: agencySub } = await admin
    .from("monitoring_subscriptions")
    .select("id")
    .eq("subscriber_id", scan.user_id)
    .eq("plan_id", "AGENCY")
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle();

  const { data: agencyBranding } = agencySub
    ? await admin
        .from("security_agency_branding")
        .select("agency_name, logo_url, primary_color, custom_footer, is_active")
        .eq("user_id", scan.user_id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  const target = scan.security_targets as TargetRow | null;
  const vulns = (scan.security_vulnerabilities || []) as VulnerabilityRow[];
  const summary = (scan.summary || {}) as Partial<ScanSummary>;

  const score = scan.health_score ?? 100;
  const { grade, color: gradeColor } = getGradeFromScore(score);

  const brandName = agencyBranding?.agency_name || "Lancerix Security Vault";
  const brandLogo = agencyBranding?.logo_url;
  const brandColor = agencyBranding?.primary_color;
  const brandFooter = agencyBranding?.custom_footer;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Top Bar / Header */}
      <header className="border-b border-border/70 bg-card/60 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            {brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brandLogo} alt={brandName} className="h-8 max-w-[160px] object-contain" />
            ) : (
              <span
                className="text-white flex size-8 items-center justify-center rounded-lg shadow-sm"
                style={{ backgroundColor: brandColor || "var(--primary)" }}
              >
                <ShieldCheck className="size-4" />
              </span>
            )}
            <span className="font-bold tracking-tight text-foreground text-sm">
              {brandName}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              Kendi Siteni Tara <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Verification Certificate Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/20 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Pasif Güvenlik Hijyeni Taraması
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {target?.name || "Hedef"} Güvenlik Tarama Raporu
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="size-3.5 text-primary" /> {target?.target_url}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {scan.completed_at
                    ? new Date(scan.completed_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Devam ediyor"}
                </span>
              </div>
            </div>

            {/* Score Badge */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-background/90 px-6 py-4 text-center shadow-xs">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Duruş Skoru
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">%{score}</span>
                <span className={`text-2xl font-bold ${gradeColor}`}>{grade}</span>
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {score >= 80 ? "Saldırı Direnci Yüksek" : "İyileştirme Gerekiyor"}
              </span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Seal */}
          {scan.document_sha256 && (
            <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                  Kriptografik SHA-256 Denetim Mührü
                </span>
                <p className="font-mono text-xs text-foreground/90 break-all select-all">
                  {scan.document_sha256}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-emerald-400 font-medium inline-flex items-center gap-1">
                <Lock className="size-3" /> Değiştirilemez Kayıt
              </span>
            </div>
          )}
        </div>

        {/* What this scan is and isn't -- prevents "full pentest" being read
            off a header/hygiene check, especially important on a page that
            gets embedded/shared externally as a badge and trust signal. */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Bu taramanın kapsamı:</span> Hedefe zarar vermeyen,
          yetkisiz bir ziyaretçinin tarayıcısının zaten yapabileceği pasif kontroller (HTTP güvenlik başlıkları,
          form/çerez hijyeni, bilinen hassas dosya yolları). Bu bir sızma testi (penetrasyon testi) değildir --
          exploit denemesi, port taraması veya kimlik doğrulama atlatma içermez. Risk puanları, gerçek CVSS
          metodolojisiyle değil, bulgu ciddiyetinden türetilen dahili bir ölçekle hesaplanır.
        </div>

        {/* Embed Badge Widget for Target Owner */}
        {target?.id && (
          <PublicAuditBadgeWidget targetId={target.id} targetName={target.name} score={score} grade={grade} />
        )}

        {/* Executive Summary & Findings Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Kritik Zafiyetler
            </span>
            <div className="text-3xl font-extrabold text-red-400">{summary.criticalCount || 0}</div>
            <p className="text-xs text-muted-foreground">Acil düzeltme gerektiren en yüksek öncelikli bulgular</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Yüksek & Orta Risk
            </span>
            <div className="text-3xl font-extrabold text-orange-400">
              {(summary.highCount || 0) + (summary.mediumCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Güvenlik başlıkları ve yapılandırma eksikleri</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Denetim Kapsamı
            </span>
            <div className="text-base font-bold text-foreground">OWASP Top 10 + CVEs</div>
            <p className="text-xs text-muted-foreground">Playwright + Nuclei + AI Triage Motoru</p>
          </div>
        </div>

        {/* Vulnerabilities Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Denetim Bulguları & Güvenlik Durumu</h2>

          {vulns.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-2">
              <CheckCircle2 className="size-10 text-emerald-400 mx-auto" />
              <h3 className="font-semibold text-foreground text-base">Güvenlik Açığı Tespit Edilmedi</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Taranan saldırı yüzeyi, HTTPS şifrelemesi ve temel güvenlik konfigürasyonları standartlara uygundur.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vulns.map((v) => {
                const config = SEVERITY_CONFIG[v.severity as Severity];
                return (
                  <div
                    key={v.id}
                    className="rounded-xl border border-border/70 bg-card p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}
                        >
                          {config.label}
                        </span>
                        <span
                          className="text-xs font-mono text-muted-foreground"
                          title="Ciddiyet seviyesinden türetilen dahili risk puanı -- resmi CVSS metodolojisiyle hesaplanmamıştır."
                        >
                          Risk Puanı {v.cvss_score}
                        </span>
                        <span className="text-xs font-semibold text-foreground">{v.title}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{v.description}</p>

                    {v.evidence && (
                      <div className="rounded-lg bg-muted/40 p-2.5 text-xs font-mono text-muted-foreground">
                        <span className="font-semibold text-foreground text-[11px] block mb-0.5">Kanıt:</span>
                        {v.evidence}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {!agencyBranding && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4 print:hidden">
            <h3 className="text-xl font-bold text-foreground">
              Kendi web uygulamanızı otonom güvenlik denetiminden geçirin
            </h3>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Lancerix, sistemlerinizi 7/24 denetleyerek açıkları korsanlardan önce yakalar ve doğrudan birleştirilebilir kod yamaları (Fix PR) üretir.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                Ücretsiz Taramayı Başlat <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}

        <footer className="pt-6 pb-12 border-t border-border/60 text-center space-y-1">
          <p className="text-xs font-medium text-foreground">
            {brandFooter || "Bu denetim sertifikası Lancerix Otonom Siber Güvenlik Ajanı tarafından üretilmiştir."}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            Doğrulanmış Denetim Kimliği: {scan.id} • Kriptografik SHA-256 Onaylı
          </p>
        </footer>
      </main>
    </div>
  );
}
