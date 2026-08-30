"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * The wordmark lives here as a single edit point. Named 2026-08-30, replacing
 * the "Remotify" working title that collided with remotify.co. lancerix.com is
 * unregistered; TÜRKPATENT registration is still open.
 */
const BRAND = "Lancerix";

const img = (seed: string) =>
  `https://picsum.photos/seed/${seed}/1920/1080`;

const NAV_LINKS = [
  { href: "#nasil", label: "Nasıl çalışır" },
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#deneyimler", label: "Deneyimler" },
] as const;

const MARQUEE = [
  "Yazılım",
  "Tasarım",
  "İçerik",
  "Video",
  "Danışmanlık",
  "Çeviri",
  "Pazarlama",
  "Fotoğraf",
] as const;

const STACK_CARDS = [
  {
    title: "Sözleşme imzalanır",
    body: "Freelancer ve müşteri aynı belgeyi imzalar. Tutar, teslim tarihi ve otomatik serbest bırakma süresi baştan yazılıdır.",
    seed: "contract-signing-desk",
    tone: "from-emerald-500/20",
  },
  {
    title: "Para kilitlenir",
    body: "Müşteri ilk aşamanın tutarını iş başlamadan yatırır. Tutar lisanslı ödeme kuruluşunda tutulur, iki tarafın da erişimi yoktur.",
    seed: "vault-steel-lock",
    tone: "from-sky-500/20",
  },
  {
    title: "İş teslim edilir",
    body: "Freelancer teslimatı yükler. Müşteriye bildirim gider ve geri sayım o an başlar.",
    seed: "delivery-handoff-studio",
    tone: "from-amber-500/20",
  },
  {
    title: "Ödeme otomatik açılır",
    body: "Müşteri belirlenen süre içinde itiraz etmezse ödeme kendiliğinden serbest kalır. Beklemek varsayılan değildir.",
    seed: "sunrise-open-window",
    tone: "from-fuchsia-500/20",
  },
] as const;

const REVEAL_TEXT =
  "Kurumsal müşteriler ödemeyi reddetmiyor. Sadece geciktiriyorlar. Altmış gün, doksan gün, bazen daha fazla. Bu bir güven sorunu değil, bir zamanlama sorunu ve çözümü sözleşmenin içinde yazılı olmalı.";

const TESTIMONIALS = [
  {
    quote:
      "Üç yıldır aynı ajansla çalışıyorum ve her faturada aynı doksan günü bekliyordum. Süreyi sözleşmeye yazmak tek başına her şeyi değiştirdi.",
    name: "Deniz A.",
    role: "Bağımsız arayüz geliştirici",
    seed: "portrait-studio-one",
  },
  {
    quote:
      "Muhasebeyle her ay pazarlık etmeyi bıraktım. Teslim ettim, süre işledi, para geldi. Kimseyi aramam gerekmedi.",
    name: "Ece K.",
    role: "Marka tasarımcısı",
    seed: "portrait-studio-two",
  },
  {
    quote:
      "Stopaj ve e-SMM tarafını elle hesaplamayı bıraktığım gün ayda yarım günümü geri kazandım.",
    name: "Mert S.",
    role: "İçerik stratejisti",
    seed: "portrait-studio-three",
  },
] as const;

