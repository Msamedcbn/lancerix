import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

// /sartlar (linked from the signing checkbox and the landing footer) and
// /report (Faz E #1's shareable QA report link) had the same bug: both are
// meant to be readable by someone with no account at all -- a prospective
// signer previewing the terms, or a stranger following a freelancer's
// portfolio link -- and both silently required login before this was fixed.
//
// /yol-haritasi had the same bug again: it is linked from the landing footer
// as "Yol Haritası (Neredeyiz?)" and was never listed here, so a visitor with
// no account was bounced to /login from a marketing link.
//
// /en covers the whole English mirror of these pages in one entry.
//
// /reviewer-report (2026-09-06 four-role audit, Finding 1) is the one route
// where forgetting this listing would be worse than a marketing-page bounce:
// a reviewer has no Lancerix account at all, so redirecting them to /login
// would be a dead end, not just a wrong page.
//
// /hakkinda (founder/about page, linked from the footer) had the same bug on
// first add: any new PUBLIC_ROUTES entry in src/lib/i18n/config.ts needs a
// matching entry here too -- that registry drives the sitemap and hreflang,
// this one drives the auth redirect, and they don't share a source.
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/auth",
  "/en",
  "/profile",
  "/sartlar",
  "/yol-haritasi",
  "/rehber",
  "/report",
  "/reviewer-report",
  "/guven-mimarisi",
  "/hakkinda",
];

/**
 * The current path, forwarded to the app as a request header so the root
 * layout can set <html lang> from it -- there is no other way to read the
 * pathname from a layout, and the marketing pages exist in two languages under
 * one root layout.
 *
 * Rebuilt on every call rather than snapshotted once, because the Supabase
 * cookie handler below mutates request.cookies (and therefore the cookie
 * header) between calls.
 */
function nextWithPathname(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function updateSession(request: NextRequest) {
  // Development-only escape hatch so the app boots before Supabase is wired up.
  // A production build cannot reach this branch: env.ts throws at import time
  // when credentials are missing, so auth can never be silently skipped in prod.
  if (!isSupabaseConfigured) {
    return nextWithPathname(request);
  }

  let response = nextWithPathname(request);

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = nextWithPathname(request);
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refreshes the auth token; must run before any redirect decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
