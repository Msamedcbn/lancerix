import type { Metadata } from "next";
import { headers } from "next/headers";

import { getMyMonitoring } from "@/lib/data/monitoring";
import { resolveVisitorCurrency } from "@/lib/i18n/currency-detect";
import { formatMoney, type SupportedCurrency } from "@/lib/validations/currency";
import { MONITORING_PLAN_IDS, MONITORING_PLANS } from "@/lib/validations/monitoring";

import { AddSiteForm, RemoveSiteButton, StartMonitoringButton } from "./monitoring-forms";

export const metadata: Metadata = { title: "Sürekli İzleme" };

const CADENCE_LABEL: Record<string, string> = {
  WEEKLY: "haftalık",
  MONTHLY: "aylık",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  PAST_DUE: "Ödeme bekleniyor",
  CANCELED: "İptal edildi",
};

function priceLabel(minor: number, currency: SupportedCurrency): string {
  return `${formatMoney(minor, currency)}/ay`;
}

/**
 * Continuous monitoring: the same engine as a one-off site check, run on a
 * schedule, with an email only when a result changed since the previous run
 * (src/lib/qa/diff.ts).
 *
 * Nothing here starts a scan directly. The scheduler
 * (api/cron/run-monitoring-scans) owns that, and it only picks up sites whose
 * subscription is ACTIVE -- the subscription is the standing authorization to
 * keep scanning a URL, so it ends when the subscription does.
 */
export default async function IzlemePage() {
  const [overview, defaultCurrency] = await Promise.all([
    getMyMonitoring(),
    headers().then(resolveVisitorCurrency),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Sürekli İzleme</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sitelerin düzenli olarak taranır ve bir önceki taramaya göre{" "}
          <strong className="text-foreground">bir şey değiştiğinde</strong> e-posta alırsın.
          Değişmeyen kontroller için posta gitmez.
        </p>
      </div>

      {!overview ? (
        <div className="grid gap-4 md:grid-cols-2">
          {MONITORING_PLAN_IDS.map((planId) => {
            const plan = MONITORING_PLANS[planId];
            return (
              <div key={planId} className="rounded-xl border border-border p-5">
                <p className="text-sm font-semibold text-foreground">{plan.label}</p>
                <p className="tnum mt-1 text-lg font-semibold text-foreground">
                  {priceLabel(plan.priceMinor[defaultCurrency], defaultCurrency)}
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <li>{plan.siteLimit} siteye kadar</li>
                  <li>{CADENCE_LABEL[plan.cadence]} tam tarama ({plan.modules.length} modül)</li>
                  <li>Değişiklik olduğunda e-posta uyarısı</li>
                  {plan.whiteLabel ? <li>Beyaz etiketli rapor + API erişimi</li> : null}
                </ul>
                <div className="mt-4">
                  <StartMonitoringButton planId={planId} label={`${plan.label} planını başlat`} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {MONITORING_PLANS[overview.subscription.plan_id as "MONITORING" | "AGENCY"].label} planı
                </p>
                <p className="tnum mt-0.5 text-xs text-muted-foreground">
                  {priceLabel(overview.subscription.price_minor, overview.subscription.currency as SupportedCurrency)}{" "}
                  ·{" "}
                  {CADENCE_LABEL[overview.subscription.cadence] ?? overview.subscription.cadence} tarama ·{" "}
                  {overview.sites.length}/{overview.subscription.site_limit} site
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {STATUS_LABEL[overview.subscription.status] ?? overview.subscription.status}
              </span>
            </div>

            {overview.subscription.status !== "ACTIVE" ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Ödeme onaylanana kadar tarama başlamaz. Onay geldiğinde ilk tarama otomatik
                çalışır.
              </p>
            ) : null}
          </div>

          {overview.sites.length < overview.subscription.site_limit ? (
            <div className="rounded-xl border border-border p-4">
              <AddSiteForm subscriptionId={overview.subscription.id} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Plan limitini doldurdun. Yeni site eklemek için bir siteyi kaldırabilirsin.
            </p>
          )}

          {overview.sites.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-foreground">İzlenen siteler</h2>
              {overview.sites.map((site) => {
                const scans = site.monitoring_scans ?? [];
                const notified = scans.filter((s) => s.notified_at).length;
                return (
                  <div key={site.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{site.target_url}</p>
                        <p className="tnum mt-0.5 text-xs text-muted-foreground">
                          {site.last_scanned_at
                            ? `Son tarama: ${site.last_scanned_at.slice(0, 16).replace("T", " ")}`
                            : "Henüz taranmadı"}
                          {" · "}
                          {scans.length} tarama
                          {notified > 0 ? ` · ${notified} değişiklik bildirimi` : ""}
                        </p>
                      </div>
                      <RemoveSiteButton siteId={site.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
