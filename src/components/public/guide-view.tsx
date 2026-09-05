import Link from "next/link";
import type { Route } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import type { GuideCopy } from "@/lib/i18n/dictionaries/guide-shared";
import { PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";

/**
 * Shared shell for every content-pillar guide (src/app/rehber/*,
 * src/app/en/guide/*) -- one renderer, so a guide can only visually drift
 * from its siblings by writing different copy, never different markup.
 *
 * `definition` renders as its own block, visually distinct from the
 * surrounding prose, on purpose: it is the one paragraph in the page written
 * to make a complete claim by itself, for a search snippet or an AI answer
 * that lifts a single paragraph out of context.
 *
 * The FAQ uses native <details>/<summary> rather than a client component with
 * click handlers -- no JavaScript required for something a crawler (or a
 * reader with JS disabled) needs to read in full, and the FAQPage JSON-LD
 * below mirrors exactly the questions rendered on the page, never more.
 *
 * `related` links to other pages worth reading next (another guide, the
 * example report) -- not a "browse all guides" index, because there is no
 * index page yet with only two guides in it.
 */
export function GuideView({
  copy,
  locale,
  related,
}: Readonly<{
  copy: GuideCopy;
  locale: Locale;
  related?: readonly { href: Route; label: string }[];
}>) {
  const home = PUBLIC_ROUTES.home[locale];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main className="w-full min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <SiteHeader locale={locale} />

      <article className="flex-1 px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-3xl">
          <p className="mono text-brand text-xs tracking-[0.14em]">{copy.eyebrow}</p>
          <h1 className="font-display mt-3 text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
            {copy.intro}
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-muted/30 px-6 py-5">
            <p className="max-w-[62ch] text-base leading-relaxed text-foreground">
              {copy.definition}
            </p>
          </div>

          <div className="mt-14 flex flex-col gap-12">
            {copy.sections.map((section, index) => (
              <section key={section.heading} className="grid gap-3 md:grid-cols-[3rem_1fr]">
                <span aria-hidden className="mono hidden pt-1 text-xs text-muted-foreground/50 md:block">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {section.heading}
                  </h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="max-w-[65ch] text-base leading-relaxed text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 border-t border-border pt-10">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{copy.faqHeading}</h2>
            <div className="mt-5 flex flex-col gap-2">
              {copy.faq.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-border bg-card px-5 py-4 open:pb-4"
                >
                  <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:content-none">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {related && related.length > 0 ? (
            <div className="mt-10 flex flex-col gap-3">
              {related.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border px-6 py-5 transition-colors hover:bg-muted/40"
                >
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span aria-hidden className="text-brand text-sm font-semibold">
                    →
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-8 text-center">
            <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
              {copy.ctaTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
              {copy.ctaBody}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="bg-brand text-brand-foreground rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 active:scale-[0.98]"
              >
                {copy.ctaPrimary}
              </Link>
              <Link
                href={home}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {copy.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </article>

      <SiteFooter locale={locale} />
    </main>
  );
}
