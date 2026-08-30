import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Machine-to-machine routes are excluded: they authenticate themselves with a
  // signature or a shared secret and have no user session to refresh. Without
  // this the session middleware redirects them to /login, which silently stops
  // the objection-window sweep from ever running.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
