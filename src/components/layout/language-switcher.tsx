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
 *
 * `variant` exists because /nasil-calisir is a dark page with its own chrome
 * and the shared light header styling would be invisible on it.
 */
export function LanguageSwitcher({
  locale,
  variant = "light",
}: Readonly<{ locale: Locale; variant?: "light" | "dark" }>) {
  const pathname = usePathname();
  const target: Locale = locale === "tr" ? "en" : "tr";
  // counterpartPath returns a plain string; every value it can produce is one
  // of the literal paths in PUBLIC_ROUTES, which typedRoutes cannot infer
  // through the lookup.
  const href = (counterpartPath(pathname, target) ??
    PUBLIC_ROUTES.home[target]) as Route;

  const styles =
    variant === "dark"
      ? "border-white/15 text-neutral-400 hover:bg-white/5 hover:text-white"
      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <Link
      href={href}
      hrefLang={target}
      aria-label={target === "en" ? "Switch to English" : "Türkçeye geç"}
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${styles}`}
    >
      {target}
    </Link>
  );
}
