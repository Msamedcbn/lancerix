import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  listPendingQaOrders,
  listPlatformInvoices,
  listQaQueue,
  listRejectedDeliveries,
} from "@/lib/data/admin-qa";
import { stalenessLevel, STALE_AMBER_DAYS, STALE_RED_DAYS } from "@/lib/data/urgency";

export { stalenessLevel, STALE_AMBER_DAYS, STALE_RED_DAYS };

type Client = SupabaseClient<Database>;

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

function settle<T>(dates: T[], pickDate: (row: T) => string): DashboardSection {
  const oldest = dates.reduce<string | null>((min, row) => {
    const d = pickDate(row);
    return min === null || d < min ? d : min;
  }, null);
  return { ok: true, count: dates.length, oldestAt: oldest };
}

async function unclaimedInvitesSection(client: Client): Promise<DashboardSection> {
  const { data, error } = await client
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
 *
 * Takes an optional client so the digest cron (no user session) can pass its
 * createAdminClient() and reuse these exact queries instead of
 * reimplementing them -- see admin-qa.ts's Client type comment.
 */
export async function getDashboardCounts(client?: Client): Promise<DashboardData> {
  const supabase = client ?? (await createClient());

  const [qaQueue, pendingOrders, pendingInvoices, disputes, unclaimedInvites] =
    await Promise.allSettled([
      listQaQueue(supabase).then((rows) => settle(rows, (r) => r.submitted_at)),
      listPendingQaOrders(supabase).then((rows) => settle(rows, (r) => r.created_at)),
      listPlatformInvoices(supabase).then((rows) =>
        settle(
          rows.filter((r) => r.status === "PENDING"),
          (r) => r.issued_at,
        ),
      ),
      listRejectedDeliveries(supabase).then((rows) =>
        settle(rows, (r) => r.decided_at ?? r.submitted_at),
      ),
      unclaimedInvitesSection(supabase),
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
