"use client";

import { useRef } from "react";
import Link from "next/link";

import { gsap, useGSAP } from "@/lib/gsap";
import { DEFAULT_PLATFORM_FEE_BPS, computeEscrowSplit } from "@/lib/escrow/money";
import { DEFAULT_STOPAJ_BPS } from "@/lib/tax/stopaj";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { DEFAULT_LOCALE, PUBLIC_ROUTES, type Locale } from "@/lib/i18n/config";
import {
  SYSTEM_FLOW_COPY,
  type SystemFlowCopy,
} from "@/lib/i18n/dictionaries/system-flow";

const BRAND = "Lancerix";

/**
 * Authored textures rather than stock photography.
 *
 * These panels used to pull from picsum.photos, which was answering 503 and is
 * not something to demo on. A drawn texture also says more about the product
 * than a grayscale desk photo: one is a schematic, the other a stack of records.
 */
const TEXTURE = {
  blueprint:
    "linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px) 0 0 / 34px 34px," +
    "linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px) 0 0 / 34px 34px," +
    "radial-gradient(120% 90% at 70% 10%, rgb(16 185 129 / 0.16), transparent 62%)",
  ledger:
    "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.07) 0 1px, transparent 1px 13px)," +
    "radial-gradient(100% 80% at 20% 0%, rgb(16 185 129 / 0.13), transparent 60%)",
} as const;

/**
 * The worked example is computed by the same function the escrow ledger uses,
 * so the diagram can never drift from the arithmetic that actually runs. A ten
 * thousand lira contract amount, in kurus.
 */
const EXAMPLE_GROSS_KURUS = 1_000_000;

const SPLIT = computeEscrowSplit({
  grossKurus: EXAMPLE_GROSS_KURUS,
  platformFeeBps: DEFAULT_PLATFORM_FEE_BPS,
  stopajBps: DEFAULT_STOPAJ_BPS,
});

/**
 * Grouping and decimal separators follow the reader's locale, not the
 * currency's: 10.000,00 for a Turkish reader, 10,000.00 for an English one.
 * The currency is Turkish lira either way -- only the punctuation moves.
 */
const AMOUNT_FORMATTERS: Record<Locale, Intl.NumberFormat> = {
  tr: new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  en: new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
};

function formatTry(kurus: number, locale: Locale): string {
  return AMOUNT_FORMATTERS[locale].format(kurus / 100);
}

/**
 * Share of what the client actually funds, for bar widths. The three rows below
 * sum to the client charge exactly, so the bars fill the track with no gap.
 */
const share = (kurus: number) => (kurus / SPLIT.clientChargeKurus) * 100;

/**
 * Amounts and colours for the three split rows, in the order the dictionary
 * lists them. The labels and notes come from SYSTEM_FLOW_COPY.splitRows, so a
 * translation cannot reorder or drop one without a type error.
 */
const SPLIT_ROW_META = [
  {
    kurus: SPLIT.platformFeeKurus,
    bar: "bg-neutral-600",
    text: "text-neutral-400",
  },
  {
    kurus: SPLIT.taxWithholdingKurus,
    bar: "bg-amber-500/70",
    text: "text-amber-200/80",
  },
  {
    kurus: SPLIT.freelancerNetKurus,
    bar: "bg-emerald-400",
    text: "text-emerald-200",
  },
] as const;

/* --------------------------------------------------------------------------
 * Step diagrams. Each is a self-contained schematic rather than an icon: the
 * boxes are the actual actors and the arrows are the actual money or document
 * movement described by the card next to it.
 * ------------------------------------------------------------------------ */

const NODE = "fill-neutral-900 stroke-white/15";
const LABEL = "fill-neutral-300 text-[13px] font-medium";
const EDGE = "stroke-neutral-500";

/** Every diagram takes the same shape: the node words plus its own aria label. */
type DiagramProps = Readonly<{ t: SystemFlowCopy }>;

