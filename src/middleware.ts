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
  //
  // Static verification files dropped straight into public/ (Google Search
  // Console's google<id>.html, and anything else of that shape) need the same
  // exclusion: a crawler has no session either, and a 302 to /login instead of
  // the file's literal contents fails the verification silently.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
