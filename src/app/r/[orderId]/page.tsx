import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, ExternalLink, Calendar, CheckCircle2, AlertTriangle, XCircle, ArrowLeft } from "lucide-react";

import { getStandaloneOrderPublic } from "@/lib/data/standalone-qa";
import type {
  AccessibilityResults,
  DeadLinksResults,
  FormValidationResults,
  InteractionScanResults,
  PerformanceResults,
  SeoMetaResults,
  VisualOverflowResults,
} from "@/lib/qa/standalone";
import { PrintButton } from "./print-button";

interface Props {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  const order = await getStandaloneOrderPublic(orderId);
  if (!order) return { title: "Rapor Bulunamadı — Lancerix" };

  return {
    title: `Doğrulanmış QA Raporu (${order.target_url}) — Lancerix`,
    description: `Lancerix Bağımsız Otomatik QA Doğrulama Raporu. SHA-256 Kriptografik Mühür ile korunan site analiz sonuçları.`,
  };
}

const PACKAGE_LABEL: Record<string, string> = {
  BASIC: "Temel Kontrol Paket",
  PRO: "Profesyonel Paket",
  FULL: "Tam Tarama Paket",
};

const CHECK_TYPE_LABEL: Record<string, string> = {
  ACCESSIBILITY: "Erişilebilirlik",
  PERFORMANCE: "Hız & Performans",
  SEO_META: "SEO & Meta Uyumluluğu",
  VISUAL_OVERFLOW: "Görsel/Mobil Taşma",
  DEAD_LINKS: "Ölü/Kırık Link Taraması",
  FORM_VALIDATION: "Form & Validasyon Bütünlüğü",
  INTERACTION_SCAN: "Genel Etkileşim & Hata Taraması",
};

const IMPACT_BADGE: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  serious: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  moderate: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  minor: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
};

const IMPACT_LABEL: Record<string, string> = {
  critical: "Kritik",
  serious: "Ciddi",
  moderate: "Orta",
  minor: "Küçük",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "PASS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
        <CheckCircle2 className="h-3.5 w-3.5" /> Sorun Bulunmadı
      </span>
    );
  }
  if (status === "PARTIAL") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
        <AlertTriangle className="h-3.5 w-3.5" /> Küçük Sorunlar Var
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
      <XCircle className="h-3.5 w-3.5" /> Ciddi Sorun Bulundu
    </span>
  );
}

