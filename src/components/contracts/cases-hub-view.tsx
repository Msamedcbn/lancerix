"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Scale,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DEFAULT_LOCALE, PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";
import { PRECEDENT_CASES } from "@/lib/data/precedent-cases";

export function CasesHubView({
  locale = DEFAULT_LOCALE,
}: Readonly<{
  locale?: Locale;
}>) {
  const isTr = locale === "tr";
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const homeHref = PUBLIC_ROUTES.home[locale] as Route;

  const filteredCases = selectedCategory === "ALL"
    ? PRECEDENT_CASES
    : PRECEDENT_CASES.filter((c) => {
        if (selectedCategory === "FINTECH") return c.id.includes("kuyumcu") || c.id.includes("fintech");
        if (selectedCategory === "MOBILE") return c.id.includes("fintech") || c.id.includes("mobil");
        if (selectedCategory === "ERP") return c.id.includes("lojistik") || c.id.includes("erp");
        if (selectedCategory === "ECOMMERCE") return c.id.includes("e-ticaret") || c.id.includes("ecommerce");
        return true;
      });

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
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href={homeHref} className="hover:text-foreground transition-colors">
              {isTr ? "Ana Sayfa" : "Home"}
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">
              {isTr ? "Vakalar & Emsal Kararlar" : "Case Studies & Precedents"}
            </span>
          </div>

          {/* Hero Header */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200 shadow-xs">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>{isTr ? "Hukuki Emsal Kararlar & Adli Bilirkişi Dosyaları" : "Legal Precedents & Forensic Case Dossiers"}</span>
            </span>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-foreground max-w-4xl leading-[1.15]">
              {isTr
                ? "Yazılımcıların Hakedişini Kurtaran Gerçek Emsal Davalar"
                : "Real Freelance Disputes Where Developers Recovered 100% of Their Fees"}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {isTr
                ? "Keyfi 'beğenmedim' bahaneleri, App Store gecikmesi suçlamaları ve sözleşme dışı 18 yeni özellik dayatmaları... Türk Borçlar Kanunu (TBK m. 477), HMK m. 193 ve Lancerix telemetri mührüyle hakedişlerin nasıl kurtarıldığını adım adım inceleyin."
                : "Bad-faith subjective dislikes, blame for app store review delays, and scope creep blackmail... Discover how Turkish contract law (Art. 477), Civil Procedure evidence agreements (Art. 193), and Lancerix cryptographic seals protected 100% of contracted fees."}
            </p>

            {/* Quick Aggregate Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-sm transition-shadow">
                <div className="text-xs font-medium text-muted-foreground">
                  {isTr ? "Toplam Kurtarılan Hak Ediş" : "Total Fees Recovered"}
                </div>
                <div className="text-2xl font-extrabold font-display text-emerald-600 mt-1">
                  460.000 ₺
                </div>
                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {isTr ? "4 Emsal Karar Dosyası" : "4 Precedent Cases"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-sm transition-shadow">
                <div className="text-xs font-medium text-muted-foreground">
                  {isTr ? "Yazılımcı Başarı Oranı" : "Developer Win Rate"}
                </div>
                <div className="text-2xl font-extrabold font-display text-emerald-600 mt-1">
                  %100
                </div>
                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {isTr ? "Yazılımcı Lehine Kesin Karar" : "Enforced In Developer Favor"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-sm transition-shadow">
                <div className="text-xs font-medium text-muted-foreground">
                  {isTr ? "Ortalama Çözüm Süresi" : "Avg. Resolution Time"}
                </div>
                <div className="text-2xl font-extrabold font-display text-foreground mt-1">
                  {isTr ? "7 Gün" : "7 Days"}
                </div>
                <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                  {isTr ? "TBK 477 Yasal Süresi" : "Statutory Acceptance Window"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:shadow-sm transition-shadow">
                <div className="text-xs font-medium text-muted-foreground">
                  {isTr ? "Delil Güvencesi" : "Evidence Standard"}
                </div>
                <div className="text-2xl font-extrabold font-display text-foreground mt-1">
                  HMK 193
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {isTr ? "Münhasır Delil Sözleşmesi" : "Binding Evidence Agreement"}
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
            {[
              { id: "ALL", label: isTr ? "Tüm Vakalar" : "All Cases" },
              { id: "FINTECH", label: isTr ? "FinTech & API" : "FinTech & APIs" },
              { id: "MOBILE", label: isTr ? "Mobil Uygulama" : "Mobile Apps" },
              { id: "ERP", label: isTr ? "Kurumsal & ERP" : "Enterprise ERP" },
              { id: "ECOMMERCE", label: isTr ? "E-Ticaret & Ajans" : "E-Commerce" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? "bg-brand text-brand-foreground shadow-xs"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Case Studies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="rounded-3xl bg-card border border-border p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Top Badge & Amount */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        caseItem.isFounderStory
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {caseItem.isFounderStory && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{caseItem.tag[locale]}</span>
                    </span>

                    <span className="text-xs font-mono text-muted-foreground">
                      {caseItem.date}
                    </span>
                  </div>

                  <div>
                    <div className="text-3xl font-extrabold font-display text-emerald-600">
                      {caseItem.amount}
                    </div>
                    <h2 className="text-xl font-bold font-display text-foreground mt-2 group-hover:text-brand transition-colors">
                      {caseItem.title[locale]}
                    </h2>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {caseItem.summary[locale]}
                  </p>

                  {/* Conflict & Resolution Snippet */}
                  <div className="space-y-2 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-muted-foreground">
                      <strong className="text-foreground block mb-0.5">
                        {isTr ? "Uyuşmazlık Konusu:" : "Disputed Issue:"}
                      </strong>
                      {caseItem.keyConflict[locale]}
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950">
                      <strong className="text-emerald-900 block mb-0.5">
                        {isTr ? "Hukuki Hüküm & Çözüm:" : "Ruling & Resolution:"}
                      </strong>
                      {caseItem.resolution[locale]}
                    </div>
                  </div>
                </div>

                {/* Footer with Legal Basis & CTA Button */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{caseItem.legalBasis}</span>
                  </div>

                  <Link
                    href={caseItem.slug[locale] as Route}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-brand-foreground font-bold text-xs sm:text-sm shadow-xs hover:opacity-90 active:scale-[0.98] transition"
                  >
                    <span>{isTr ? "Duruşmayı Yönet" : "Enter Courtroom"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Legal FAQ Section */}
          <div className="rounded-3xl bg-card border border-border p-6 sm:p-10 space-y-6 shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-mono text-brand uppercase tracking-wider block font-bold">
                {isTr ? "Hukuki Rehber & Sık Sorulan Sorular" : "Legal FAQ & Precedent Guidance"}
              </span>
              <h3 className="text-2xl font-bold font-display text-foreground">
                {isTr ? "Freelance Sözleşmelerinde En Çok Karşılaşılan Uyuşmazlıklar" : "Frequently Disputed Freelance Software Scenarios"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <HelpCircle className="w-4 h-4 text-brand" />
                  <span>{isTr ? "Müşteri 'tasarımı beğenmedim' diyerek parayı kesebilir mi?" : "Can a client withhold pay claiming they dislike the design?"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isTr
                    ? "Hayır. TBK m. 477 ve Yargıtay yerleşik içtihatlarına göre, sözleşmede kararlaştırılan objektif kriterler karşılandığı takdirde soyut estetik beğeniler fesih ve ödeme kesintisi sebebi olamaz."
                    : "No. Under Turkish Code of Obligations Art. 477, once objective criteria are fulfilled and delivered without timely defect reports, subjective aesthetic dissatisfaction is not legal grounds for non-payment."}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{isTr ? "TBK m. 477'deki 7 günlük sessizlik kuralı nasıl işler?" : "How does the statutory 7-day silence rule work?"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isTr
                    ? "Yazılımcı eseri teslim ettiğinde işverenin makul sürede (kanunen ve teamülen 7 gün) somut hata bildirimi yapması zorunludur. Süre dolduğunda işveren eseri kanunen zımnen kabul etmiş sayılır."
                    : "Upon formal delivery, the client bears the duty to inspect and notify specific defects within a statutory reasonable window (typically 7 days). Inaction constitutes legally binding tacit acceptance."}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>{isTr ? "Lancerix delil raporu mahkemede delil sözleşmesi sayılır mı?" : "Is the Lancerix audit report an admissible evidence contract?"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isTr
                    ? "Evet. 6100 sayılı Hukuk Muhakemeleri Kanunu m. 193 uyarınca tarafların sözleşmede kararlaştırdığı SHA-256 zaman damgalı ProofGuard logları münhasır bağlayıcı delil niteliğindedir."
                    : "Yes. Under Civil Procedure Code Art. 193, cryptographic telemetry and SHA-256 timestamps stipulated between parties qualify as binding exclusive documentary evidence."}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isTr ? "Müşterinin yazılımı canlıya alıp kullanması kabul anlamına gelir mi?" : "Does deploying the software to production imply acceptance?"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isTr
                    ? "Kesinlikle evet. Eserin fiilen kullanılması veya ticari operasyona alınması, ayıplardan feragat ve eserin kabulü hükmündedir (TBK m. 477 fıkra 1)."
                    : "Absolutely yes. De facto commercial use or production operation of delivered software legally operates as definitive acceptance and waiver of open defects."}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Conversion CTA */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-50/80 via-white to-brand/5 border border-border p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              {isTr
                ? "Siz de Bir Sonraki Teslimatınızı Delil Mührüyle Güvenceye Alın"
                : "Seal Your Next Delivery With a Cryptographic Evidence Shield"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {isTr
                ? "Müşterinize staging linki gönderirken 60 saniyede SHA-256 adli delil mührünü ve 7 günlük TBK 477 sayacını kurun. Hak edişinizi keyfi bahanelere bırakmayın."
                : "Generate an immutable SHA-256 forensic dossier and activate the 7-day statutory countdown in 60 seconds. Never leave your earned income to arbitrary excuses."}
            </p>
            <div className="pt-3 flex flex-wrap justify-center gap-3">
              <Link
                href="/teslimat"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand text-brand-foreground font-bold text-sm transition shadow-sm hover:opacity-90 active:scale-[0.98]"
              >
                <span>{isTr ? "Tek Tıkla Teslimat Mührü Oluştur" : "Create Delivery Seal (Free)"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={PUBLIC_ROUTES.trustArchitecture[locale] as Route}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-foreground font-semibold text-sm transition border border-border shadow-xs"
              >
                <span>{isTr ? "Güven Mimarisini İncele" : "Explore Trust Architecture"}</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
