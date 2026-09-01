import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

// /nasil-calisir is marketing, linked from the landing footer. It was missing
// here, so the one page explaining the system asked visitors to log in first.
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/auth",
  "/nasil-calisir",
  "/profile",
];

export async function updateSession(request: NextRequest) {
  // Development-only escape hatch so the app boots before Supabase is wired up.
  // A production build cannot reach this branch: env.ts throws at import time
  // when credentials are missing, so auth can never be silently skipped in prod.
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
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