export default function HomePage() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      // Hero entrance.
      gsap.from("[data-hero-line]", {
        yPercent: 118,
        duration: 1.15,
        ease: "expo.out",
        stagger: 0.09,
      });
      gsap.from("[data-hero-fade]", {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.45,
      });

      // GSAP paradigm 1 - scrubbing text reveal. Words start near-invisible and
      // resolve sequentially against scroll position rather than on a timer.
      gsap.to("[data-reveal-word]", {
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

      // GSAP paradigm 2 - card stacking. Each card pins in turn and the next
      // rises over it, so the sequence reads as one stack building up.
      const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
      cards.forEach((card, i) => {
        // Each card pins slightly lower than the one before it, so the stack
        // reads as layered edges rather than four cards on the exact same line.
        const pinAt = `top ${12 + i * 3}%`;
        ScrollTrigger.create({
          trigger: card,
          start: pinAt,
          endTrigger: "[data-stack]",
          end: "bottom 80%",
          pin: true,
          pinSpacing: false,
          id: `stack-${i}`,
        });
        gsap.to(card, {
          scale: 1 - (cards.length - 1 - i) * 0.026,
          filter: "brightness(0.62)",
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: pinAt,
            end: "bottom 12%",
            scrub: true,
          },
        });
      });

      // Bento tiles rise and settle as they enter.
      gsap.from("[data-bento-tile]", {
        opacity: 0,
        y: 46,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-bento]", start: "top 78%" },
      });

      // Marquee: two identical tracks translated in lockstep for a seamless loop.
      gsap.to("[data-marquee-track]", {
        xPercent: -100,
        repeat: -1,
        duration: 26,
        ease: "none",
      });
    },
    { scope: root },
  );

  return (
    <main
      ref={root}
      className="w-full max-w-full overflow-x-hidden bg-neutral-950 text-neutral-100"
    >
      {/* Floating glass pill navigation */}
      <header className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <nav className="flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/10 bg-neutral-900/60 px-3 py-2 backdrop-blur-xl">
          <Link
            href="/"
            className="px-3 text-[0.95rem] font-bold tracking-tight text-white"
          >
            {BRAND}
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-colors duration-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/nasil-calisir"
              className="rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-colors duration-300 hover:bg-white/5 hover:text-white"
            >
              Sistem şeması
            </Link>
          </div>
          <Link
            href="/register"
            className="ml-auto rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-neutral-950 transition-transform duration-300 hover:scale-[1.04]"
          >
            Erken erişim
          </Link>
        </nav>
      </header>

      {/* Attention - Cinematic Center hero */}
      <section className="relative flex min-h-[100svh] items-center justify-center px-6 pt-32 pb-24">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-40 contrast-125 grayscale"
          style={{ backgroundImage: `url(${img("istanbul-night-bridge-fog")})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_5%,rgba(10,10,10,0.82)_58%,#0a0a0a_100%)]"
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-1/3 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[140px]"
        />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
          {/* Turkish needs more vertical room than a Latin-only headline: the
              breve on "g", the cedilla on "s" and the dot on "I" all sit outside
              a 0.94 line box. Leading is opened to 1.04 and each reveal mask
              gets padding that a matching negative margin cancels, so glyphs
              clear the overflow clip without loosening the visual rhythm. */}
          <h1
            className="font-black leading-[1.04] tracking-[-0.035em] text-white"
            style={{ fontSize: "clamp(2.75rem, 6.2vw, 5.75rem)" }}
          >
            <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
              <span data-hero-line className="block">
                Emeğinizin karşılığı
              </span>
            </span>
            <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
              <span data-hero-line className="block">
                90 gün beklemesin.
              </span>
            </span>
          </h1>

          <p
            data-hero-fade
            className="mt-8 max-w-2xl text-lg leading-relaxed text-neutral-400 text-pretty"
          >
            Sözleşme imzalandığında para kilitlenir. İş teslim edilir, müşteri
            belirlenen sürede itiraz etmezse ödeme kendiliğinden serbest kalır.
          </p>

          <div data-hero-fade className="mt-11 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-semibold text-neutral-950 transition-transform duration-300 hover:scale-[1.04]"
            >
              Erken erişime katıl
            </Link>
            <a
              href="#nasil"
              className="rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white transition-colors duration-300 hover:bg-white/10"
            >
              Nasıl çalıştığını gör
            </a>
          </div>
        </div>
      </section>

      {/* Infinite marquee */}
      <section className="relative border-y border-white/10 py-10">
        <div className="flex w-max">
          {[0, 1].map((track) => (
            <div
              key={track}
              data-marquee-track
              aria-hidden={track === 1}
              className="flex shrink-0 items-center gap-14 pr-14"
            >
              {MARQUEE.map((word) => (
                <span
                  key={`${track}-${word}`}
                  className="text-3xl font-medium tracking-tight text-neutral-600 md:text-4xl"
                >
                  {word}
                  <span className="ml-14 text-neutral-800">/</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Desire - scrubbing text reveal with an inline typographic image */}
      <section
        data-reveal
        className="mx-auto max-w-5xl px-6 py-32 text-center md:py-48"
      >
        <p className="text-2xl font-medium leading-[1.45] tracking-tight text-white md:text-4xl md:leading-[1.4]">
          {REVEAL_TEXT.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} data-reveal-word className="opacity-[0.12]">
              {word}{" "}
            </span>
          ))}
        </p>
        <p className="mt-14 text-2xl font-medium tracking-tight text-neutral-400 md:text-3xl">
          Biz bunu
          <span
            className="mx-3 inline-block h-9 w-24 rounded-full bg-cover bg-center align-middle md:h-12 md:w-32"
            style={{ backgroundImage: `url(${img("clockwork-brass-macro")})` }}
            aria-hidden
          />
          sözleşmenin içine yazdık.
        </p>
      </section>

      {/* Desire - card stacking */}
      <section id="nasil" data-stack className="px-6 pb-32 md:pb-48">
        <div className="mx-auto max-w-5xl">
          {STACK_CARDS.map((card, i) => (
            <article
              key={card.title}
              data-stack-card
              className="mb-6 origin-top overflow-hidden rounded-3xl border border-white/10 bg-neutral-900"
            >
              <div className="grid gap-0 md:grid-cols-2">
                <div className="flex flex-col justify-center p-9 md:p-14">
                  <span className="text-sm font-semibold text-neutral-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-neutral-400">
                    {card.body}
                  </p>
                </div>
                <div className="group relative min-h-[15rem] overflow-hidden md:min-h-[22rem]">
                  <div
                    className="absolute inset-0 bg-cover bg-center grayscale transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url(${img(card.seed)})` }}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-tr ${card.tone} to-transparent`}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Interest - gapless bento, 6 cols x 3 rows, 18 of 18 units filled */}
      <section id="ozellikler" data-bento className="px-6 py-32 md:py-48">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
            Ödemeyi hızlandıran her parça tek yerde.
          </h2>

          <div className="mt-16 grid auto-rows-[minmax(11rem,auto)] grid-flow-dense grid-cols-2 gap-4 md:grid-cols-6">
            <article
              data-bento-tile
              className="group relative col-span-2 row-span-2 overflow-hidden rounded-3xl border border-white/10 md:col-span-4"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-45 mix-blend-luminosity transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${img("stopwatch-dark-metal")})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-9 md:p-12">
                <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                  Otomatik serbest bırakma
                </h3>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-400">
                  Teslimattan sonra müşteri süresi içinde itiraz etmezse ödeme
                  kendiliğinden açılır. Varsayılan beklemek değil, ödemektir.
                </p>
              </div>
            </article>

            <article
              data-bento-tile
              className="col-span-2 row-span-1 rounded-3xl border border-white/10 bg-neutral-900 p-8 transition-colors duration-500 hover:bg-neutral-800/80"
            >
              <p className="text-5xl font-black tracking-tight text-white">%20</p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                Stopaj otomatik
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Kesinti brütten değil, size kalan tutardan doğru hesaplanır.
              </p>
            </article>

            <article
              data-bento-tile
              className="col-span-2 row-span-1 rounded-3xl border border-white/10 bg-neutral-900 p-8 transition-colors duration-500 hover:bg-neutral-800/80"
            >
              <h3 className="text-lg font-semibold text-white">e-SMM hazır</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Serbest meslek makbuzu ödeme açıldığı anda otomatik düzenlenir.
              </p>
            </article>

            <article
              data-bento-tile
              className="col-span-2 row-span-1 rounded-3xl border border-white/10 bg-neutral-900 p-8 transition-colors duration-500 hover:bg-neutral-800/80"
            >
              <h3 className="text-lg font-semibold text-white">Kilitli bakiye</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Tutar lisanslı ödeme kuruluşunda tutulur. İki tarafın da erişimi
                yoktur.
              </p>
            </article>

            <article
              data-bento-tile
              className="group relative col-span-2 row-span-1 overflow-hidden rounded-3xl border border-white/10 md:col-span-4"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 grayscale transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${img("archive-paper-rows")})` }}
              />
              <div className="relative flex h-full items-center justify-between gap-6 p-8 md:p-10">
                <div>
                  <h3 className="text-xl font-semibold text-white md:text-2xl">
                    Her hareket kayıt altında
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-400">
                    Kim ne zaman onayladı, para ne zaman açıldı. Silinemeyen bir
                    kayıt defterinde tutulur.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Feedback carousel */}
      <section id="deneyimler" className="px-6 py-32 md:py-48">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-12 md:flex-row md:items-center md:gap-16">
            <div className="flex shrink-0 -space-x-5">
              {TESTIMONIALS.map((person, i) => (
                <button
                  key={person.name}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`${person.name} yorumunu göster`}
                  aria-pressed={i === active}
                  className={`h-20 w-20 rounded-full border-4 bg-cover bg-center transition-all duration-500 md:h-24 md:w-24 ${
                    i === active
                      ? "z-10 scale-110 border-white grayscale-0"
                      : "border-neutral-800 grayscale hover:grayscale-0"
                  }`}
                  style={{ backgroundImage: `url(${img(person.seed)})` }}
                />
              ))}
            </div>

            <figure className="min-h-[13rem]">
              <blockquote className="text-2xl font-medium leading-snug tracking-tight text-white text-pretty md:text-3xl">
                {TESTIMONIALS[active]?.quote}
              </blockquote>
              <figcaption className="mt-6 text-sm text-neutral-500">
                <span className="font-semibold text-neutral-300">
                  {TESTIMONIALS[active]?.name}
                </span>
                {" — "}
                {TESTIMONIALS[active]?.role}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Action */}
      <section className="relative overflow-hidden px-6 py-32 md:py-48">
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[32rem] w-[54rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[150px]"
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <h2
            className="font-black leading-[0.95] tracking-[-0.035em] text-white"
            style={{ fontSize: "clamp(2.5rem, 5.6vw, 5rem)" }}
          >
            Bir sonraki işiniz zamanında ödensin.
          </h2>
          <div className="mt-11 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-white px-9 py-4 text-base font-semibold text-neutral-950 transition-transform duration-300 hover:scale-[1.04]"
            >
              Erken erişime katıl
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-9 py-4 text-base font-semibold text-white transition-colors duration-300 hover:bg-white/10"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-lg font-bold tracking-tight text-white">
            {BRAND}
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-neutral-500">
            <a href="#nasil" className="transition-colors hover:text-white">
              Nasıl çalışır
            </a>
            <a href="#ozellikler" className="transition-colors hover:text-white">
              Özellikler
            </a>
            <Link href="/nasil-calisir" className="transition-colors hover:text-white">
              Sistem şeması
            </Link>
            <Link href="/login" className="transition-colors hover:text-white">
              Giriş yap
            </Link>
          </div>
          <span className="text-sm text-neutral-600">
            {new Date().getFullYear()} {BRAND}
          </span>
        </div>
      </footer>
    </main>
  );
}
