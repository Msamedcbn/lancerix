import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { DEFAULT_LOCALE, PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";
import { SITE_COPY } from "@/lib/i18n/dictionaries/site";

const BRAND = "Lancerix";

export function SiteHeader({
  locale = DEFAULT_LOCALE,
}: Readonly<{ locale?: Locale }>) {
  const t = SITE_COPY[locale].nav;
  const home = PUBLIC_ROUTES.home[locale];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href={home} className="flex items-center gap-2">
          <Mark className="text-brand size-5" title={BRAND} />
          <span className="font-semibold tracking-tight text-foreground">{BRAND}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href={`${home}#nasil`} className="hover:text-foreground transition-colors">{t.howItWorks}</Link>
          <Link href={`${home}#fiyat`} className="hover:text-foreground transition-colors">{t.pricing}</Link>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher locale={locale} />
          {/* Auth screens are Turkish-only, so both locales send the visitor to
              the same /login and /register -- see src/lib/i18n/config.ts. */}
          <Link href="/login" className="hidden text-sm font-medium text-foreground hover:opacity-80 md:block transition-opacity">
            {t.login}
          </Link>
          <Link href="/register" className="bg-brand text-brand-foreground rounded-xl px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]">
            {t.register}
          </Link>
        </div>
      </div>
    </header>
  );
}
