import type { Metadata } from "next";
import Link from "next/link";

import { latestReportPerModule, listMyStandaloneOrders } from "@/lib/data/standalone-qa";
import { STANDALONE_MODULE_MAX_ATTEMPTS } from "@/lib/validations/standalone-qa";
import type {
  AccessibilityResults,
  DeadLinksResults,
  FormValidationResults,
  InteractionScanResults,
  PerformanceResults,
  SeoMetaResults,
  VisualOverflowResults,
} from "@/lib/qa/standalone";

import { PayStandaloneButton } from "./pay-standalone-button";
import { RescanButton } from "./rescan-button";
import { StandaloneCheckForm } from "./standalone-check-form";

export const metadata: Metadata = { title: "Site Kontrolü" };
// createStandaloneCheck (standalone-qa-actions.ts) launches a real headless
// Chromium process synchronously inside this route's Server Action, same
// class of operation as contracts/[id]/page.tsx's Tier2 trigger -- without
// this, the route inherits Next.js's default (10s on Vercel Hobby), too
// short for a slow target site to finish loading before axe-core even runs.
export const maxDuration = 300;

const STATUS_TONE: Record<string, string> = {
  PASS: "text-brand",
  FAIL: "text-rose-600 dark:text-rose-400",
  PARTIAL: "text-amber-700 dark:text-amber-400",
  // Deliberately neutral, not red: ERROR is our scanner failing, not a
  // finding against the customer's site.
  ERROR: "text-muted-foreground",
};
const STATUS_LABEL: Record<string, string> = {
  PASS: "Sorun bulunmadı",
  FAIL: "Ciddi sorun bulundu",
  PARTIAL: "Küçük sorunlar var",
  ERROR: "Çalıştırılamadı",
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
const CHECK_TYPE_LABEL: Record<string, string> = {
  ACCESSIBILITY: "Erişilebilirlik",
  PERFORMANCE: "Hız & Performans",
  SEO_META: "SEO & Meta Uyumluluğu",
  VISUAL_OVERFLOW: "Görsel/Mobil Taşma",
  DEAD_LINKS: "Ölü/Kırık Link Taraması",
  FORM_VALIDATION: "Form & Validasyon Bütünlüğü",
  INTERACTION_SCAN: "Genel Etkileşim & Hata Taraması",
};
const PACKAGE_LABEL: Record<string, string> = {
  BASIC: "Temel Kontrol Paket",
  PRO: "Profesyonel Paket",
  FULL: "Tam Tarama Paket",
};

/** One line per check type, for the pre-payment summary -- never the full
 * detail (that's what paying unlocks). */
const MODULE_ERROR_NOTE =
  "Bu kontrol çalıştırılamadı; sonuç üretilmedi. Sitende sorun olduğu anlamına gelmez.";

function summaryLine(checkType: string, results: unknown): string {
  switch (checkType) {
    case "PERFORMANCE":
      return `Performans skoru: ${(results as PerformanceResults).performanceScore}/100.`;
    case "SEO_META": {
      const r = results as SeoMetaResults;
      return `${r.missingCritical.length + r.missingRecommended.length} eksik etiket bulundu.`;
    }
    case "VISUAL_OVERFLOW":
      return `${(results as VisualOverflowResults).overflows.length} genişlikte taşma bulundu.`;
    case "DEAD_LINKS":
      return `${(results as DeadLinksResults).brokenCount} kırık link bulundu.`;
    case "FORM_VALIDATION":
      return `${(results as FormValidationResults).issues.length} form sorunu bulundu.`;
    case "INTERACTION_SCAN":
      return `${(results as InteractionScanResults).consoleErrors.length} konsol hatası bulundu.`;
    default:
      return `${(results as AccessibilityResults).violationCount} bulgu tespit edildi.`;
  }
}

function AccessibilityDetail({ results }: { results: AccessibilityResults }) {
  if (results.violations.length === 0) return null;
  return (
    <ol className="mt-2 flex list-none flex-col gap-2">
      {results.violations.map((v) => (
        <li
          key={v.id}
          className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40"
        >
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${IMPACT_BADGE[v.impact ?? "minor"]}`}
          >
            {IMPACT_LABEL[v.impact ?? "minor"]}
          </span>
          <div className="min-w-0">
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{v.help}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{v.nodeCount} yerde bulundu</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function PerformanceDetail({ results }: { results: PerformanceResults }) {
  const metrics: { label: string; value: string }[] = [
    { label: "Performans Skoru", value: `${results.performanceScore}/100` },
    { label: "LCP", value: `${(results.lcpMs / 1000).toFixed(1)}s` },
    { label: "FCP", value: `${(results.fcpMs / 1000).toFixed(1)}s` },
    { label: "CLS", value: results.clsScore.toFixed(3) },
    { label: "Toplam Bloklama Süresi", value: `${results.totalBlockingTimeMs}ms` },
  ];
  return (
    <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40"
        >
          <dt className="text-[0.65rem] text-muted-foreground">{m.label}</dt>
          <dd className="tnum text-sm font-medium text-foreground">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FactGrid({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {facts.map((f) => (
        <div
          key={f.label}
          className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40"
        >
          <dt className="text-[0.65rem] text-muted-foreground">{f.label}</dt>
          <dd className="text-sm font-medium text-foreground">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function IssueList({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <ol className="mt-2 flex list-none flex-col gap-1.5">
      {issues.map((issue, i) => (
        <li
          key={i}
          className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-300"
        >
          {issue}
        </li>
      ))}
    </ol>
  );
}

function SeoMetaDetail({ results }: { results: SeoMetaResults }) {
  return (
    <>
      <FactGrid
        facts={[
          { label: "Başlık", value: results.title ?? "Yok" },
          { label: "Canonical", value: results.canonical ? "Var" : "Yok" },
          { label: "Favicon", value: results.hasFavicon ? "Var" : "Yok" },
        ]}
      />
      <IssueList
        issues={[
          ...results.missingCritical.map((m) => `Eksik (kritik): ${m}`),
          ...results.missingRecommended.map((m) => `Eksik (önerilen): ${m}`),
        ]}
      />
    </>
  );
}

function VisualOverflowDetail({ results }: { results: VisualOverflowResults }) {
  if (results.overflows.length === 0) return null;
  return (
    <IssueList
      issues={results.overflows.map((o) => `${o.width}px genişlikte ${o.overflowPx}px yatay taşma var`)}
    />
  );
}

function DeadLinksDetail({ results }: { results: DeadLinksResults }) {
  return (
    <>
      <FactGrid
        facts={[
          { label: "Toplam Link", value: String(results.totalLinks) },
          { label: "Kırık Link", value: String(results.brokenCount) },
        ]}
      />
      <IssueList issues={results.brokenLinks.map((l) => `${l.status || "?"} — ${l.url}`)} />
    </>
  );
}

function FormValidationDetail({ results }: { results: FormValidationResults }) {
  return (
    <>
      <FactGrid facts={[{ label: "Bulunan Form", value: String(results.formsFound) }]} />
      <IssueList issues={results.issues.map((i) => `Form ${i.formIndex + 1}: ${i.issue}`)} />
    </>
  );
}

function InteractionScanDetail({ results }: { results: InteractionScanResults }) {
  return (
    <>
      <FactGrid
        facts={[
          { label: "Etkileşimli Öğe", value: String(results.interactiveElementsFound) },
          { label: "Tıklanan", value: String(results.clickedCount) },
          { label: "Konsol Hatası", value: String(results.consoleErrors.length) },
        ]}
      />
      <IssueList issues={results.consoleErrors} />
    </>
  );
}

function ReportDetail({
  checkType,
  status,
  results,
}: {
  checkType: string;
  status: string;
  results: unknown;
}) {
  if (status === "ERROR") {
    return <p className="mt-1 text-xs text-muted-foreground">{MODULE_ERROR_NOTE}</p>;
  }
  switch (checkType) {
    case "PERFORMANCE":
      return <PerformanceDetail results={results as PerformanceResults} />;
    case "SEO_META":
      return <SeoMetaDetail results={results as SeoMetaResults} />;
    case "VISUAL_OVERFLOW":
      return <VisualOverflowDetail results={results as VisualOverflowResults} />;
    case "DEAD_LINKS":
      return <DeadLinksDetail results={results as DeadLinksResults} />;
    case "FORM_VALIDATION":
      return <FormValidationDetail results={results as FormValidationResults} />;
    case "INTERACTION_SCAN":
      return <InteractionScanDetail results={results as InteractionScanResults} />;
    default:
      return <AccessibilityDetail results={results as AccessibilityResults} />;
  }
}

/**
 * Contract-free verification: any signed-in user (freelancer, client, or
 * someone with no project on this platform at all) pays a fixed fee to run
 * a universal check against a raw URL -- no acceptance_criteria, no
 * counterparty. See 20260908010000_standalone_qa_orders.sql for why this is
 * a separate table/RLS/report pair rather than a retrofit of qa_tier_orders.
 */
export default async function SiteKontrolPage() {
  const orders = await listMyStandaloneOrders();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Site Kontrolü</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sözleşme veya proje gerekmeden, herhangi bir linki test et.
        </p>
      </div>

      <StandaloneCheckForm />

      {orders.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-foreground">Geçmiş taramalar</h2>
          {orders.map((order) => {
            const fallbackCheckType = order.check_type ?? "ACCESSIBILITY";
            // Latest attempt per module: a re-scanned module has its ERROR
            // row on file too, and showing both would read as two verdicts
            // for one check.
            const reports = latestReportPerModule(order.standalone_qa_reports, fallbackCheckType);
            // The free re-scan is offered only while a retry could still
            // change something -- a module that burned through its attempts
            // needs support, not another identical run.
            const attemptsByModule = new Map<string, number>();
            for (const r of order.standalone_qa_reports) {
              const key = r.check_type ?? fallbackCheckType;
              attemptsByModule.set(key, (attemptsByModule.get(key) ?? 0) + 1);
            }
            const rescanableCount = reports.filter(
              (r) =>
                r.status === "ERROR" &&
                (attemptsByModule.get(r.check_type ?? fallbackCheckType) ?? 0) <
                  STANDALONE_MODULE_MAX_ATTEMPTS,
            ).length;
            const isPaid = order.payment_status === "PAID";
            const orderTitle = order.package_id
              ? (PACKAGE_LABEL[order.package_id] ?? order.package_id)
              : (CHECK_TYPE_LABEL[order.check_type ?? ""] ?? order.check_type ?? "Tarama");
            const priceDisplay = (order.fee_kurus / 100).toFixed(0);

            return (
              <div
                key={order.id}
                className="rounded-xl border border-border p-4 dark:border-border/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{order.target_url}</p>
                    <p className="tnum mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{orderTitle}</span>
                      <span aria-hidden>·</span>
                      <span>₺{priceDisplay}</span>
                      <span aria-hidden>·</span>
                      <span>{order.created_at.slice(0, 16).replace("T", " ")}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/r/${order.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Kamuya Açık Rapor ↗
                    </Link>
                    {order.payment_status === "PENDING" ? (
                      <PayStandaloneButton orderId={order.id} />
                    ) : (
                      <span className="text-brand text-xs font-semibold px-1">Ödendi</span>
                    )}
                  </div>
                </div>

                {rescanableCount > 0 && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3.5">
                    <p className="text-xs font-semibold text-foreground">
                      {rescanableCount} modül çalıştırılamadı
                    </p>
                    <p className="mt-1 mb-2.5 text-xs text-muted-foreground">
                      Ödediğin pakette bu kontroller yapılamadı. Ücretsiz olarak tekrar
                      çalıştırabilirsin — yeni ücret alınmaz, günlük tarama hakkından düşmez.
                    </p>
                    <RescanButton orderId={order.id} />
                  </div>
                )}

                {reports.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-3">
                    {reports.map((report) => {
                      const cType = report.check_type ?? order.check_type ?? "ACCESSIBILITY";
                      return (
                        <div
                          key={report.id}
                          className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {CHECK_TYPE_LABEL[cType] ?? cType}
                            </span>
                            <span className={`text-xs font-medium ${STATUS_TONE[report.status] ?? ""}`}>
                              {STATUS_LABEL[report.status] ?? report.status}
                            </span>
                          </div>
                          {isPaid ? (
                            <>
                              <ReportDetail checkType={cType} status={report.status} results={report.results} />
                              <p className="mt-2 font-mono text-[0.65rem] break-all text-muted-foreground">
                                {report.document_sha256}
                              </p>
                            </>
                          ) : (
                            // Only reachable for orders scanned before the
                            // pay-first switch: new orders have no rows until
                            // payment is confirmed.
                            <p className="mt-1 text-xs text-muted-foreground">
                              {report.status === "ERROR" ? MODULE_ERROR_NOTE : summaryLine(cType, report.results)}{" "}
                              Detaylı sonucu ve değiştirilemez kaydı görmek için ödeme yap.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : isPaid ? (
                  // Paid, no rows yet: the order.paid webhook has fired and the
                  // scan is running in the background. Refreshing is the whole
                  // UX -- a package takes minutes.
                  <p className="mt-3 text-xs text-muted-foreground">
                    Tarama sürüyor. Modüller bittikçe burada görünecek, sayfayı birazdan
                    yenile.
                  </p>
                ) : (
                  // Pay-first: an unpaid order has no report rows by design, so
                  // there is nothing to tease here any more.
                  <p className="mt-3 text-xs text-muted-foreground">
                    Ödeme tamamlanınca tarama otomatik başlar.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

