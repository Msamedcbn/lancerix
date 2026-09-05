"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileSignature,
  Link as LinkIcon,
  ScanSearch,
  ShieldCheck,
  UserCheck,
  UserCog,
} from "lucide-react";

import { HorizontalAccordion } from "@/components/home/horizontal-accordion";
import { gsap, useGSAP } from "@/lib/gsap";
import { QA_TIER_INFO } from "@/lib/validations/delivery";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { HOME_COPY } from "@/lib/i18n/dictionaries/home";

// Dynamically import WorldMap to avoid SSR issues with canvas/svg if any
const WorldMap = dynamic(() => import("@/components/ui/world-map"), {
  ssr: false,
});

const HASH =
  "9f2c41ab7e0d5386c1b4a9f70e2d8c35b6a147f9e0c283d5a6b7c8d9e0f1a2b3";

/**
 * One icon per step, in step order. The words live in HOME_COPY, which types
 * its steps as a five-tuple, so the two lists cannot fall out of step.
 */
const STEP_ICONS = [FileSignature, LinkIcon, ScanSearch, FileCheck2, Clock] as const;

const TIERS = ["TIER1", "TIER2", "TIER3", "TIER4"] as const;
const TIER_ICON = {
  TIER1: UserCheck,
  TIER2: ScanSearch,
  TIER3: ShieldCheck,
  TIER4: UserCog,
} as const;

function Magnetic({
  children,
  strength = 0.3,
}: Readonly<{ children: ReactNode; strength?: number }>) {
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className="inline-block"
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - rect.left - rect.width / 2) * strength,
          y: (e.clientY - rect.top - rect.height / 2) * strength,
          duration: 0.4,
          ease: "power3.out",
        });
      }}
      onMouseLeave={() => {
        const el = ref.current;
        if (!el) return;
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      }}
    >
      {children}
    </span>
  );
}