function ContractDiagram({ t }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 170" className="h-full w-full" role="img" aria-label={t.diagramLabels.contract}>
      <g className={EDGE} strokeWidth="1.5" markerEnd="url(#flow-arrow)">
        <path d="M74 58 L134 84" fill="none" />
        <path d="M246 58 L186 84" fill="none" />
        <path d="M160 140 L160 112" fill="none" />
      </g>
      <rect x="132" y="66" width="56" height="46" rx="8" className="fill-emerald-500/10 stroke-emerald-400/50" strokeWidth="1.5" />
      <g className="stroke-emerald-300/70" strokeWidth="1.5" strokeLinecap="round">
        <path d="M144 80 H176" />
        <path d="M144 89 H176" />
        <path d="M144 98 H166" />
      </g>
      <rect x="8" y="26" width="112" height="34" rx="10" className={NODE} strokeWidth="1.5" />
      <text x="64" y="48" textAnchor="middle" className={LABEL}>{t.nodes.freelancer}</text>
      <rect x="200" y="26" width="112" height="34" rx="10" className={NODE} strokeWidth="1.5" />
      <text x="256" y="48" textAnchor="middle" className={LABEL}>{t.nodes.client}</text>
      <rect x="104" y="138" width="112" height="34" rx="10" className={NODE} strokeWidth="1.5" />
      <text x="160" y="160" textAnchor="middle" className={LABEL}>{t.nodes.platform}</text>
    </svg>
  );
}

function LockDiagram({ t }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 170" className="h-full w-full" role="img" aria-label={t.diagramLabels.lock}>
      <rect x="4" y="60" width="94" height="40" rx="10" className={NODE} strokeWidth="1.5" />
      <text x="51" y="85" textAnchor="middle" className={LABEL}>{t.nodes.client}</text>
      <path d="M104 80 H128" className={EDGE} strokeWidth="1.5" markerEnd="url(#flow-arrow)" fill="none" />
      <rect x="134" y="42" width="86" height="76" rx="12" className="fill-neutral-900 stroke-emerald-400/50" strokeWidth="1.5" />
      <path d="M167 74 v-8 a10 10 0 0 1 20 0 v8" className="stroke-emerald-300/80" strokeWidth="2" fill="none" />
      <rect x="163" y="74" width="28" height="22" rx="5" className="fill-emerald-400/20 stroke-emerald-300/80" strokeWidth="1.5" />
      <text x="177" y="136" textAnchor="middle" className="fill-neutral-500 text-[12px]">{t.nodes.lockedBalance}</text>
      <path d="M296 80 H228" className="stroke-neutral-700" strokeWidth="1.5" strokeDasharray="4 5" fill="none" />
      <path d="M254 70 L268 90 M268 70 L254 90" className="stroke-rose-400/70" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="222" y="24" width="94" height="34" rx="10" className={NODE} strokeWidth="1.5" />
      <text x="269" y="46" textAnchor="middle" className={LABEL}>{t.nodes.freelancer}</text>
      <text x="269" y="118" textAnchor="middle" className="fill-neutral-500 text-[12px]">{t.nodes.noAccess}</text>
    </svg>
  );
}

function MilestoneDiagram({ t }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 170" className="h-full w-full" role="img" aria-label={t.diagramLabels.milestone}>
      <path d="M28 88 H292" className="stroke-neutral-800" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 88 H124" className="stroke-emerald-400" strokeWidth="3" strokeLinecap="round" />
      {[28, 124, 220, 292].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy={88}
          r={i === 1 ? 11 : 8}
          className={i <= 1 ? "fill-emerald-400 stroke-neutral-950" : "fill-neutral-800 stroke-neutral-700"}
          strokeWidth="2"
        />
      ))}
      <text x="28" y="66" textAnchor="middle" className="fill-neutral-400 text-[12px]">{t.nodes.phase} 1</text>
      <text x="124" y="66" textAnchor="middle" className="fill-emerald-200 text-[12px] font-semibold">{t.nodes.phase} 2</text>
      <text x="220" y="66" textAnchor="middle" className="fill-neutral-500 text-[12px]">{t.nodes.phase} 3</text>
      <text x="286" y="66" textAnchor="middle" className="fill-neutral-500 text-[12px]">{t.nodes.delivery}</text>
      <text x="76" y="120" textAnchor="middle" className="fill-neutral-500 text-[12px]">{t.nodes.paid}</text>
      <text x="172" y="120" textAnchor="middle" className="fill-neutral-500 text-[12px]">{t.nodes.locked}</text>
      <text x="256" y="120" textAnchor="middle" className="fill-neutral-600 text-[12px]">{t.nodes.pending}</text>
    </svg>
  );
}

