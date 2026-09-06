import type { Metadata } from "next";

import { PUBLIC_ROUTES, type Locale, type PublicRouteId } from "@/lib/i18n/config";

const SITE_NAME = "Lancerix";

/**
 * Next's file-convention opengraph-image.tsx only auto-attaches to a
 * segment's `openGraph.images` when that segment does NOT export its own
 * `openGraph` object -- confirmed live: only "/" (the one page with no
 * competing metadata at the time this was written) got the auto-attached
 * image, every nested route lost it the moment it set its own openGraph via
 * pageMetadata(). Since every real page here sets one, the image has to be
 * named explicitly, per locale, or it silently disappears everywhere but
 * the homepage.
 */
const OG_IMAGE_PATH: Record<Locale, string> = {
  tr: "/opengraph-image",
  en: "/en/opengraph-image",
};
const OG_IMAGE_DIMENSIONS = { width: 1200, height: 630 };

/**
 * Open Graph + Twitter Card tags, shared by every page that already has its
 * own title/description: the static public pages via pageMetadata() below,
 * and the dynamic per-user pages (a shared QA report, a public profile) that
 * build their title from real data and call this directly instead.
 *
 * `path`, when given, is relative and resolves against the root layout's
 * metadataBase (see src/app/layout.tsx) -- never hardcode the origin here.
 */
export function socialMetadata({
  title,
  description,
  path,
  locale = "tr",
}: {
  title: string;
  description: string;
  path?: string;
  locale?: Locale;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = { url: OG_IMAGE_PATH[locale], ...OG_IMAGE_DIMENSIONS, alt: SITE_NAME };

  return {
    openGraph: {
      title,
      description,
      ...(path ? { url: path } : {}),
      siteName: SITE_NAME,
      locale: locale === "tr" ? "tr_TR" : "en_US",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

/**
 * Full <head> metadata for one of the static pages registered in
 * PUBLIC_ROUTES -- the one call every marketing page.tsx makes instead of
 * hand-rolling title/description/alternates. Adds two things none of them
 * had before: a self-referencing canonical (still just the hreflang pair
 * for the other locale, not a duplicate-content signal against it), and the
 * Open Graph / Twitter tags from socialMetadata() above.
 */
/**
 * Organization + WebSite JSON-LD for the homepage (both locales) -- the one
 * page that should define "Lancerix" as an entity for an answer engine or
 * Google's knowledge graph to cite, matching this project's own stated GEO
 * stance in robots.ts (no AI-crawler blocklist) and llms.txt.
 *
 * Deliberately has no `sameAs`: the footer's social icons are still
 * placeholder `href="#"` links (no real Twitter/GitHub/LinkedIn account
 * exists yet), and a fabricated sameAs URL would be exactly the kind of
 * invented-traction claim this project has repeatedly caught and removed
 * elsewhere (the roadmap page's fake usage numbers, the old "hakem"
 * positioning). Add it the day those icons point somewhere real.
 *
 * `origin` is passed in rather than read here via appUrl() so this file
 * stays free of the "server-only" import chain that appUrl() pulls in --
 * see the note in pageMetadata() above; only Server Component call sites
 * (the two home page.tsx files) can read appUrl() themselves.
 */
export function organizationJsonLd(origin: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: origin,
        logo: `${origin}/icon`,
        description,
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: origin,
      },
    ],
  };
}

export function pageMetadata({
  id,
  locale,
  title,
  description,
}: {
  id: PublicRouteId;
  locale: Locale;
  title: string;
  description: string;
}): Metadata {
  const path = PUBLIC_ROUTES[id][locale];

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { tr: PUBLIC_ROUTES[id].tr, en: PUBLIC_ROUTES[id].en },
    },
    ...socialMetadata({ title, description, path, locale }),
  };
}
