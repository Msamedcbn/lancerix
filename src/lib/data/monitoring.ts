import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type MonitoringSubscription = Tables<"monitoring_subscriptions">;
export type MonitoredSite = Tables<"monitored_sites">;
export type MonitoringScan = Tables<"monitoring_scans">;

export type MonitoredSiteRow = MonitoredSite & {
  monitoring_scans: Pick<MonitoringScan, "id" | "started_at" | "completed_at" | "notified_at">[];
};

export type MonitoringOverview = {
  subscription: MonitoringSubscription;
  sites: MonitoredSiteRow[];
} | null;

/**
 * The signed-in user's monitoring subscription and the sites under it.
 *
 * RLS (monitoring_subscriptions_select / monitored_sites_select) already scopes
 * both to the subscriber, same as every other reader in src/lib/data -- this
 * only picks the shape the page needs.
 *
 * Returns the newest non-canceled subscription: a customer who cancels and
 * resubscribes has two rows, and the old one's history stays readable without
 * competing to be "the" subscription.
 */
export async function getMyMonitoring(): Promise<MonitoringOverview> {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("monitoring_subscriptions")
    .select("*")
    .neq("status", "CANCELED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!subscription) return null;

  const { data: sites, error: sitesError } = await supabase
    .from("monitored_sites")
    .select("*, monitoring_scans(id, started_at, completed_at, notified_at)")
    .eq("subscription_id", subscription.id)
    .is("removed_at", null)
    .order("created_at", { ascending: true });

  if (sitesError) throw sitesError;

  return { subscription, sites: (sites ?? []) as MonitoredSiteRow[] };
}
