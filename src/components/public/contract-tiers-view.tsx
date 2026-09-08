import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ScanSearch, ShieldCheck, UserCheck } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";
import { CONTRACT_VERIFICATION_COPY } from "@/lib/i18n/dictionaries/contract-verification";
import { HOME_COPY } from "@/lib/i18n/dictionaries/home";
import { QA_TIER_INFO } from "@/lib/validations/delivery";

const TIERS = ["TIER1", "TIER2", "TIER3"] as const;
const TIER_ICON = {
  TIER1: UserCheck,
  TIER2: ScanSearch,
  TIER3: ShieldCheck,
} as const;

/**
 * The contract-bound tiers, on their own page rather than on the landing page.
 *
 * Availability and pricing still come from QA_TIER_INFO (CLAUDE.md: source of
 * truth) and the wording from HOME_COPY.tiers, so moving the section did not
 * fork either. Only the framing around the cards is new, and its job is to
 * make the separation legible: this is a contracted service with a human in
 * it, invoiced directly, not something anyone can buy with a card on this site.
 */
export function ContractTiersView({ locale }: Readonly<{ locale: Locale }>) {
  const t = CONTRACT_VERIFICATION_COPY[locale];
  const tiers = HOME_COPY[locale].tiers;
  const comingSoon = HOME_COPY[locale].comingSoon;
  const home = PUBLIC_ROUTES.home[locale];

  return (
    <>
      <SiteHeader locale={locale} />

      <main className="px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-5xl">
          <p className="text-brand mono mb-2 text-xs tracking-[0.14em]">{t.eyebrow}</p>
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.intro}</p>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TIERS.map((tier) => {
              const info = QA_TIER_INFO[tier];
              const copy = tiers[tier];
              const Icon = TIER_ICON[tier];
              return (
                <div
                  key={tier}
                  className={`relative flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 ${
                    info.available ? "" : "opacity-60"
                  }`}
                >
                  {!info.available ? (
                    <span className="absolute top-4 right-4 rounded-full bg-muted/80 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                      {comingSoon}
                    </span>
                  ) : null}
                  <Icon className="text-brand size-6" aria-hidden strokeWidth={1.75} />
                  <div>
                    <p className="text-base font-semibold text-foreground">{copy.label}</p>
                    <p className="mono mt-1 text-sm text-muted-foreground">{copy.price}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{copy.hint}</p>
                  <ul className="mt-1 flex flex-col gap-1.5 border-t border-border/50 pt-4">
                    {copy.details.map((d) => (
                      <li key={d} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="text-brand mt-0.5 size-3.5 shrink-0" aria-hidden />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="text-sm font-semibold text-foreground">{t.billingTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {t.billingBody}
            </p>
            <a
              href="mailto:hello@lancerix.com"
              className="text-brand mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              <Mail className="size-4" aria-hidden />
              {t.contactLabel}
            </a>
          </div>

          <Link
            href={`${home}#dene`}
            className="mt-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t.backLabel}
          </Link>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}