function CountdownDiagram({ t }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 170" className="h-full w-full" role="img" aria-label={t.diagramLabels.countdown}>
      <rect x="4" y="64" width="96" height="40" rx="10" className={NODE} strokeWidth="1.5" />
      <text x="52" y="89" textAnchor="middle" className={LABEL}>{t.nodes.submitted}</text>
      <path d="M106 84 H136" className={EDGE} strokeWidth="1.5" markerEnd="url(#flow-arrow)" fill="none" />
      <circle cx="176" cy="84" r="32" className="fill-none stroke-neutral-800" strokeWidth="5" />
      <path
        d="M176 52 a32 32 0 0 1 26.4 50.1"
        className="fill-none stroke-amber-400"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M176 68 v18 h13" className="fill-none stroke-neutral-300" strokeWidth="2" strokeLinecap="round" />
      <path d="M216 84 H244" className={EDGE} strokeWidth="1.5" markerEnd="url(#flow-arrow)" fill="none" />
      <rect x="250" y="64" width="66" height="40" rx="10" className="fill-emerald-500/10 stroke-emerald-400/50" strokeWidth="1.5" />
      <text x="283" y="89" textAnchor="middle" className="fill-emerald-200 text-[13px] font-medium">{t.nodes.approved}</text>
      <text x="176" y="140" textAnchor="middle" className="fill-neutral-500 text-[12px]">{t.nodes.objectionWindow}</text>
    </svg>
  );
}

function SplitDiagram({ t }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 170" className="h-full w-full" role="img" aria-label={t.diagramLabels.split}>
      <rect x="4" y="64" width="86" height="40" rx="10" className="fill-neutral-900 stroke-emerald-400/50" strokeWidth="1.5" />
      <text x="47" y="89" textAnchor="middle" className="fill-emerald-200 text-[13px] font-medium">{t.nodes.released}</text>
      <g className={EDGE} strokeWidth="1.5" fill="none" markerEnd="url(#flow-arrow)">
        <path d="M96 84 C 130 84, 130 30, 168 30" />
        <path d="M96 84 H168" />
        <path d="M96 84 C 130 84, 130 138, 168 138" />
      </g>
      <rect x="174" y="12" width="142" height="34" rx="9" className={NODE} strokeWidth="1.5" />
      <text x="245" y="34" textAnchor="middle" className="fill-neutral-400 text-[12px]">{t.nodes.serviceFee}</text>
      <rect x="174" y="67" width="142" height="34" rx="9" className={NODE} strokeWidth="1.5" />
      <text x="245" y="89" textAnchor="middle" className="fill-amber-200/80 text-[12px]">{t.nodes.withholding}</text>
      <rect x="174" y="121" width="142" height="34" rx="9" className="fill-emerald-500/10 stroke-emerald-400/40" strokeWidth="1.5" />
      <text x="245" y="143" textAnchor="middle" className="fill-emerald-200 text-[12px]">{t.nodes.freelancerNet}</text>
    </svg>
  );
}

/**
 * Step number, the state-machine edge it corresponds to, and its diagram. The
 * edge strings are the literal transition identifiers from TRANSITIONS in
 * src/lib/escrow/state-machine.ts, so they are the same in every language --
 * only the title and body next to them are translated.
 */
const FLOW_STEP_META = [
  { step: "01", edge: "DRAFT -> AWAITING_PAYMENT", Diagram: ContractDiagram },
  { step: "02", edge: "AWAITING_PAYMENT -> IN_PROGRESS", Diagram: LockDiagram },
  { step: "03", edge: "IN_PROGRESS", Diagram: MilestoneDiagram },
  { step: "04", edge: "SUBMITTED -> COMPLETED", Diagram: CountdownDiagram },
  { step: "05", edge: "COMPLETED -> RELEASED", Diagram: SplitDiagram },
] as const;

/* --------------------------------------------------------------------------
 * State graph. Nodes and edges mirror TRANSITIONS in
 * src/lib/escrow/state-machine.ts one for one -- if an edge is added there it
 * has to be added here too, same as the Postgres table.
 * ------------------------------------------------------------------------ */

const NODE_W = 168;
const NODE_H = 56;

type GraphNode = { id: string; x: number; y: number; tone: "main" | "warn" | "stop" };

const GRAPH_NODES: readonly GraphNode[] = [
  { id: "DRAFT", x: 10, y: 40, tone: "main" },
  { id: "AWAITING_PAYMENT", x: 208, y: 40, tone: "main" },
  { id: "IN_PROGRESS", x: 406, y: 40, tone: "main" },
  { id: "SUBMITTED", x: 604, y: 40, tone: "main" },
  { id: "COMPLETED", x: 802, y: 40, tone: "main" },
  { id: "RELEASED", x: 1000, y: 40, tone: "main" },
  { id: "DISPUTED", x: 604, y: 250, tone: "warn" },
  { id: "CANCELLED", x: 208, y: 370, tone: "stop" },
];

