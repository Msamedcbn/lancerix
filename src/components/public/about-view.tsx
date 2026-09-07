import Link from "next/link";

import { Mark } from "@/components/brand/mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ABOUT_COPY } from "@/lib/i18n/dictionaries/about";
import { PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";

/** The about/founder page body, shared by /hakkinda and /en/about. */
export function AboutView({ locale }: Readonly<{ locale: Locale }>) {
  const t = ABOUT_COPY[locale];

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
          <p className="mono text-brand text-xs tracking-[0.14em]">{t.eyebrow}</p>
          <h1 className="font-display mt-3 text-3xl font-medium tracking-tight text-slate-900 md:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-slate-500">
            {t.intro}
          </p>
        </header>

        <div className="mt-12 grid gap-4 md:grid-cols-[3rem_1fr]">
          <span aria-hidden className="mono hidden pt-1 text-xs text-slate-300 md:block">
            01
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {t.founderName} <span className="font-normal text-slate-400">— {t.founderRole}</span>
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {t.founderBio.map((paragraph) => (
                <p key={paragraph} className="max-w-[65ch] text-base leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">
            {t.contactLabel}{" "}
            <a href="mailto:hello@lancerix.com" className="font-medium text-slate-900 underline underline-offset-2">
              hello@lancerix.com
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
