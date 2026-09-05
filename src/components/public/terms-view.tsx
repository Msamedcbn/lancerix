import Link from "next/link";

import { Mark } from "@/components/brand/mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { TERMS_VERSION } from "@/lib/contracts/terms";
import { PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";
import { TERMS_COPY } from "@/lib/i18n/dictionaries/terms";

/**
 * The terms page body, shared by /sartlar and /en/terms. The version number is
 * the same in both languages on purpose: it is what gets stored on a signature
 * row, and an English page showing a different version would be a lie about
 * what was signed.
 */
export function TermsView({ locale }: Readonly<{ locale: Locale }>) {
  const t = TERMS_COPY[locale];

  return (
    <main className="min-h-[100dvh] bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={PUBLIC_ROUTES.home[locale]}
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-600"
          >
            <Mark className="text-brand size-4" />
            Lancerix
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>

        <header className="mt-12 border-b border-slate-200 pb-8">
          <p className="mono text-brand text-xs tracking-[0.14em]">
            {t.versionLabel} {TERMS_VERSION}
          </p>
          <h1 className="font-display mt-3 text-3xl font-medium tracking-tight text-slate-900 md:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-slate-500">
            {t.intro}
          </p>
          {t.authoritativeNotice ? (
            <p className="mt-4 max-w-[62ch] rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
              {t.authoritativeNotice}{" "}
              <Link
                href={PUBLIC_ROUTES.terms.tr}
                className="font-medium text-slate-900 underline underline-offset-2"
              >
                Türkçe metin
              </Link>
            </p>
          ) : null}
        </header>

        <div className="mt-12 flex flex-col gap-12">
          {t.sections.map((section, index) => (
            <section key={section.heading} className="grid gap-4 md:grid-cols-[3rem_1fr]">
              <span
                aria-hidden
                className="mono hidden pt-1 text-xs text-slate-300 md:block"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  {section.heading}
                </h2>
                <div className="mt-3 flex flex-col gap-3">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="max-w-[65ch] text-base leading-relaxed text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-400">{t.footnote(TERMS_VERSION)}</p>
        </footer>
      </div>
    </main>
  );
}
