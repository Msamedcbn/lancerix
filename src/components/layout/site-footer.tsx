import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

import { DEFAULT_LOCALE, PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";
import { SITE_COPY } from "@/lib/i18n/dictionaries/site";

const BRAND = "Lancerix";

export function SiteFooter({
  locale = DEFAULT_LOCALE,
}: Readonly<{ locale?: Locale }>) {
  const currentYear = new Date().getFullYear();
  const t = SITE_COPY[locale].footer;
  const home = PUBLIC_ROUTES.home[locale];

  return (
    <footer className="relative border-t border-border bg-background pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Tagline */}
          <div className="md:col-span-2">
            <Link href={home} className="inline-flex items-center gap-2">
              <Mark className="text-brand size-6" title={BRAND} />
              <span className="font-semibold tracking-tight text-foreground text-lg">{BRAND}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t.tagline}
            </p>
            <div className="mt-6 flex items-center gap-4 text-muted-foreground">
              <a href="#" className="hover:text-brand transition-colors" aria-label="Twitter">
                <Twitter className="size-5" />
              </a>
              <a href="#" className="hover:text-brand transition-colors" aria-label="GitHub">
                <Github className="size-5" />
              </a>
              <a href="#" className="hover:text-brand transition-colors" aria-label="LinkedIn">
                <Linkedin className="size-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.product}</h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <Link href={`${home}#nasil`} className="hover:text-foreground transition-colors">{t.howItWorks}</Link>
              </li>
              <li>
                <Link href={PUBLIC_ROUTES.contractVerification[locale]} className="hover:text-foreground transition-colors">{t.verificationMethods}</Link>
              </li>
              <li>
                <Link href={PUBLIC_ROUTES.guideDeliveryAcceptance[locale]} className="hover:text-foreground transition-colors">{t.guide}</Link>
              </li>
              <li>
                <Link href={PUBLIC_ROUTES.guideQaVerification[locale]} className="hover:text-foreground transition-colors">{t.guideQa}</Link>
              </li>
              <li>
                <Link href={PUBLIC_ROUTES.guideNoCompanyProtection[locale]} className="hover:text-foreground transition-colors">{t.guideNoCompany}</Link>
              </li>
              <li>
                <Link href={PUBLIC_ROUTES.guideClientNonPayment[locale]} className="hover:text-foreground transition-colors">{t.guideClientNonPayment}</Link>
              </li>
              <li>
                <Link href={PUBLIC_ROUTES.trustArchitecture[locale]} className="hover:text-foreground transition-colors">{t.trustArchitecture}</Link>
              </li>
              <li>
                <Link href={PUBLIC_ROUTES.roadmap[locale]} className="hover:text-foreground transition-colors">{t.roadmap}</Link>
              </li>
              <li>
                <Link href={PUBLIC_ROUTES.about[locale]} className="hover:text-foreground transition-colors">{t.about}</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">{t.login}</Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.legal}</h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <Link href={PUBLIC_ROUTES.terms[locale]} className="hover:text-foreground transition-colors">{t.terms}</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.contact}</h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <a href="mailto:hello@lancerix.com" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="size-4" />
                  hello@lancerix.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row text-xs text-muted-foreground">
          <p>© {currentYear} {BRAND}. {t.rights}</p>
          <div className="flex items-center gap-2">
            <span>
              {t.madeIn.before}
              <span className="text-brand">❤</span>
              {t.madeIn.after}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
