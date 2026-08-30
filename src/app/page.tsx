"use client";

import { useRef } from "react";
import Link from "next/link";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import {
  computeEscrowSplit,
  DEFAULT_PLATFORM_FEE_BPS,
  formatKurus,
} from "@/lib/escrow/money";
import { DEFAULT_STOPAJ_BPS } from "@/lib/tax/stopaj";

const BRAND = "Lancerix";

/**
 * The worked example is computed by the same function the ledger uses, so the
 * figures on the marketing page cannot drift from the ones in the product.
 * Ten thousand lira, in kurus.
 */
const SPLIT = computeEscrowSplit({
  grossKurus: 1_000_000,
  platformFeeBps: DEFAULT_PLATFORM_FEE_BPS,
  stopajBps: DEFAULT_STOPAJ_BPS,
});

const NAV = [
  { href: "#nasil", label: "Nasıl çalışır" },
  { href: "#hesap", label: "Rakamlar" },
  { href: "#durum", label: "Neler hazır" },
] as const;

/**
 * The mechanism, in the order it happens. Nothing here describes holding money:
 * every step is something the product does today.
 */
const STEPS = [
  {
    no: "01",
    title: "Sözleşme imzalanır",
    body: "İki taraf aynı metni imzalar. Tutar, aşamalar, stopaj oranı ve itiraz süresi imza anında dondurulur. İmzayla birlikte metnin parmak izi de kayda geçer; şartlar sonradan değişirse bu tutmaz ve değişiklik görünür.",
  },
  {
    no: "02",
    title: "İş aşama aşama teslim edilir",
    body: "Proje tek bir büyük teslim değil, sırayla kapanan aşamalardır. Her aşama kendi başına ilerler; birindeki tıkanma diğerlerini bekletmez.",
  },
  {
    no: "03",
    title: "Geri sayım başlar",
    body: "Teslimatla birlikte müşteriye bildirim gider ve sözleşmede yazan itiraz süresi işlemeye başlar. Süre, tahmine değil imzalanan metne dayanır.",
  },
  {
    no: "04",
    title: "Sessizlik kabul sayılır",
    body: "Müşteri süre içinde itiraz etmezse teslimat sözleşme uyarınca kabul edilmiş sayılır ve kabul, zaman damgasıyla silinemeyen bir deftere yazılır. Beklemek varsayılan değildir.",
  },
] as const;

/** Shipped. Every line here can be opened on a screen today. */
const NOW = [
  {
    title: "İmzalı sözleşme ve belge parmak izi",
    body: "İki taraflı imza; her imza, imzalandığı metnin SHA-256 özetiyle birlikte saklanır.",
  },
  {
    title: "Aşama ve durum akışı",
    body: "Taslaktan ödemeye kadar sekiz durum, ve aralarında yalnızca izin verilen geçişler.",
  },
  {
    title: "İtiraz süresi ve otomatik kabul",
    body: "Süre dolduğunda kabul kendiliğinden gerçekleşir; kim onayladı, kim itiraz etmedi ayrı ayrı görünür.",
  },
  {
    title: "Değiştirilemeyen kayıt defteri",
    body: "Her durum değişikliği aynı işlem içinde bir satır yazar. Satırlar güncellenmez, silinmez.",
  },
  {
    title: "Stopaj ve SMM matrahı",
    body: "Her aşamanın kesintisi ve makbuz matrahı kuruşu kuruşuna hesaplanır, yuvarlamada kayıp olmaz.",
  },
] as const;

/** Not shipped. Labelled as such, on purpose. */
const SOON = [
  {
    title: "Escrow: paranın kilitlenmesi",
    body: "Müşterinin yatırdığı tutarın lisanslı bir ödeme kuruluşunda tutulması. Kurum başvurusu ve entegrasyon sürecinde; bugün para platform üzerinden geçmiyor.",
  },
  {
    title: "e-SMM otomatik düzenleme",
    body: "Makbuzun aşama serbest kaldığı anda otomatik kesilmesi. Matrah bugün hazır, entegrasyon değil.",
  },
  {
    title: "Otomatik ödeme çıkışı",
    body: "Net tutarın freelancerın hesabına otomatik aktarılması. Ödeme altyapısına bağlı.",
  },
] as const;

const REVEAL =
  "Kurumsal müşteriler ödemeyi reddetmiyor. Sadece geciktiriyorlar. Altmış gün, doksan gün, bazen daha fazla. Bu bir güven sorunu değil, bir zamanlama sorunu ve çözümü sözleşmenin içinde yazılı olmalı.";

