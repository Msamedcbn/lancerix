import { BadgePercent, FileLock2 } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import type { Locale } from "@/lib/i18n/config";
import { ROADMAP_COPY } from "@/lib/i18n/dictionaries/roadmap";

type RailState = "done" | "current" | "upcoming";

const RAIL_NODE_TONE: Record<RailState, string> = {
  done: "border-brand bg-brand text-brand-foreground",
  current: "border-brand bg-white text-brand dark:bg-zinc-900",
  upcoming: "border-border bg-background text-muted-foreground",
};

/** The vertical rail: a real sequence (past -> present -> future), so a
 * numbered/checked node connected by a line is information, not decoration --
 * unlike a copy-pasted scroll-animated timeline component, which is what
 * used to render here. */
function RailNode({
  index,
  state,
  isLast,
}: Readonly<{ index: number; state: RailState; isLast: boolean }>) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${RAIL_NODE_TONE[state]}`}
      >
        {state === "done" ? "✓" : index}
      </span>
      {!isLast ? <span aria-hidden className="w-0.5 flex-1 bg-border" /> : null}
    </div>
  );
}

/** The roadmap timeline, shared by /yol-haritasi and /en/roadmap. */
export function RoadmapView({ locale }: Readonly<{ locale: Locale }>) {
  const t = ROADMAP_COPY[locale];

  return (
    <main className="w-full min-h-screen bg-background flex flex-col">
      <SiteHeader locale={locale} />

      <article className="flex-1 px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {t.heading}
          </h1>
          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
            {t.intro}
          </p>

          <ol className="mt-14 flex flex-col">
            <li className="relative flex gap-5">
              <RailNode index={1} state="done" isLast={false} />
              <div className="min-w-0 flex-1 pb-14">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {t.past.title}
                </h2>
                <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
                  {t.past.body}
                </p>
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                    {t.past.problemsHeading}
                  </h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-rose-600 dark:text-rose-300">
                    {t.past.problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>

            <li className="relative flex gap-5">
              <RailNode index={2} state="current" isLast={false} />
              <div className="min-w-0 flex-1 pb-14">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {t.present.title}
                </h2>
                <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
                  {t.present.bodyBefore}
                  <strong className="text-foreground">{t.present.bodyStrong}</strong>
                  {t.present.bodyAfter}
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <BadgePercent className="text-brand size-5" aria-hidden strokeWidth={1.75} />
                    <h3 className="mt-3 text-sm font-semibold text-foreground">
                      {t.present.costTitle}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t.present.costBody}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <FileLock2 className="text-brand size-5" aria-hidden strokeWidth={1.75} />
                    <h3 className="mt-3 text-sm font-semibold text-foreground">
                      {t.present.reportsTitle}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t.present.reportsBody}
                    </p>
                  </div>
                </div>
              </div>
            </li>

            <li className="relative flex gap-5">
              <RailNode index={3} state="upcoming" isLast />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {t.future.title}
                </h2>
                <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
                  {t.future.body}
                </p>

                <div className="mt-2 flex flex-col divide-y divide-border">
                  <div className="py-5">
                    <p className="mono text-xs tracking-wide text-muted-foreground">
                      {t.future.nowBadge}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      {t.future.nowTitle}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t.future.nowBody}
                    </p>
                  </div>

                  <div className="py-5">
                    <p className="mono text-xs tracking-wide text-muted-foreground">
                      {t.future.launchBadge}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      {t.future.launchTitle}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t.future.launchBody}
                    </p>
                  </div>

                  <div className="py-5">
                    <p className="mono text-xs tracking-wide text-muted-foreground">
                      {t.future.targetBadge}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      {t.future.targetTitle}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t.future.targetBodyBefore}
                      <strong className="text-foreground">{t.future.targetBodyStrong}</strong>
                      {t.future.targetBodyAfter}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </article>

      <SiteFooter locale={locale} />
    </main>
  );
}
