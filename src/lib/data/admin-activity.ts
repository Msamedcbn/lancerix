import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/lib/supabase/database.types";

/**
 * One shared logger for every admin mutation, instead of six (now seven)
 * ad-hoc inserts. A failure here is caught and console-logged, never
 * surfaced to the caller and never blocks the real mutation -- an
 * audit-trail nice-to-have must never become a single point of failure for
 * real operations (Section 2 decision of the admin operator-toolkit
 * CEO+eng review).
 */
export async function logAdminEvent(
  actorId: string,
  eventType: string,
  targetType: string,
  targetId: string | null,
  detail: Record<string, Json> = {},
): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("admin_activity_log").insert({
      actor_id: actorId,
      event_type: eventType,
      target_type: targetType,
      target_id: targetId,
      detail,
    });
    if (error) throw error;
  } catch (err) {
    console.error("logAdminEvent failed", { actorId, eventType, targetType, targetId, err });
  }
}

export type AdminActivityRow = Tables<"admin_activity_log"> & {
  actor: { full_name: string } | null;
};

/** Every admin mutation, newest first -- reviewer/invoice/report changes, not delivery status. */
export async function listAdminActivity(limit = 100): Promise<AdminActivityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_activity_log")
    .select("*, actor:profiles!admin_activity_log_actor_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AdminActivityRow[];
}