function AccessibilityDetail({ results }: { results: AccessibilityResults }) {
  if (!results.violations || results.violations.length === 0) {
    return <p className="text-xs text-emerald-600 dark:text-emerald-400">Erişilebilirlik taramasında sıfır ihlal tespit edildi.</p>;
  }
  return (
    <ol className="mt-3 flex list-none flex-col gap-2.5">
      {results.violations.map((v) => (
        <li
          key={v.id}
          className="flex items-start gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40"
        >
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${IMPACT_BADGE[v.impact ?? "minor"]}`}
          >
            {IMPACT_LABEL[v.impact ?? "minor"]}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">{v.help}</p>
            <p className="mt-1 text-[0.7rem] text-muted-foreground">{v.nodeCount} farklı HTML öğesinde tespit edildi</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function PerformanceDetail({ results }: { results: PerformanceResults }) {
  const metrics = [
    { label: "Performans Skoru", value: `${results.performanceScore}/100` },
    { label: "LCP (En Büyük İçerik)", value: `${(results.lcpMs / 1000).toFixed(1)}s` },
    { label: "FCP (İlk İçerik)", value: `${(results.fcpMs / 1000).toFixed(1)}s` },
    { label: "CLS (Yer Değişimi)", value: results.clsScore.toFixed(3) },
    { label: "TBT (Bloklama Süresi)", value: `${results.totalBlockingTimeMs}ms` },
  ];
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40"
        >
          <dt className="text-[0.65rem] font-medium text-muted-foreground">{m.label}</dt>
          <dd className="tnum mt-1 text-sm font-bold text-foreground">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SeoMetaDetail({ results }: { results: SeoMetaResults }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
          <p className="text-[0.65rem] text-muted-foreground">Sayfa Başlığı</p>
          <p className="text-xs font-semibold truncate text-foreground">{results.title || "Bulunamadı"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
          <p className="text-[0.65rem] text-muted-foreground">Canonical Etiketi</p>
          <p className="text-xs font-semibold text-foreground">{results.canonical ? "Mevcut" : "Eksik"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-2.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
          <p className="text-[0.65rem] text-muted-foreground">Favicon</p>
          <p className="text-xs font-semibold text-foreground">{results.hasFavicon ? "Mevcut" : "Eksik"}</p>
        </div>
      </div>
      {results.missingCritical.length > 0 || results.missingRecommended.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Eksik Meta Etiketler:</p>
          <ul className="mt-1.5 list-disc list-inside text-xs text-amber-700 dark:text-amber-400 space-y-1">
            {results.missingCritical.map((m) => (
              <li key={m}><span className="font-semibold text-rose-600 dark:text-rose-400">[Kritik]</span> {m}</li>
            ))}
            {results.missingRecommended.map((m) => (
              <li key={m}><span className="font-semibold">[Önerilen]</span> {m}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Tüm temel SEO etiketleri eksiksiz.</p>
      )}
    </div>
  );
}

function VisualOverflowDetail({ results }: { results: VisualOverflowResults }) {
  if (!results.overflows || results.overflows.length === 0) {
    return <p className="text-xs text-emerald-600 dark:text-emerald-400">Tüm ekran çözünürlüklerinde mobil taşma testi başarıyla geçti.</p>;
  }
  return (
    <ul className="mt-3 space-y-2">
      {results.overflows.map((o, idx) => (
        <li key={idx} className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          <span className="font-bold">{o.width}px</span> genişliğinde <span className="font-bold">{o.overflowPx}px</span> yatay taşma saptandı.
        </li>
      ))}
    </ul>
  );
}

function DeadLinksDetail({ results }: { results: DeadLinksResults }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground">Tarama yapılan toplam link: <span className="font-bold text-foreground">{results.totalLinks}</span> | Kırık link: <span className="font-bold text-foreground">{results.brokenCount}</span></p>
      {results.brokenLinks.length > 0 && (
        <ul className="space-y-1.5">
          {results.brokenLinks.map((l, i) => (
            <li key={i} className="rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2 text-xs font-mono break-all text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
              [{l.status || "HATA"}] {l.url}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormValidationDetail({ results }: { results: FormValidationResults }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground">Tespit edilen form sayısı: <span className="font-bold text-foreground">{results.formsFound}</span></p>
      {results.issues.length > 0 ? (
        <ul className="space-y-1.5">
          {results.issues.map((issue, i) => (
            <li key={i} className="rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
              Form {issue.formIndex + 1}: {issue.issue}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Form validasyonlarında bir sorun saptanmadı.</p>
      )}
    </div>
  );
}

function InteractionScanDetail({ results }: { results: InteractionScanResults }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground">Etkileşimli öğe: <span className="font-bold text-foreground">{results.interactiveElementsFound}</span> | Tıklanan: <span className="font-bold text-foreground">{results.clickedCount}</span> | Konsol hatası: <span className="font-bold text-foreground">{results.consoleErrors.length}</span></p>
      {results.consoleErrors.length > 0 && (
        <ul className="space-y-1.5">
          {results.consoleErrors.map((err, i) => (
            <li key={i} className="rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2 text-xs font-mono break-all text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function PublicReportPage({ params }: Props) {
  const { orderId } = await params;
  const order = await getStandaloneOrderPublic(orderId);

  if (!order) {
    notFound();
  }

  const reports = order.standalone_qa_reports || [];
  const firstReport = reports[0];
  const isPaid = order.payment_status === "PAID";
  const packageName = order.package_id ? PACKAGE_LABEL[order.package_id] ?? order.package_id : "Tekil Tarama";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Printable page container */}
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Navigation & Header Actions (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between gap-4">
          <Link
            href="/site-kontrol"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Site Kontrollerime Dön
          </Link>
          <PrintButton />
        </div>

        {/* Main Document Header */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <span className="text-lg font-bold tracking-tight text-foreground">LANCERIX QA</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Doğrulanmış Rapor
                </span>
              </div>
              <h1 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Web Sitesi Otomatik Kalite Analizi
              </h1>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Tarama Tarihi: {order.created_at ? new Date(order.created_at).toLocaleString("tr-TR") : "Bilinmiyor"}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">Paket</span>
              <p className="text-sm font-semibold text-foreground">{packageName}</p>
              <div className="mt-2">
                {firstReport ? (
                  <StatusBadge status={firstReport.status} />
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Hazırlanıyor</span>
                )}
              </div>
            </div>
          </div>

          {/* Target URL Metadata Card */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-950/40">
              <span className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider">Hedef Web Adresi</span>
              <a
                href={order.target_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline truncate"
              >
                {order.target_url}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-950/40">
              <span className="text-[0.65rem] font-semibold text-muted-foreground uppercase tracking-wider">Sipariş ID</span>
              <p className="mt-1 font-mono text-xs font-semibold text-foreground truncate">{order.id}</p>
            </div>
          </div>
        </div>

        {/* SHA-256 Cryptographic Seal Block */}
        {firstReport?.document_sha256 && (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Lock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    SHA-256 Kriptografik Doğrulama Mührü
                  </h3>
                  <span className="text-[0.65rem] font-mono text-emerald-700 dark:text-emerald-400">Değiştirilemez Kayıt</span>
                </div>
                <p className="mt-1 text-[0.7rem] text-emerald-800/80 dark:text-emerald-300/80">
                  Bu rapor, headless turlama ve axe-core motoru tarafından üretilmiş olup SHA-256 özeti veritabanına kaydedilmiştir.
                </p>
                <p className="mt-2 font-mono text-[0.68rem] font-semibold text-emerald-950 dark:text-emerald-100 break-all select-all">
                  {firstReport.document_sha256}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Module Reports */}
        {!isPaid ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto" />
            <h3 className="mt-2 text-sm font-bold text-amber-900 dark:text-amber-200">
              Bu Raporun Ödemesi Tamamlanmadı
            </h3>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 max-w-md mx-auto">
              Detaylı kod kırılımlarını ve mühürlü analiz verisini incelemek için sipariş sahibinin ödemeyi tamamlaması gerekmektedir.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground px-1">Tarama Sonuçları & Analiz Detayları</h2>

            {reports.map((report) => {
              const cType = report.check_type ?? order.check_type ?? "ACCESSIBILITY";
              return (
                <div
                  key={report.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 page-break-inside-avoid"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                    <span className="text-xs font-bold text-foreground">
                      {CHECK_TYPE_LABEL[cType] ?? cType}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>

                  {cType === "PERFORMANCE" && <PerformanceDetail results={report.results as PerformanceResults} />}
                  {cType === "SEO_META" && <SeoMetaDetail results={report.results as SeoMetaResults} />}
                  {cType === "VISUAL_OVERFLOW" && <VisualOverflowDetail results={report.results as VisualOverflowResults} />}
                  {cType === "DEAD_LINKS" && <DeadLinksDetail results={report.results as DeadLinksResults} />}
                  {cType === "FORM_VALIDATION" && <FormValidationDetail results={report.results as FormValidationResults} />}
                  {cType === "INTERACTION_SCAN" && <InteractionScanDetail results={report.results as InteractionScanResults} />}
                  {cType === "ACCESSIBILITY" && <AccessibilityDetail results={report.results as AccessibilityResults} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Document Footer */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
          <p>© {new Date().getFullYear()} Lancerix Bağımsız Otomatik QA Servisi. Tüm hakları saklıdır.</p>
          <p className="text-[0.7rem]">Bu rapor Lancerix platformu üzerinde kamuya açık olarak üretilmiştir ve doğruluğu SHA-256 mührü ile teyit edilebilir.</p>
        </div>
      </div>
    </div>
  );
}
