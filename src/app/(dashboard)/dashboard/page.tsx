import { redirect } from "next/navigation";

import { HOME_FOR, requireSession } from "@/lib/auth/session";

/**
 * Kept as the one address the rest of the app can link to without knowing who
 * is signed in. It resolves to whichever area the role belongs in.
 */
export default async function DashboardPage() {
  const { role } = await requireSession();
  redirect(HOME_FOR[role]);
}
