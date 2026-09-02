import { HomeClient } from "@/app/home-client";
import { createClient } from "@/lib/supabase/server";

/**
 * A server wrapper around the (otherwise fully client-side) landing page,
 * whose only job is fetching the verified-deliveries count for the homepage
 * counter (Faz E #2). Never lets that fetch fail the page: an anonymous
 * visitor gets a landing page with or without the stat, never a 500.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_verified_count");
  const verifiedCount = error || data == null ? null : Number(data);

  return <HomeClient verifiedCount={verifiedCount} />;
}