export default function HomePage() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // The hero entrance is CSS, not GSAP, on purpose. A gsap.from() that
      // never plays leaves its target at opacity 0 -- an invisible hero is a
      // worse failure than an unanimated one, and it is exactly what happened
      // here. A CSS animation that does not run leaves the content visible.

      // The argument resolves as the reader scrolls through it rather than
      // arriving all at once.
      gsap.to("[data-word]", {
        opacity: 1,
        stagger: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-reveal]",
          start: "top 72%",
          end: "bottom 55%",
          scrub: 0.6,
        },
      });

      const cards = gsap.utils.toArray<HTMLElement>("[data-step]");
      cards.forEach((card, i) => {
        const pinAt = `top ${14 + i * 3}%`;
        ScrollTrigger.create({
          trigger: card,
          start: pinAt,
          endTrigger: "[data-steps]",
          end: "bottom 80%",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 1 - (cards.length - 1 - i) * 0.024,
          filter: "brightness(0.66)",
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: pinAt,
            end: "bottom 14%",
            scrub: true,
          },
        });
      });

      gsap.from("[data-tile]", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: "[data-tiles]", start: "top 78%" },
      });
    },
    { scope: root },
  );

  return (
    <main
      ref={root}
      className="w-full max-w-full overflow-x-hidden bg-zinc-950 text-zinc-100"
    >
      <header className="fixed inset-x-0 top-5 z-30 flex justify-center px-4">
        <nav className="flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/10 bg-zinc-900/60 px-3 py-2 backdrop-blur-xl">
          <Link href="/" className="px-3 text-[0.95rem] font-semibold tracking-tight text-white">
            {BRAND}
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {NAV.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/nasil-calisir"
              className="rounded-full px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Şema
            </Link>
          </div>
          <Link
            href="/register"
            className="ml-auto rounded-full bg-white px-4 py-1.5 text-sm font-medium text-zinc-950 hover:bg-zinc-200 active:translate-y-px"
          >
            Başla
          </Link>
        </nav>
      </header>

      {/* Asymmetric hero: text on the left, the image floating off the right
          edge. A centred headline wastes the eye's starting position. */}
      <section className="relative overflow-hidden px-6 pt-40 pb-24 md:pt-52 md:pb-36">
        <div
          aria-hidden
          className="absolute -top-32 -left-40 h-[36rem] w-[36rem] rounded-full bg-emerald-500/10 blur-[150px]"
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="relative z-10 max-w-3xl lg:max-w-[34rem] xl:max-w-3xl">
            <h1
              className="font-semibold leading-[1.06] tracking-[-0.03em] text-white"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}
            >
              <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                <span className="reveal-up block">
                  Teslim ettin. İtiraz gelmedi.
                </span>
              </span>
              <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                <span className="reveal-up block" style={{ "--i": 1 } as React.CSSProperties}>
                  Kabul edilmiş sayılır.
                </span>
              </span>
            </h1>

            <p
              className="reveal mt-8 max-w-xl text-lg leading-relaxed text-zinc-400"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              Sözleşmeye yazılan süre dolduğunda onay kendiliğinden gerçekleşir
              ve zaman damgasıyla kayda geçer. Kurumsal müşteriyi aramak,
              hatırlatmak, beklemek gerekmez.
            </p>

            <div
              className="reveal mt-10 flex flex-wrap gap-3"
              style={{ "--i": 6 } as React.CSSProperties}
            >
              <Link
                href="/register"
                className="rounded-xl bg-white px-7 py-3.5 text-base font-medium text-zinc-950 hover:bg-zinc-200 active:translate-y-px"
              >
                Hesap oluştur
              </Link>
              <a
                href="#nasil"
                className="rounded-xl border border-white/15 px-7 py-3.5 text-base font-medium text-white hover:bg-white/5 active:translate-y-px"
              >
                Nasıl çalıştığını gör
              </a>
            </div>
          </div>

          {/* The product itself rather than a stock photograph. It is built from
              markup, so it cannot fail to load, cannot contradict the product,
              and says something a picture of a desk does not. */}
          <div
            style={{ "--i": 8 } as React.CSSProperties}
            className="reveal relative z-0 mt-12 w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900/80 p-5 backdrop-blur md:ml-auto lg:absolute lg:right-0 lg:bottom-4 lg:mt-0 xl:-right-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">
                  2. Arayüz tasarımı
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  LX-8FQ2K · Vega Dijital A.Ş.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-amber-400">
                <span className="size-1.5 rounded-full bg-amber-400" aria-hidden />
                Teslim edildi
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Sözleşme bedeli</dt>
                <dd className="mt-0.5 text-zinc-200 tabular-nums">
                  {formatKurus(SPLIT.grossKurus)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Eline geçecek</dt>
                <dd className="mt-0.5 font-medium text-emerald-400 tabular-nums">
                  {formatKurus(SPLIT.freelancerNetKurus)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-amber-400">
                3 gün içinde otomatik kabul
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Müşteri itiraz etmezse teslimat kabul edilmiş sayılacak ve kabul
                kayda geçecek.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The strongest fact about the pricing, stated with real figures. */}
      <section id="hesap" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-white md:text-4xl">
                Ücreti sen ödemiyorsun.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">
                Hizmet bedeli senin bedelinden kesilmez, üstüne eklenir ve
                kurumsal müşteri öder. Eline geçen tutar, bu platformu hiç
                kullanmasaydın alacağın tutarın aynısıdır. Tek fark, doksan gün
                önce geçmesi.
              </p>
            </div>

            <dl className="divide-y divide-white/10 rounded-2xl border border-white/10">
              <div className="flex items-baseline justify-between px-6 py-4">
                <dt className="text-sm text-zinc-400">Müşterinin yatırdığı</dt>
                <dd className="text-lg font-medium text-white tabular-nums">
                  {formatKurus(SPLIT.clientChargeKurus)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between px-6 py-4">
                <dt className="text-sm text-zinc-400">
                  Hizmet bedeli (müşteri öder)
                </dt>
                <dd className="text-lg text-zinc-300 tabular-nums">
                  {formatKurus(SPLIT.platformFeeKurus)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between px-6 py-4">
                <dt className="text-sm text-zinc-400">
                  Senin sözleşme bedelin
                </dt>
                <dd className="text-lg text-zinc-300 tabular-nums">
                  {formatKurus(SPLIT.grossKurus)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between px-6 py-4">
                <dt className="text-sm text-zinc-400">
                  Stopaj (kanun gereği, kaynakta)
                </dt>
                <dd className="text-lg text-zinc-300 tabular-nums">
                  {formatKurus(SPLIT.taxWithholdingKurus)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between bg-white/[0.03] px-6 py-5">
                <dt className="text-sm font-medium text-white">
                  Eline geçen
                </dt>
                <dd className="text-2xl font-semibold text-emerald-400 tabular-nums">
                  {formatKurus(SPLIT.freelancerNetKurus)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section data-reveal className="mx-auto max-w-4xl px-6 py-24 md:py-32">
        <p className="text-2xl leading-[1.45] font-medium tracking-tight text-white md:text-3xl md:leading-[1.4]">
          {REVEAL.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} data-word className="opacity-[0.14]">
              {word}{" "}
            </span>
          ))}
        </p>
      </section>

      {/* The mechanism, as a stack that builds up while you read it. */}
      <section id="nasil" data-steps className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-4xl">
          {STEPS.map((step) => (
            <article
              key={step.no}
              data-step
              className="mb-5 origin-top rounded-3xl border border-white/10 bg-zinc-900 p-8 md:p-12"
            >
              <span className="text-sm font-medium text-zinc-500">
                {step.no}
              </span>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {step.title}
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Shipped and not shipped, separated and labelled. Mixing the two is how
          an early product loses the trust it is trying to build. */}
      <section id="durum" data-tiles className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Şimdi çalışıyor
                </h2>
              </div>
              <dl className="divide-y divide-white/10 border-t border-white/10">
                {NOW.map((item) => (
                  <div key={item.title} data-tile className="py-5">
                    <dt className="text-base font-medium text-white">
                      {item.title}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                      {item.body}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <div className="mb-8 flex items-center gap-3">
                <span className="size-2 rounded-full bg-zinc-600" aria-hidden />
                <h2 className="text-xl font-semibold tracking-tight text-zinc-400">
                  Yakında
                </h2>
              </div>
              <dl className="divide-y divide-white/10 border-t border-white/10">
                {SOON.map((item) => (
                  <div key={item.title} data-tile className="py-5">
                    <dt className="text-base font-medium text-zinc-300">
                      {item.title}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                      {item.body}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 max-w-md text-xs leading-relaxed text-zinc-600">
                Bu ayrımı bilerek yapıyoruz. Bugün para platform üzerinden
                geçmiyor; sözleşme, teslim ve kabul süreci geçiyor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-24 md:py-36">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 h-[28rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[150px]"
        />
        <div className="relative mx-auto max-w-3xl">
          <h2
            className="font-semibold leading-[1.1] tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(2rem, 4.4vw, 3.5rem)" }}
          >
            Bir sonraki işin süresi baştan yazılsın.
          </h2>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-white px-7 py-3.5 text-base font-medium text-zinc-950 hover:bg-zinc-200 active:translate-y-px"
            >
              Hesap oluştur
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/15 px-7 py-3.5 text-base font-medium text-white hover:bg-white/5 active:translate-y-px"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-base font-semibold tracking-tight text-white">
            {BRAND}
          </span>
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-zinc-500">
            <a href="#nasil" className="hover:text-white">
              Nasıl çalışır
            </a>
            <a href="#durum" className="hover:text-white">
              Neler hazır
            </a>
            <Link href="/nasil-calisir" className="hover:text-white">
              Sistem şeması
            </Link>
            <Link href="/login" className="hover:text-white">
              Giriş yap
            </Link>
          </div>
          <span className="text-sm text-zinc-600">
            {new Date().getFullYear()} {BRAND}
          </span>
        </div>
      </footer>
    </main>
  );
}