function GlassCard({
  className = "",
  children,
  ...rest
}: Readonly<{ className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`glass rounded-2xl p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * verifiedCount is fetched server-side (page.tsx) via a security-definer RPC
 * -- this component itself has no Supabase access, matching every other
 * "use client" page in the app. Below FIRST_SHOW_THRESHOLD it's rendered as
 * null rather than 0: a landing page advertising "0 verified" or a
 * single-digit count reads as evidence nobody uses the product, which is
 * worse than not claiming a number at all while usage is still this early.
 */
const FIRST_SHOW_THRESHOLD = 5;

export function HomeClient({
  verifiedCount,
  locale = DEFAULT_LOCALE,
}: Readonly<{ verifiedCount: number | null; locale?: Locale }>) {
  const root = useRef<HTMLElement>(null);
  const showVerifiedCount = verifiedCount !== null && verifiedCount >= FIRST_SHOW_THRESHOLD;
  const t = HOME_COPY[locale];
  const steps = [
    { ...t.steps[0], icon: STEP_ICONS[0] },
    { ...t.steps[1], icon: STEP_ICONS[1] },
    { ...t.steps[2], icon: STEP_ICONS[2] },
    { ...t.steps[3], icon: STEP_ICONS[3] },
    { ...t.steps[4], icon: STEP_ICONS[4] },
  ];

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const q = gsap.utils.selector(root);

      q("[data-bento-card]").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          delay: i * 0.06,
          ease: "power3.out",
          clearProps: "transform",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      gsap.to("[data-hash]", {
        duration: 1.4,
        ease: "none",
        scrambleText: { text: HASH, chars: "0123456789abcdef", speed: 0.45 },
        scrollTrigger: { trigger: "[data-hash]", start: "top 85%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <main ref={root} className="w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <SiteHeader locale={locale} />

      {/* --- hero with World Map --------------------------------------------- */}
      <section className="relative overflow-hidden px-6 pt-36 pb-12 text-center md:pt-48 md:pb-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="from-brand/10 absolute -top-32 left-1/4 size-[36rem] rounded-full bg-gradient-to-br to-transparent blur-3xl" />
          <div className="absolute top-1/3 right-1/4 size-[30rem] rounded-full bg-gradient-to-br from-brand/5 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center z-10">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border glass px-4 py-1.5 text-xs font-medium text-foreground shadow-sm">
            <span className="bg-brand size-1.5 rounded-full animate-pulse" aria-hidden />
            {t.badge}
          </span>

          <h1
            className="font-display max-w-3xl font-medium tracking-tight text-foreground"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)", lineHeight: 1.1 }}
          >
            {t.heroTitle}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t.heroBody}
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Magnetic>
              <Link
                href="/register"
                className="mac-spring bg-brand text-brand-foreground inline-block rounded-xl px-7 py-3.5 text-base font-medium shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {t.ctaPrimary}
              </Link>
            </Magnetic>
            <Magnetic>
              <a
                href="#nasil"
                className="mac-spring inline-block rounded-xl border border-border bg-background px-7 py-3.5 text-base font-medium text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
              >
                {t.ctaSecondary}
              </a>
            </Magnetic>
          </div>
        </div>

        {/* Aceternity World Map */}
        <div className="relative mx-auto mt-16 max-w-5xl w-full">
          <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-background to-transparent" />
          <WorldMap
            lineColor="oklch(0.55 0.25 260)"
            dots={[
              {
                start: { lat: 39.9255, lng: 32.8662, label: t.cities.ankara },
                end: { lat: 51.5074, lng: -0.1278, label: t.cities.london },
              },
              {
                start: { lat: 39.9255, lng: 32.8662, label: t.cities.ankara },
                end: { lat: 40.7128, lng: -74.006, label: t.cities.newYork },
              },
              {
                start: { lat: 39.9255, lng: 32.8662, label: t.cities.ankara },
                end: { lat: 35.6764, lng: 139.65, label: t.cities.tokyo },
              },
              {
                start: { lat: 39.9255, lng: 32.8662, label: t.cities.ankara },
                end: { lat: -33.8688, lng: 151.2093, label: t.cities.sydney },
              }
            ]}
          />
        </div>
      </section>

      {/* --- what this is, in one direct paragraph --------------------------- */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <p className="text-2xl leading-relaxed font-medium tracking-tight text-foreground md:text-[1.75rem]">
          {t.positioning}
        </p>
      </section>

      {/* --- bento: what you actually get ------------------------------------ */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard
            data-bento-card
            className="col-span-1 flex flex-col justify-between p-6 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[0.68rem] tracking-[0.1em] text-muted-foreground/80">
                  {t.reportCardId}
                </p>
                <p className="mt-1.5 text-base font-medium text-foreground">
                  {t.reportCardTitle}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" aria-hidden />
                {t.reportCardStatus}
              </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground/80">{t.reportTestTypeLabel}</dt>
                <dd className="mt-0.5 text-foreground">{t.reportTestTypeValue}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground/80">{t.reportStateLabel}</dt>
                <dd className="mt-0.5 text-foreground">{t.reportStateValue}</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-border/50 pt-4">
              <p className="mono text-[0.7rem] break-all text-muted-foreground/80" data-hash>
                {HASH}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground/80">
                {t.hashCaption}
              </p>
            </div>
          </GlassCard>

          <GlassCard data-bento-card className="col-span-1 flex flex-col justify-between p-6">
            <Ban className="text-brand size-7" aria-hidden strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-foreground">{t.noMoneyTitle}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {t.noMoneyBody}
              </p>
            </div>
          </GlassCard>

          <GlassCard data-bento-card className="col-span-1 flex flex-col justify-between p-6">
            <ShieldCheck className="text-brand size-7" aria-hidden strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-foreground">{t.impartialTitle}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {t.impartialBody}
              </p>
            </div>
          </GlassCard>

          <GlassCard
            data-bento-card
            className="col-span-1 flex flex-col justify-center p-6 sm:col-span-2 lg:col-span-2"
          >
            <FileCheck2 className="text-brand mb-3 size-7" aria-hidden strokeWidth={1.75} />
            <p className="text-sm font-semibold text-foreground">{t.immutableTitle}</p>
            <p className="mt-1 max-w-md text-sm leading-snug text-muted-foreground">
              {t.immutableBody}
            </p>
          </GlassCard>
        </div>
      </section>

      {/* --- how it works, five steps ------------------------------------- */}
      <section id="nasil" className="px-6 pb-24 md:pb-32 bg-muted/20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-lg">
            <p className="text-brand mono mb-2 text-xs tracking-[0.14em]">{t.stepsEyebrow}</p>
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
              {t.stepsTitle}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground md:hidden">
              {t.stepsBodyMobile}
            </p>
            <p className="mt-3 hidden text-base leading-relaxed text-muted-foreground md:block">
              {t.stepsBody}
            </p>
          </div>
          <HorizontalAccordion slices={steps} theme="light" />
        </div>
      </section>

      {/* --- about us / stats --------------------------------------------- */}
      <section id="hakkimizda" className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-brand mono mb-2 text-xs tracking-[0.14em]">{t.aboutEyebrow}</p>
          <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {t.aboutTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t.aboutBody}
          </p>

          <div className={`mt-12 grid gap-6 sm:grid-cols-2 ${showVerifiedCount ? "lg:grid-cols-3" : ""}`}>
            {showVerifiedCount ? (
              <GlassCard className="flex flex-col items-center justify-center p-8">
                <span className="text-4xl font-extrabold text-brand">{verifiedCount}</span>
                <span className="mt-2 text-sm font-medium text-foreground">{t.statVerified}</span>
              </GlassCard>
            ) : null}
            <GlassCard className="flex flex-col items-center justify-center p-8">
              <span className="text-4xl font-extrabold text-foreground">SHA-256</span>
              <span className="mt-2 text-sm font-medium text-muted-foreground">{t.statSignature}</span>
            </GlassCard>
            <GlassCard className="flex flex-col items-center justify-center p-8">
              <span className="text-4xl font-extrabold text-brand">{t.statWindowValue}</span>
              <span className="mt-2 text-sm font-medium text-foreground">{t.statWindowLabel}</span>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* --- pricing: the real tiers ---------------------------------------- */}
      <section id="fiyat" className="px-6 pb-24 md:pb-32 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-brand mono mb-2 text-xs tracking-[0.14em]">{t.pricingEyebrow}</p>
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
              {t.pricingTitle}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => {
              // Availability stays with QA_TIER_INFO (CLAUDE.md: source of
              // truth); only the words come from the dictionary.
              const info = QA_TIER_INFO[tier];
              const copy = t.tiers[tier];
              const Icon = TIER_ICON[tier];
              const featured = tier === "TIER2" && info.available;
              return (
                <GlassCard
                  key={tier}
                  className={`relative flex flex-col gap-4 p-6 bg-background ${featured ? "border-brand/40 shadow-xl shadow-brand/10 scale-[1.02]" : ""} ${!info.available ? "opacity-60" : ""}`}
                >
                  {!info.available ? (
                    <span className="absolute top-4 right-4 rounded-full bg-muted/80 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                      {t.comingSoon}
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
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- close ------------------------------------------------------------ */}
      <section className="relative overflow-hidden px-6 py-24 text-center md:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="from-brand/15 absolute top-0 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-br to-transparent blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <h2
            className="font-display font-medium tracking-[-0.01em] text-foreground"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.15 }}
          >
            {t.closingTitle}
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Magnetic>
              <Link
                href="/register"
                className="mac-spring bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-medium shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
              >
                {t.closingPrimary}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/login"
                className="mac-spring inline-block rounded-xl border border-border bg-background px-7 py-3.5 text-base font-medium text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
              >
                {t.closingSecondary}
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