type GraphEdge = { d: string; tone: "main" | "warn" | "stop" };

const GRAPH_EDGES: readonly GraphEdge[] = [
  // Happy path, left to right.
  { d: "M178 68 H208", tone: "main" },
  { d: "M376 68 H406", tone: "main" },
  { d: "M574 68 H604", tone: "main" },
  { d: "M772 68 H802", tone: "main" },
  { d: "M970 68 H1000", tone: "main" },
  // Revision: SUBMITTED back to IN_PROGRESS, arcing over the row.
  { d: "M688 40 C 688 -18, 490 -18, 490 40", tone: "main" },
  // Anything funded can be disputed.
  { d: "M490 96 C 490 200, 640 172, 640 250", tone: "warn" },
  { d: "M688 96 V250", tone: "warn" },
  { d: "M886 96 C 886 200, 736 172, 736 250", tone: "warn" },
  // A dispute ends in release or cancellation, never in place.
  { d: "M772 278 C 950 278, 1084 220, 1084 96", tone: "warn" },
  { d: "M604 278 C 480 278, 376 340, 376 398", tone: "stop" },
  // Cancellation is open until the work is submitted.
  { d: "M94 96 V398 H208", tone: "stop" },
  { d: "M292 96 V370", tone: "stop" },
  { d: "M490 96 C 490 310, 340 300, 340 370", tone: "stop" },
];

const NODE_TONE = {
  main: "fill-neutral-900 stroke-white/20",
  warn: "fill-amber-500/10 stroke-amber-400/45",
  stop: "fill-rose-500/10 stroke-rose-400/40",
} as const;

const NODE_TEXT_TONE = {
  main: "fill-neutral-200",
  warn: "fill-amber-100",
  stop: "fill-rose-100",
} as const;

const EDGE_TONE = {
  main: "stroke-neutral-500",
  warn: "stroke-amber-400/60",
  stop: "stroke-rose-400/50",
} as const;

const MARKER_BY_TONE = {
  main: "url(#graph-arrow)",
  warn: "url(#graph-arrow-warn)",
  stop: "url(#graph-arrow-stop)",
} as const;

