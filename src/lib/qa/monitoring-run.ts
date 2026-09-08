import "server-only";

import { diffScans, hasNews, type ScanChange, type ScanReportLike } from "@/lib/qa/diff";
import { hashResults, runStandaloneCheck } from "@/lib/qa/standalone";
import { notifyMonitoringChange } from "@/lib/notify/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { CADENCE_DAYS, MONITORING_PLANS, type MonitoringPlanId } from "@/lib/validations/monitoring";
import type { StandaloneCheckType } from "@/lib/validations/standalone-qa";

export type MonitoringRunResult = {
  siteId: string;
  scanned: boolean;
  changes: ScanChange[];
  notified: boolean;
};

/**
 * One scheduled scan of one monitored site: run the plan's modules, store the
 * results, compare against the previous scan, and email the subscriber only if
 * something changed.
 *
 * "Only if something changed" is the whole design. A weekly mail that repeats
 * last week's findings gets filtered within a month, and once it is filtered
 * the subscription has no observable value left. Silence is the correct output
 * for a site that did not move.
 */
export async function runMonitoringScan(siteId: string): Promise<MonitoringRunResult> {
  const admin = createAdminClient();

  const { data: site, error: siteError } = await admin
    .from("monitored_sites")
    .select("id, target_url, subscription_id, monitoring_subscriptions(plan_id, status, subscriber_id)")
    .eq("id", siteId)
    .is("removed_at", null)
    .maybeSingle();

  if (siteError || !site) {
    console.error("[FAIL] monitoring scan for unknown site", siteId, siteError?.message);
    return { siteId, scanned: false, changes: [], notified: false };
  }

  const subscription = site.monitoring_subscriptions as unknown as {
    plan_id: MonitoringPlanId;
    status: string;
    subscriber_id: string;
  } | null;

  // The subscription is the authorization to keep scanning this URL. When it
  // ends, the scanning ends with it -- checked here as well as in the
  // scheduler's query, because this function is also callable directly.
  if (!subscription || subscription.status !== "ACTIVE") {
    return { siteId, scanned: false, changes: [], notified: false };
  }

  const plan = MONITORING_PLANS[subscription.plan_id];

  const { data: scan, error: scanError } = await admin
    .from("monitoring_scans")
    .insert({ site_id: site.id })
    .select("id")
    .single();
  if (scanError || !scan) {
    console.error("[FAIL] could not open monitoring scan", scanError?.message);
    return { siteId, scanned: false, changes: [], notified: false };
  }

  const rows = [];
  for (const checkType of plan.modules) {
    const outcome = await runStandaloneCheck(checkType as StandaloneCheckType, site.target_url);
    const results = outcome ? outcome.results : { error: "MODULE_FAILED" };
    rows.push({
      scan_id: scan.id,
      check_type: checkType,
      status: outcome ? outcome.status : "ERROR",
      results,
      document_sha256: outcome ? outcome.documentSha256 : hashResults(results),
    });
  }

  const { error: reportError } = await admin.from("monitoring_scan_reports").insert(rows);
  if (reportError) {
    console.error("[FAIL]", reportError.message);
    return { siteId, scanned: false, changes: [], notified: false };
  }

  const now = new Date().toISOString();
  await admin.from("monitoring_scans").update({ completed_at: now }).eq("id", scan.id);
  await admin.from("monitored_sites").update({ last_scanned_at: now }).eq("id", site.id);

  const previous = await previousScanReports(admin, site.id, scan.id);
  const current: ScanReportLike[] = rows.map((r) => ({
    checkType: r.check_type as StandaloneCheckType,
    status: r.status,
    results: r.results,
  }));
  const changes = previous ? diffScans(previous, current) : [];

  if (!hasNews(changes)) {
    return { siteId, scanned: true, changes: [], notified: false };
  }

  let notified = false;
  try {
    await notifyMonitoringChange({
      toUserId: subscription.subscriber_id,
      targetUrl: site.target_url,
      changes,
    });
    notified = true;
    await admin.from("monitoring_scans").update({ notified_at: now }).eq("id", scan.id);
  } catch (e) {
    // A failed email must not lose the scan: the results are already stored,
    // and notified_at staying null is the record that the customer was not
    // told.
    console.error("[FAIL] monitoring change email", e);
  }

  return { siteId, scanned: true, changes, notified };
}

/** The scan before this one for the same site, or null when this is the first
 * (nothing to compare against, so nothing is news yet). */
async function previousScanReports(
  admin: ReturnType<typeof createAdminClient>,
  siteId: string,
  currentScanId: string,
): Promise<ScanReportLike[] | null> {
  const { data: prior } = await admin
    .from("monitoring_scans")
    .select("id")
    .eq("site_id", siteId)
    .neq("id", currentScanId)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prior) return null;

  const { data: reports } = await admin
    .from("monitoring_scan_reports")
    .select("check_type, status, results")
    .eq("scan_id", prior.id);
  if (!reports) return null;

  return reports.map((r) => ({
    checkType: r.check_type as StandaloneCheckType,
    status: r.status,
    results: r.results,
  }));
}

/**
 * The sites a scheduled run should scan now: active subscriptions only, never
 * scanned or last scanned longer ago than the plan's cadence.
 *
 * Ordered oldest-first so a run that hits its time budget starves nobody --
 * the sites it skipped are the first ones the next run picks up.
 */
export async function dueSiteIds(limit = 20): Promise<string[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("monitored_sites")
    .select("id, last_scanned_at, monitoring_subscriptions!inner(status, cadence)")
    .is("removed_at", null)
    .eq("monitoring_subscriptions.status", "ACTIVE")
    .order("last_scanned_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    console.error("[FAIL] could not list due sites", error.message);
    return [];
  }

  const now = Date.now();
  return (data ?? [])
    .filter((row) => {
      const sub = row.monitoring_subscriptions as unknown as { cadence: keyof typeof CADENCE_DAYS };
      if (!row.last_scanned_at) return true;
      const dueAfterMs = CADENCE_DAYS[sub.cadence] * 24 * 60 * 60 * 1000;
      return now - new Date(row.last_scanned_at).getTime() >= dueAfterMs;
    })
    .map((row) => row.id);
}
