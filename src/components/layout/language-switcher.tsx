"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { counterpartPath, PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";

/**
 * TR/EN toggle for the public pages.
 *
 * It links to the same page in the other language, not to that language's home
 * page: switching language on the roadmap and landing on the landing page is
 * the single most annoying thing a switcher can do. If the current path is not
 * a registered public page (which should not happen, since this only renders
 * inside them), it falls back to that locale's home rather than rendering a
 * dead link.
 */
export function LanguageSwitcher({
  locale,
}: Readonly<{ locale: Locale }>) {
  const pathname = usePathname();
  const target: Locale = locale === "tr" ? "en" : "tr";
  // counterpartPath returns a plain string; every value it can produce is one
  // of the literal paths in PUBLIC_ROUTES, which typedRoutes cannot infer
  // through the lookup.
  const href = (counterpartPath(pathname, target) ??
    PUBLIC_ROUTES.home[target]) as Route;

  return (
    <Link
      href={href}
      hrefLang={target}
      aria-label={target === "en" ? "Switch to English" : "Türkçeye geç"}
      className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {target}
    </Link>
  );
}