export function SystemFlow({
  locale = DEFAULT_LOCALE,
}: Readonly<{ locale?: Locale }>) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const t = SYSTEM_FLOW_COPY[locale];

  // Diagram and edge on one side, words on the other, zipped position by
  // position. Both sides are fixed-length tuples, so a missing translation is
  // a type error rather than a blank card.
  const flowSteps = [
    { ...FLOW_STEP_META[0], ...t.steps[0] },
    { ...FLOW_STEP_META[1], ...t.steps[1] },
    { ...FLOW_STEP_META[2], ...t.steps[2] },
    { ...FLOW_STEP_META[3], ...t.steps[3] },
    { ...FLOW_STEP_META[4], ...t.steps[4] },
  ];

  const splitRows = [
    { ...SPLIT_ROW_META[0], ...t.splitRows[0] },
    { ...SPLIT_ROW_META[1], ...t.splitRows[1] },
    { ...SPLIT_ROW_META[2], ...t.splitRows[2] },
  ];

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Hero entrance.
      gsap.from("[data-hero-line]", {
        yPercent: 118,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.09,
      });
      gsap.from("[data-hero-fade]", {
        opacity: 0,
        y: 22,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.4,
      });

      // Paradigm 1 - pinned horizontal scrub. The section holds still while the
      // card track slides sideways, so the five steps read as one continuous
      // diagram instead of five separate scroll stops. Below md the track falls
      // back to native horizontal scrolling with snap, where a pin would fight
      // the touch gesture.
      const el = track.current;
      if (el && window.matchMedia("(min-width: 768px)").matches) {
        // Recomputed on every refresh so a resize or a late font swap cannot
        // leave the track ending short of, or past, its last card.
        const distance = () => Math.max(0, el.scrollWidth - window.innerWidth + 96);

        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: "[data-track-section]",
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.55,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      }

      // Paradigm 2 - scrubbed bars and counters. Each row grows from its left
      // edge while the figure above it counts up against scroll position.
      gsap.utils.toArray<HTMLElement>("[data-bar]").forEach((bar, i) => {
        gsap.from(bar, {
          scaleX: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "[data-split]",
            start: `top ${70 - i * 4}%`,
            end: "center 45%",
            scrub: 0.6,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((node) => {
        const target = Number(node.dataset.count ?? 0);
        const proxy = { value: 0 };
        gsap.to(proxy, {
          value: target,
          ease: "none",
          onUpdate: () => {
            node.textContent = formatTry(Math.round(proxy.value), locale);
          },
          scrollTrigger: {
            trigger: "[data-split]",
            start: "top 72%",
            end: "center 45%",
            scrub: 0.6,
          },
        });
      });

      // State graph: edges draw themselves in as the diagram enters, so the
      // reader follows the direction of each transition rather than meeting a
      // finished tangle of lines.
      gsap.utils.toArray<SVGPathElement>("[data-graph-edge]").forEach((path, i) => {
        const length = path.getTotalLength();
        gsap.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length, opacity: 0 },
          {
            strokeDashoffset: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power2.out",
            delay: i * 0.055,
            scrollTrigger: { trigger: "[data-graph]", start: "top 72%" },
          },
        );
      });

      gsap.from("[data-graph-node]", {
        opacity: 0,
        scale: 0.9,
        transformOrigin: "center",
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: { trigger: "[data-graph]", start: "top 72%" },
      });

      gsap.from("[data-bento-tile]", {
        opacity: 0,
        y: 44,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-bento]", start: "top 78%" },
      });

    },
    { scope: root, dependencies: [locale] },
  );

  return (
    <main
      ref={root}
      className="w-full max-w-full overflow-x-hidden bg-neutral-950 text-neutral-100"
    >
      {/* Shared arrowhead definitions for every schematic on the page. */}
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-neutral-500" />
          </marker>
          <marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-neutral-500" />
          </marker>
          <marker id="graph-arrow-warn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-amber-400/70" />
          </marker>
          <marker id="graph-arrow-stop" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-rose-400/60" />
          </marker>
        </defs>
      </svg>

      <header className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <nav className="flex w-full max-w-3xl items-center gap-2 rounded-full border border-white/10 bg-neutral-900/60 px-3 py-2 backdrop-blur-xl">
          <Link href={PUBLIC_ROUTES.home[locale]} className="px-3 text-[0.95rem] font-bold tracking-tight text-white">
            {BRAND}
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <a href="#akis" className="rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-colors duration-300 hover:bg-white/5 hover:text-white">
              {t.nav.flow}
            </a>
            <a href="#dagilim" className="rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-colors duration-300 hover:bg-white/5 hover:text-white">
              {t.nav.split}
            </a>
            <a href="#durumlar" className="rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-colors duration-300 hover:bg-white/5 hover:text-white">
              {t.nav.states}
            </a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher locale={locale} variant="dark" />
            <Link
              href="/register"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-neutral-950 transition-transform duration-300 hover:scale-[1.04]"
            >
              {t.nav.earlyAccess}
            </Link>
          </div>
        </nav>
      </header>

      {/* Attention - artistic asymmetry: text left, image floating in from the
          bottom right and sliding under the headline. */}
      <section className="relative overflow-hidden px-6 pt-40 pb-28 md:pt-52 md:pb-40">
        <div
          aria-hidden
          className="absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-emerald-500/10 blur-[150px]"
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="relative z-10 max-w-5xl">
            <h1
              className="font-black leading-[1.06] tracking-[-0.035em] text-white"
              style={{ fontSize: "clamp(2.6rem, 5.4vw, 5rem)" }}
            >
              <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                <span data-hero-line className="block">
                  {t.heroLine1}
                </span>
              </span>
              <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                <span data-hero-line className="block">
                  {t.heroLine2}
                </span>
              </span>
            </h1>
            <p
              data-hero-fade
              className="mt-8 max-w-xl text-lg leading-relaxed text-neutral-400 text-pretty"
            >
              {t.heroBody}
            </p>
            <div data-hero-fade className="mt-10 flex flex-wrap gap-3">
              <a
                href="#akis"
                className="rounded-full bg-white px-8 py-4 text-base font-semibold text-neutral-950 transition-transform duration-300 hover:scale-[1.04]"
              >
                {t.heroPrimary}
              </a>
              <Link
                href="/register"
                className="rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white transition-colors duration-300 hover:bg-white/10"
              >
                {t.heroSecondary}
              </Link>
            </div>
          </div>

          <div
            data-hero-fade
            className="group pointer-events-none relative z-0 mt-16 ml-auto h-64 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 md:absolute md:-right-6 md:bottom-[-3rem] md:mt-0 md:h-[22rem] md:w-[26rem]"
          >
            <div
              className="absolute inset-0 opacity-90"
              style={{ background: TEXTURE.blueprint }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Status banner: this whole page is Lancerix's target architecture
          (escrow, stopaj withholding, automatic payout split) -- only the
          delivery/QA/objection-window step below is actually live today.
          One clear statement here, rather than scattering caveats through
          five step bodies and a worked money-split example that would
          otherwise all read as present-tense fact. */}
      <section className="px-6 pb-4">
        <div className="mx-auto max-w-6xl rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] px-6 py-5">
          <p className="text-sm leading-relaxed text-amber-100/90">
            <strong className="font-semibold text-amber-200">
              {t.bannerStrong}
            </strong>{" "}
            {t.bannerBody}
          </p>
        </div>
      </section>

      {/* Desire - pinned horizontal card track */}
      <section
        id="akis"
        data-track-section
        className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-24 md:py-0"
      >
        <div className="mx-auto mb-10 w-full max-w-6xl px-6 md:mb-14">
          <h2 className="max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl">
            {t.flowTitle}
          </h2>
        </div>

        <div className="w-full overflow-x-auto pb-4 [scrollbar-width:none] md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
          <div
            ref={track}
            className="flex w-max snap-x snap-mandatory gap-6 px-6 md:snap-none md:px-12"
          >
            {flowSteps.map(({ step, edge, Diagram, title, body }) => (
              <article
                key={step}
                className="group flex w-[82vw] max-w-[26rem] shrink-0 snap-center flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 sm:w-[22rem] md:w-[24rem]"
              >
                <div className="h-52 border-b border-white/10 bg-neutral-950/60 p-5 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                  <Diagram t={t} />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold text-neutral-500">{step}</span>
                    <code className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[0.68rem] tracking-tight text-neutral-400">
                      {edge}
                    </code>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">{title}</h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-neutral-400">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Desire - scrubbed money split */}
      <section id="dagilim" data-split className="px-6 py-32 md:py-48">
        <div className="mx-auto max-w-5xl">
          <h2 className="max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl">
            {t.splitTitle}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-400">
            {t.splitBody}
          </p>

          <div className="mt-14 rounded-3xl border border-white/10 bg-neutral-900 p-7 md:p-12">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/10 pb-7">
              <span className="text-sm font-semibold text-neutral-400">
                {t.splitFundedLabel}
              </span>
              <span className="text-3xl font-black tracking-tight text-white md:text-4xl">
                {formatTry(SPLIT.clientChargeKurus, locale)}
                <span className="ml-2 text-lg font-semibold text-neutral-500">TL</span>
              </span>
            </div>

            <div className="mt-9 space-y-9">
              {splitRows.map((row) => (
                <div key={row.label}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-base font-semibold text-white">{row.label}</span>
                    <span className={`text-2xl font-bold tracking-tight ${row.text}`}>
                      <span data-count={row.kurus}>{formatTry(0, locale)}</span>
                      <span className="ml-1.5 text-sm font-semibold text-neutral-500">TL</span>
                    </span>
                  </div>
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      data-bar
                      className={`h-full origin-left rounded-full ${row.bar}`}
                      style={{ width: `${share(row.kurus)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">{row.note}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 border-t border-white/10 pt-7 text-sm leading-relaxed text-neutral-500">
              {t.splitFootnote(formatTry(SPLIT.grossKurus, locale))}
            </p>
          </div>
        </div>
      </section>

      {/* Interest - state graph */}
      <section id="durumlar" data-graph className="px-6 py-32 md:py-48">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl">
            {t.statesTitle}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-400">
            {t.statesBody}
          </p>

          <div className="mt-14 overflow-x-auto rounded-3xl border border-white/10 bg-neutral-900 p-5 md:p-10 [scrollbar-width:thin]">
            <svg
              viewBox="0 -30 1180 490"
              className="h-auto w-full min-w-[52rem]"
              role="img"
              aria-label={t.diagramLabels.graph}
            >
              {GRAPH_EDGES.map((edge) => (
                <path
                  key={edge.d}
                  data-graph-edge
                  d={edge.d}
                  fill="none"
                  strokeWidth="1.75"
                  markerEnd={MARKER_BY_TONE[edge.tone]}
                  className={EDGE_TONE[edge.tone]}
                />
              ))}
              {GRAPH_NODES.map((node) => (
                <g key={node.id} data-graph-node>
                  <rect
                    x={node.x}
                    y={node.y}
                    width={NODE_W}
                    height={NODE_H}
                    rx="14"
                    strokeWidth="1.5"
                    className={NODE_TONE[node.tone]}
                  />
                  <text
                    x={node.x + NODE_W / 2}
                    y={node.y + NODE_H / 2 + 5}
                    textAnchor="middle"
                    className={`${NODE_TEXT_TONE[node.tone]} font-mono text-[14px]`}
                  >
                    {node.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-6 rounded-full bg-neutral-500" /> {t.legendNormal}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-6 rounded-full bg-amber-400/70" /> {t.legendDispute}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-6 rounded-full bg-rose-400/60" /> {t.legendCancel}
            </span>
          </div>
        </div>
      </section>

      {/* Interest - gapless bento: 6 cols x 2 rows, 12 of 12 units filled */}
      <section data-bento className="px-6 pb-32 md:pb-48">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl">
            {t.rulesTitle}
          </h2>

          {/* 6 cols x 3 rows = 18 units: 8 + 2 + 2 + 6. No cell is left empty. */}
          <div className="mt-14 grid auto-rows-[minmax(11rem,auto)] grid-flow-dense grid-cols-2 gap-4 md:grid-cols-6">
            <article
              data-bento-tile
              className="group relative col-span-2 row-span-2 overflow-hidden rounded-3xl border border-white/10 md:col-span-4"
            >
              <div
                className="absolute inset-0 opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ background: TEXTURE.ledger }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-9 md:p-12">
                <h3 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {t.ledgerTitle}
                </h3>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-400">
                  {t.ledgerBody}
                </p>
              </div>
            </article>

            <article
              data-bento-tile
              className="col-span-2 rounded-3xl border border-white/10 bg-neutral-900 p-8 transition-colors duration-500 hover:bg-neutral-800/80"
            >
              <h3 className="text-lg font-semibold text-white">{t.webhookTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {t.webhookBody}
              </p>
            </article>

            <article
              data-bento-tile
              className="col-span-2 rounded-3xl border border-white/10 bg-neutral-900 p-8 transition-colors duration-500 hover:bg-neutral-800/80"
            >
              <p className="text-4xl font-black tracking-tight text-white">
                {formatTry(SPLIT.freelancerNetKurus, locale)}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">{t.exactTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {t.exactBody}
              </p>
            </article>

            <article
              data-bento-tile
              className="col-span-2 rounded-3xl border border-white/10 bg-neutral-900 p-8 transition-colors duration-500 hover:bg-neutral-800/80 md:col-span-6"
            >
              <h3 className="text-lg font-semibold text-white">{t.rlsTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {t.rlsBody}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Action */}
      <section className="relative overflow-hidden px-6 py-32 md:py-44">
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[30rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[150px]"
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <h2
            className="font-black leading-[1.02] tracking-[-0.035em] text-white"
            style={{ fontSize: "clamp(2.4rem, 5.2vw, 4.5rem)" }}
          >
            {t.closingTitle}
          </h2>
          <div className="mt-11 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-white px-9 py-4 text-base font-semibold text-neutral-950 transition-transform duration-300 hover:scale-[1.04]"
            >
              {t.closingPrimary}
            </Link>
            <Link
              href={PUBLIC_ROUTES.home[locale]}
              className="rounded-full border border-white/20 px-9 py-4 text-base font-semibold text-white transition-colors duration-300 hover:bg-white/10"
            >
              {t.closingSecondary}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-lg font-bold tracking-tight text-white">{BRAND}</span>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-neutral-500">
            <a href="#akis" className="transition-colors hover:text-white">{t.nav.flow}</a>
            <a href="#dagilim" className="transition-colors hover:text-white">{t.nav.split}</a>
            <a href="#durumlar" className="transition-colors hover:text-white">{t.nav.states}</a>
            <Link href="/login" className="transition-colors hover:text-white">{t.footerLogin}</Link>
          </div>
          <span className="text-sm text-neutral-600">
            {new Date().getFullYear()} {BRAND}
          </span>
        </div>
      </footer>
    </main>
  );
}
