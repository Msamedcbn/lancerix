import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  listPendingQaOrders,
  listPlatformInvoices,
  listQaQueue,
  listRejectedDeliveries,
} from "@/lib/data/admin-qa";

/**
 * One dashboard card's data, or the fact that it failed. Each card is
 * fetched independently (Promise.allSettled below) so a broken query on one
 * card never blacks out the rest of the dashboard -- the moment something is
 * actually wrong is exactly the moment the operator needs the other cards to
 * keep working.
 */
export type DashboardSection =
  | { ok: true; count: number; oldestAt: string | null }
  | { ok: false };

export type DashboardData = {
  qaQueue: DashboardSection;
  pendingOrders: DashboardSection;
  pendingInvoices: DashboardSection;
  disputes: DashboardSection;
  unclaimedInvites: DashboardSection;
};

/** Amber past this many days un-actioned, red past STALE_RED_DAYS. */
export const STALE_AMBER_DAYS = 3;
export const STALE_RED_DAYS = 7;

export function stalenessLevel(oldestAt: string | null): "none" | "amber" | "red" {
  if (!oldestAt) return "none";
  const ageDays = (Date.now() - new Date(oldestAt).getTime()) / 86_400_000;
  if (ageDays >= STALE_RED_DAYS) return "red";
  if (ageDays >= STALE_AMBER_DAYS) return "amber";
  return "none";
}

function settle<T>(dates: T[], pickDate: (row: T) => string): DashboardSection {
  const oldest = dates.reduce<string | null>((min, row) => {
    const d = pickDate(row);
    return min === null || d < min ? d : min;
  }, null);
  return { ok: true, count: dates.length, oldestAt: oldest };
}

async function unclaimedInvitesSection(): Promise<DashboardSection> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("created_at")
    .is("client_id", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return settle(data ?? [], (r) => r.created_at);
}

/**
 * Every card fetched independently. A rejected promise becomes { ok: false }
 * for that card only -- see DashboardSection's own comment for why this
 * matters more here than almost anywhere else in the app.
 */
export async function getDashboardCounts(): Promise<DashboardData> {
  const [qaQueue, pendingOrders, pendingInvoices, disputes, unclaimedInvites] =
    await Promise.allSettled([
      listQaQueue().then((rows) => settle(rows, (r) => r.submitted_at)),
      listPendingQaOrders().then((rows) => settle(rows, (r) => r.created_at)),
      listPlatformInvoices().then((rows) =>
        settle(
          rows.filter((r) => r.status === "PENDING"),
          (r) => r.issued_at,
        ),
      ),
      listRejectedDeliveries().then((rows) =>
        settle(rows, (r) => r.decided_at ?? r.submitted_at),
      ),
      unclaimedInvitesSection(),
    ]);

  const toSection = (r: PromiseSettledResult<DashboardSection>): DashboardSection =>
    r.status === "fulfilled" ? r.value : { ok: false };

  return {
    qaQueue: toSection(qaQueue),
    pendingOrders: toSection(pendingOrders),
    pendingInvoices: toSection(pendingInvoices),
    disputes: toSection(disputes),
    unclaimedInvites: toSection(unclaimedInvites),
  };
}
