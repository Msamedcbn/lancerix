"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  Scale,
  CheckCircle2,
  ArrowRight,
  Lock,
} from "lucide-react";
import {
  CheckBadgeIcon,
  DocumentArrowDownIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import {
  SiNextdotjs,
  SiPostgresql,
  SiNginx,
  SiDocker,
  SiRedis,
  SiLetsencrypt,
} from "@icons-pack/react-simple-icons";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CourtroomTribunal } from "@/components/contracts/courtroom-tribunal";
import { DEFAULT_LOCALE, PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";
import { ARBITRATION_CASE_COPY } from "@/lib/i18n/dictionaries/arbitration-case";
import type { PublicVerificationRecord } from "@/lib/data/verification-types";
import type { PrecedentCaseItem } from "@/lib/data/precedent-cases";

export function ArbitrationCaseView({
  locale = DEFAULT_LOCALE,
  record,
  caseItem,
}: Readonly<{
  locale?: Locale;
  record: PublicVerificationRecord;
  caseItem?: PrecedentCaseItem;
}>) {
  const t = ARBITRATION_CASE_COPY[locale];
  const homeHref = PUBLIC_ROUTES.home[locale] as Route;

  const title = caseItem ? caseItem.title[locale] : t.hero.title;
  const heroBadge = caseItem ? caseItem.tag[locale] : t.hero.badge;
  const subtitle = caseItem ? caseItem.summary[locale] : t.hero.subtitle;
  const amount = caseItem ? caseItem.amount : t.courtHeader.amount;
  const caseNo = caseItem ? caseItem.docketRef : t.courtHeader.caseNo;
  const legalBasis = caseItem ? caseItem.legalBasis : "TBK 477 & HMK 193";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-brand/15 selection:text-brand relative">
      {/* Subtle Ambient Light Mesh Gradient */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="from-brand/10 absolute -top-32 left-1/4 size-[36rem] rounded-full bg-gradient-to-br to-transparent blur-3xl" />
        <div className="absolute top-1/3 right-1/4 size-[30rem] rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl" />
      </div>

      <SiteHeader locale={locale} />

      <main className="w-full pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Breadcrumb & Live Docket Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Link href={homeHref} className="hover:text-foreground transition-colors">
                {locale === "tr" ? "Ana Sayfa" : "Home"}
              </Link>
              <span>/</span>
              <Link href={(locale === "tr" ? "/vaka" : "/en/case-study") as Route} className="hover:text-foreground transition-colors">
                {locale === "tr" ? "Vakalar & Emsal Kararlar" : "Precedent Cases"}
              </Link>
              <span>/</span>
              <span className="text-foreground font-semibold">
                {caseItem ? caseItem.amount : (locale === "tr" ? "85.000 TL Tahkim Davası" : "85K ₺ Arbitration Case")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono text-[11px] font-semibold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t.courtHeader.sessionBadge}
              </span>
            </div>
          </div>

          {/* Court Banner & Case Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200 shadow-xs">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>{heroBadge}</span>
              </span>
              <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border font-semibold">
                {caseNo}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-foreground max-w-4xl leading-[1.15]">
              {title}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {subtitle}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-sm transition-shadow">
                <div className="text-xs font-medium text-muted-foreground">{t.courtHeader.amountLabel}</div>
                <div className="text-2xl font-extrabold font-display text-emerald-600 mt-1">
                  {amount}
                </div>
                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {locale === "tr" ? "Hüküm Kesinleşti" : "Award Enforced"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-sm transition-shadow">
                <div className="text-xs font-medium text-muted-foreground">{locale === "tr" ? "Hukuki Temel" : "Legal Basis"}</div>
                <div className="text-sm font-bold font-mono text-foreground mt-2 truncate">
                  {legalBasis}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  {locale === "tr" ? "Zımni Kabul & Delil Kalkanı" : "Statutory Acceptance & Shield"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-sm transition-shadow">
                <div className="text-xs font-medium text-muted-foreground">{locale === "tr" ? "Geliştirme & Teslimat" : "Timeline"}</div>
                <div className="text-sm font-bold font-mono text-foreground mt-2">
                  22 Gün + 7 Gün
                </div>
                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {locale === "tr" ? "Sessizlik Sayacı İşletildi" : "Statutory Clock Expired"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-sm transition-shadow">
                <div className="text-xs font-medium text-muted-foreground">{locale === "tr" ? "Bilirkişi Sonucu" : "Tribunal Ruling"}</div>
                <div className="text-sm font-bold font-mono text-emerald-600 mt-2">
                  %100 Hakediş Onayı
                </div>
                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {locale === "tr" ? "Yazılımcı Lehine İlam" : "100% In Favor of Engineer"}
                </div>
              </div>
            </div>
          </div>

          {/* CHAPTER BY CHAPTER STORY SECTION */}
          <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 space-y-8 shadow-xs relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-xs font-mono text-emerald-700 uppercase tracking-wider block font-bold">
                {locale === "tr" ? "Somut Vaka İncelemesi · Kurucunun Gerçek Hikayesi" : "Case Chronology & Founder's Story"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
                {t.story.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t.story.subtitle}
              </p>
            </div>

            {/* Story Chapters List */}
            <div className="space-y-6">
              {t.story.chapters.map((chapter) => (
                <div
                  key={chapter.index}
                  className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 relative group hover:bg-white hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs font-bold flex items-center justify-center border border-emerald-200">
                        {chapter.index}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-foreground font-display">
                        {chapter.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{chapter.date}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white border border-border text-emerald-700 shadow-2xs">
                        {chapter.badge}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {chapter.detail}
                  </p>

                  <div className="pt-2 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="text-foreground font-semibold">{chapter.technicalArtifact.label}:</span>
                    <span className="text-emerald-700 truncate max-w-md select-all bg-white px-2 py-0.5 rounded border border-slate-200">
                      {chapter.technicalArtifact.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* THE INTERACTIVE COURTROOM EXPERIENCE */}
          <CourtroomTribunal locale={locale} />

          {/* Live ProofGuard Forensic Dossier Card */}
          <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 uppercase tracking-wider font-semibold">
                  <span>{locale === "tr" ? "HMK m. 193 Bilirkişi Dosyası" : "Expert Witness Dossier"}</span>
                  <span>·</span>
                  <span className="text-foreground font-bold">{record.reference}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                  {record.title}
                </h3>
              </div>

              {/* Stack Icons from Simple Icons */}
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mr-1">
                  Stack:
                </span>
                <div className="flex items-center gap-2 text-slate-600">
                  <span title="Next.js"><SiNextdotjs className="w-4 h-4 hover:text-foreground transition" /></span>
                  <span title="PostgreSQL"><SiPostgresql className="w-4 h-4 hover:text-blue-600 transition" /></span>
                  <span title="Nginx"><SiNginx className="w-4 h-4 hover:text-emerald-600 transition" /></span>
                  <span title="Docker"><SiDocker className="w-4 h-4 hover:text-sky-600 transition" /></span>
                  <span title="Redis"><SiRedis className="w-4 h-4 hover:text-red-600 transition" /></span>
                  <span title="Let's Encrypt TLS 1.3"><SiLetsencrypt className="w-4 h-4 hover:text-amber-600 transition" /></span>
                </div>
              </div>
            </div>

            {/* Criteria Presets */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckBadgeIcon className="w-4 h-4 text-emerald-600" />
                {locale === "tr"
                  ? "Sözleşmeye Bağlı Kriterlerin Karşılanma Durumu (4 / 4 Başarılı)"
                  : "Contractual Acceptance Criteria Status (4 / 4 Passed)"}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {record.criteria.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{c.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Signatures */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                  <Lock className="w-3.5 h-3.5 text-brand" />
                  {locale === "tr"
                    ? "HMK m. 193 Uyarınca Çift Taraflı İmzalanmış Dijital Mühür"
                    : "Bilateral SHA-256 Electronic Seal under Art. 193 CPC"}
                </span>
                <span className="font-mono text-[11px] text-emerald-700 font-bold">SHA-256</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-foreground font-sans font-semibold text-xs mb-1">
                    {locale === "tr" ? "Yazılımcı İmzası" : "Engineer Signature"} ({record.freelancerName})
                  </div>
                  <div className="text-muted-foreground text-[11px]">2026-09-14 09:12 UTC · IP: 185.22.184.12</div>
                  <div className="text-emerald-700 text-[10px] mt-1 break-all select-all font-semibold">
                    sha256:7a41ef689bc01a4ef39082918e9a11...
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-foreground font-sans font-semibold text-xs mb-1">
                    {locale === "tr" ? "İşveren İmzası" : "Employer Signature"} ({record.clientName})
                  </div>
                  <div className="text-muted-foreground text-[11px]">2026-09-14 11:04 UTC · IP: 212.156.40.85</div>
                  <div className="text-emerald-700 text-[10px] mt-1 break-all select-all font-semibold">
                    sha256:3d92fb011ce499ab110488219c01...
                  </div>
                </div>
              </div>
            </div>

            {/* PDF and Verify Links */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <a
                  href="/api/contracts/ornek-tahkim/pdf"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-sm active:scale-[0.98]"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  <span>{locale === "tr" ? "Resmi HMK 193 Bilirkişi Raporunu İndir (PDF)" : "Download Official Forensic Award (PDF)"}</span>
                </a>

                <Link
                  href={`/verify/${record.reference}` as Route}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-foreground text-sm font-semibold transition border border-border shadow-xs"
                >
                  <span>{locale === "tr" ? "Kamu Doğrulama Sayfası" : "Public Verification Portal"}</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </Link>
              </div>

              <div className="text-xs text-muted-foreground text-center sm:text-right">
                {locale === "tr"
                  ? "PDF üzerinde HMK 193 uyumlu dinamik karekod mevcuttur."
                  : "PDF carries a dynamic QR code admissible under Art. 193 CPC."}
              </div>
            </div>
          </div>

          {/* BOTTOM CALL TO ACTION */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-50/80 via-white to-brand/5 border border-border p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              {t.bottomCta.title}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.bottomCta.description}
            </p>
            <div className="pt-3 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand text-brand-foreground font-bold text-sm transition shadow-sm hover:opacity-90 active:scale-[0.98]"
              >
                <span>{t.bottomCta.button}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={PUBLIC_ROUTES.trustArchitecture[locale] as Route}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-foreground font-semibold text-sm transition border border-border shadow-xs"
              >
                <span>{t.bottomCta.secondary}</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
