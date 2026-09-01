"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileSignature,
  House,
  Link as LinkIcon,
  LogIn,
  ScanSearch,
  ShieldCheck,
  Tags,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { Mark } from "@/components/brand/mark";
import { HorizontalAccordion } from "@/components/home/horizontal-accordion";
import { FloatingDockDesktop } from "@/components/ui/floating-dock";
import { gsap, useGSAP } from "@/lib/gsap";
import { deliveryStatusLabel, type DeliveryStatus } from "@/lib/qa/delivery-state-machine";
import { QA_TIER_INFO } from "@/lib/validations/delivery";

const BRAND = "Lancerix";

const HASH =
  "9f2c41ab7e0d5386c1b4a9f70e2d8c35b6a147f9e0c283d5a6b7c8d9e0f1a2b3";

/** The real delivery lifecycle, not an escrow one Faz 1 doesn't run. */
const DELIVERY_FLOW: readonly DeliveryStatus[] = [
  "SUBMITTED",
  "QA_QUEUED",
  "QA_DONE",
  "AWAITING_CLIENT",
  "ACCEPTED",
];

const FLOW_TONE: Record<DeliveryStatus, string> = {
  SUBMITTED: "bg-slate-100 text-slate-600",
  QA_QUEUED: "bg-amber-50 text-amber-700",
  QA_DONE: "bg-sky-50 text-sky-700",
  AWAITING_CLIENT: "bg-violet-50 text-violet-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

const STEPS = [
  {
    title: "Sözleşme imzalanır",
    body: "Kabul kriterleri, teslim tarihi ve itiraz süresi metne yazılır. İki taraf da aynı metni imzalar; imza SHA-256 özetiyle kayda geçer.",
    icon: FileSignature,
  },
  {
    title: "Teslim edilir",
    body: "Freelancer bir staging adresi veya PR linki gönderir. Teslim, kabul kriterlerinin karşılanıp karşılanmadığının test edileceği yerdir.",
    icon: LinkIcon,
  },
  {
    title: "Bağımsız QA çalışır",
    body: "Seçilen pakete göre: müşteri kendi kontrol eder, otonom bir ajan tarar, veya kıdemli bir mühendis elden inceler.",
    icon: ScanSearch,
  },
  {
    title: "Zaman damgalı rapor çıkar",
    body: "Sonuç PASS / FAIL / PARTIAL olarak, silinemeyen bir kayda yazılır. Rapor müşterinin karar vermesi için gönderilir.",
    icon: FileCheck2,
  },
  {
    title: "5 günlük pencere kapanır",
    body: "Müşteri süre içinde itiraz etmezse teslim kabul edilmiş sayılır. Ödeme, iki taraf arasında doğrudan gerçekleşir.",
    icon: Clock,
  },
] as const;

const TIERS = ["TIER1", "TIER2", "TIER3"] as const;
const TIER_ICON = {
  TIER1: UserCheck,
  TIER2: ScanSearch,
  TIER3: ShieldCheck,
} as const;

/**
 * A button that leans toward the cursor before it arrives and springs back
 * when it leaves. The transform lives on this wrapping span so the
 * interactive element inside (Link) keeps its own normal hit-box.
 */
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

/** The light-mode glass surface every panel on this page shares. */
function GlassCard({
  className = "",
  children,
  ...rest
}: Readonly<{ className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-xl ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

const DOCK_ITEMS = [
  { title: "Ana sayfa", href: "/", icon: House },
  { title: "Nasıl çalışır", href: "#nasil", icon: ScanSearch },
  { title: "Fiyatlandırma", href: "#fiyat", icon: Tags },
  { title: "Giriş yap", href: "/login", icon: LogIn },
  { title: "Hesap oluştur", href: "/register", icon: UserPlus },
] as const;

export default function HomePage() {
  const root = useRef<HTMLElement>(null);

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
    <main ref={root} className="w-full max-w-full overflow-x-hidden bg-white">
      {/* --- hero ------------------------------------------------------------ */}
      <section className="relative overflow-hidden px-6 pt-28 pb-24 text-center md:pt-36 md:pb-32">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="from-brand/20 absolute -top-32 left-1/4 size-[36rem] rounded-full bg-gradient-to-br to-transparent blur-3xl" />
          <div className="absolute top-1/3 right-1/4 size-[30rem] rounded-full bg-gradient-to-br from-sky-200/40 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <span className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Mark className="text-brand size-4" title={BRAND} />
            {BRAND}
          </span>

          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
            <span className="bg-brand size-1.5 rounded-full" aria-hidden />
            B2B teslim doğrulama · Türkiye
          </span>

          <h1
            className="font-display max-w-2xl font-medium tracking-[-0.01em] text-slate-900"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)", lineHeight: 1.1 }}
          >
            Teslim ettiğini bağımsız birinin
            doğruladığını kanıtla.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
            Freelancer ile kurumsal müşteri arasında imzalı sözleşme, kriterlere
            karşı bağımsız QA doğrulaması ve zaman damgalı, silinemeyen bir kabul
            kaydı. Parayı biz tutmuyoruz — ödeme taraflar arasında doğrudan
            gerçekleşir.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Magnetic>
              <Link
                href="/register"
                className="mac-spring bg-brand text-brand-foreground inline-block rounded-xl px-7 py-3.5 text-base font-medium transition-colors hover:opacity-90 active:scale-[0.98]"
              >
                Hesap oluştur
              </Link>
            </Magnetic>
            <Magnetic>
              <a
                href="#nasil"
                className="mac-spring inline-block rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.98]"
              >
                Nasıl çalışır
              </a>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* --- marquee: the real delivery lifecycle ----------------------------- */}
      <div className="relative border-y border-slate-200 bg-slate-50/60 py-5">
        <div className="flex overflow-hidden">
          <div className="marquee-track flex shrink-0 items-center gap-8 pr-8">
            {[...DELIVERY_FLOW, ...DELIVERY_FLOW].map((s, i) => (
              <span key={`${s}-${i}`} className="mono flex items-center gap-3 text-sm text-slate-500">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${FLOW_TONE[s]}`}>
                  {deliveryStatusLabel(s)}
                </span>
                <span aria-hidden className="text-slate-300">
                  ·
                </span>
              </span>
            ))}
          </div>
          <div className="marquee-track flex shrink-0 items-center gap-8 pr-8" aria-hidden>
            {[...DELIVERY_FLOW, ...DELIVERY_FLOW].map((s, i) => (
              <span key={`dup-${s}-${i}`} className="mono flex items-center gap-3 text-sm text-slate-500">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${FLOW_TONE[s]}`}>
                  {deliveryStatusLabel(s)}
                </span>
                <span aria-hidden className="text-slate-300">
                  ·
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* --- what this is, in one direct paragraph --------------------------- */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <p className="text-2xl leading-relaxed font-medium tracking-tight text-slate-800 md:text-[1.75rem]">
          Lancerix escrow hesabı açmıyor, para toplamıyor, fatura kesmiyor.
          Yaptığımız tek şey: teslim edilen işi sözleşmedeki kriterlere karşı
          bağımsız biçimde test etmek ve sonucu zaman damgalı bir rapora yazmak.
        </p>
      </section>

      {/* --- bento: what you actually get ------------------------------------ */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* big card: a sample report */}
          <GlassCard
            data-bento-card
            className="col-span-1 flex flex-col justify-between p-6 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[0.68rem] tracking-[0.1em] text-slate-400">
                  LX-8FQ2K · QA RAPORU
                </p>
                <p className="mt-1.5 text-base font-medium text-slate-900">
                  Ödeme sayfası — kriter doğrulaması
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" aria-hidden />
                PASS
              </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Paket</dt>
                <dd className="mt-0.5 text-slate-700">Agentic QA</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Kriter</dt>
                <dd className="mt-0.5 text-slate-700">6 / 6 karşılandı</dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mono text-[0.7rem] break-all text-slate-400" data-hash>
                {HASH}
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                Belge özeti · rapor bu haliyle silinemez
              </p>
            </div>
          </GlassCard>

          <GlassCard data-bento-card className="col-span-1 flex flex-col justify-between p-6">
            <Ban className="text-brand size-7" aria-hidden strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-slate-900">Para tutmuyoruz</p>
              <p className="mt-1 text-sm leading-snug text-slate-500">
                Ödeme taraflar arasında doğrudan gerçekleşir. Escrow yok.
              </p>
            </div>
          </GlassCard>

          <GlassCard data-bento-card className="col-span-1 flex flex-col justify-between p-6">
            <ShieldCheck className="text-brand size-7" aria-hidden strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-slate-900">Bağımsız QA</p>
              <p className="mt-1 text-sm leading-snug text-slate-500">
                Sözleşmenin tarafı değiliz, sadece kriterlere karşı test ederiz.
              </p>
            </div>
          </GlassCard>

          <GlassCard
            data-bento-card
            className="col-span-1 flex flex-col justify-center p-6 sm:col-span-2 lg:col-span-2"
          >
            <FileCheck2 className="text-brand mb-3 size-7" aria-hidden strokeWidth={1.75} />
            <p className="text-sm font-semibold text-slate-900">Zaman damgalı, silinemeyen kayıt</p>
            <p className="mt-1 max-w-md text-sm leading-snug text-slate-500">
              Her durum değişikliği kendi satırını yazar. O satır bir daha
              güncellenmez veya silinmez — anlaşmazlıkta ibraz edilen budur.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* --- how it works, five steps ------------------------------------- */}
      <section id="nasil" className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-lg">
            <p className="text-brand mono mb-2 text-xs tracking-[0.14em]">NASIL ÇALIŞIR</p>
            <h2 className="font-display text-3xl font-medium tracking-tight text-slate-900 md:text-4xl">
              Beş adım, tek karar noktası.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-500">
              Her adımın ne yaptığını görmek için üzerine gel.
            </p>
          </div>
          <HorizontalAccordion slices={STEPS} theme="light" />
        </div>
      </section>

      {/* --- pricing: the real tiers ---------------------------------------- */}
      <section id="fiyat" className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-brand mono mb-2 text-xs tracking-[0.14em]">DOĞRULAMA PAKETLERİ</p>
            <h2 className="font-display text-3xl font-medium tracking-tight text-slate-900 md:text-4xl">
              Testi kim yapsın, sen seç.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {TIERS.map((tier) => {
              const info = QA_TIER_INFO[tier];
              const Icon = TIER_ICON[tier];
              // Only ever feature an orderable tier -- a highlighted ring
              // around something the app itself refuses to sell reads as a
              // broken promise, not a recommendation.
              const featured = tier === "TIER2" && info.available;
              return (
                <GlassCard
                  key={tier}
                  className={`relative flex flex-col gap-4 p-6 ${featured ? "border-brand/40 ring-brand/15 ring-2" : ""} ${!info.available ? "opacity-60" : ""}`}
                >
                  {!info.available ? (
                    <span className="absolute top-4 right-4 rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-slate-500 uppercase">
                      Yakında
                    </span>
                  ) : null}
                  <Icon className="text-brand size-6" aria-hidden strokeWidth={1.75} />
                  <div>
                    <p className="text-base font-semibold text-slate-900">{info.label}</p>
                    <p className="mono mt-1 text-sm text-slate-500">{info.price}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500">{info.hint}</p>
                  <ul className="mt-1 flex flex-col gap-1.5 border-t border-slate-100 pt-4">
                    {info.details.map((d) => (
                      <li key={d} className="flex items-start gap-1.5 text-xs text-slate-500">
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
            className="font-display font-medium tracking-[-0.01em] text-slate-900"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.15 }}
          >
            Bir sonraki teslimini kanıtla.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Magnetic>
              <Link
                href="/register"
                className="mac-spring bg-brand text-brand-foreground inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-medium transition-colors hover:opacity-90 active:scale-[0.98]"
              >
                Hesap oluştur
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/login"
                className="mac-spring inline-block rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.98]"
              >
                Giriş yap
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-slate-200 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900">
            <Mark className="text-brand size-4" />
            {BRAND}
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <a href="#nasil" className="hover:text-slate-900">
              Nasıl çalışır
            </a>
            <Link href="/nasil-calisir" className="hover:text-slate-900">
              Sistem şeması
            </Link>
            <Link href="/login" className="hover:text-slate-900">
              Giriş yap
            </Link>
          </div>
          <span className="mono text-xs text-slate-400">
            {new Date().getFullYear()} {BRAND}
          </span>
        </div>
      </footer>

      {/* --- dock: nav, header removed for now -------------------------------- */}
      <div className="fixed inset-x-0 bottom-6 z-50 hidden justify-center px-4 md:flex">
        <FloatingDockDesktop
          className="border border-slate-200 bg-white/80 shadow-lg backdrop-blur-xl"
          items={DOCK_ITEMS.map(({ title, href, icon: Icon }) => ({
            title,
            href,
            icon: <Icon className="h-full w-full text-slate-600" />,
          }))}
        />
      </div>
    </main>
  );
}
