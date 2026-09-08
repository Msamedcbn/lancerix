/**
 * Locale handling for the public marketing pages only.
 *
 * The dashboard, auth screens and every server action stay Turkish: they are
 * behind a login, their copy is entangled with the escrow/QA domain wording
 * that the contracts themselves use, and translating them would mean
 * translating the legal artefacts too. What a stranger can reach without an
 * account is what gets an English twin.
 *
 * Routing is URL-based rather than cookie-based on purpose. A cookie-switched
 * page has one URL for two languages, so it cannot be shared, cannot be
 * indexed separately, and cannot carry an hreflang pair. Every Turkish page
 * below has an /en counterpart with its own English slug.
 */
export const LOCALES = ["tr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "tr";

/**
 * The public pages, keyed by a stable id, with the URL each locale serves them
 * at. This is the single place a new public page has to be registered: the
 * language switcher, the alternates metadata and the `lang` attribute all read
 * from it.
 */
export const PUBLIC_ROUTES = {
  home: { tr: "/", en: "/en" },
  terms: { tr: "/sartlar", en: "/en/terms" },
  roadmap: { tr: "/yol-haritasi", en: "/en/roadmap" },
  guideDeliveryAcceptance: {
    tr: "/rehber/freelance-teslim-ve-kabul",
    en: "/en/guide/freelance-delivery-and-acceptance",
  },
  guideQaVerification: {
    tr: "/rehber/bagimsiz-qa-dogrulama-nedir",
    en: "/en/guide/independent-qa-verification",
  },
  trustArchitecture: {
    tr: "/guven-mimarisi",
    en: "/en/trust-architecture",
  },
  guideNoCompanyProtection: {
    tr: "/rehber/sirket-kurmadan-freelance-korunma",
    en: "/en/guide/protecting-yourself-as-an-individual-freelancer",
  },
  guideClientNonPayment: {
    tr: "/rehber/musteri-odeme-yapmazsa-ne-yapilir",
    en: "/en/guide/what-to-do-if-a-client-doesnt-pay",
  },
  about: { tr: "/hakkinda", en: "/en/about" },
  contractVerification: {
    tr: "/sozlesmeli-dogrulama",
    en: "/en/contract-verification",
  },
} as const satisfies Record<string, Record<Locale, string>>;

export type PublicRouteId = keyof typeof PUBLIC_ROUTES;

/** The path the same page lives at in the other locale, or null if unknown. */
export function counterpartPath(pathname: string, target: Locale): string | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const route of Object.values(PUBLIC_ROUTES)) {
    if (route.tr === clean || route.en === clean) return route[target];
  }
  return null;
}

/**
 * Which locale a path belongs to. Everything outside /en -- including the
 * dashboard -- is Turkish, which is what makes this safe to call from the root
 * layout for the <html lang> attribute.
 */
export function localeFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "tr";
}

// Full <head> metadata (canonical, hreflang, Open Graph, Twitter Card) is
// built by pageMetadata() in @/lib/seo, not here -- this file stays limited
// to locale/route data with zero "next" Metadata-type or SEO-copy concerns.
