import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * The verified-deliveries count for the landing page counter (Faz E #2).
 *
 * Never lets the fetch fail the page: an anonymous visitor gets a landing page
 * with or without the stat, never a 500. Shared by the Turkish and English
 * landing routes so the two cannot drift on how a failure is handled.
 */
export async function getVerifiedCount(): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_verified_count");
  return error || data == null ? null : Number(data);
}
