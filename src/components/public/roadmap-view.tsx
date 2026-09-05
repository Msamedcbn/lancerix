import { Timeline } from "@/components/ui/timeline";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import type { Locale } from "@/lib/i18n/config";
import { ROADMAP_COPY } from "@/lib/i18n/dictionaries/roadmap";

/** The roadmap timeline, shared by /yol-haritasi and /en/roadmap. */
export function RoadmapView({ locale }: Readonly<{ locale: Locale }>) {
  const t = ROADMAP_COPY[locale];

  const data = [
    {
      title: t.past.title,
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-8 leading-relaxed">
            {t.past.body}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4">
              <h4 className="text-rose-700 dark:text-rose-400 font-bold mb-2">
                {t.past.problemsHeading}
              </h4>
              <ul className="text-sm text-rose-600 dark:text-rose-300 space-y-2 list-disc pl-4">
                {t.past.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t.present.title,
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-8 leading-relaxed">
            {t.present.bodyBefore}
            <strong>{t.present.bodyStrong}</strong>
            {t.present.bodyAfter}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
              <h4 className="text-brand font-bold mb-2">{t.present.costTitle}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t.present.costBody}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 shadow-sm">
              <h4 className="text-brand font-bold mb-2">{t.present.reportsTitle}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t.present.reportsBody}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t.future.title,
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-8 leading-relaxed">
            {t.future.body}
          </p>
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-brand/10 text-brand px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {t.future.nowBadge}
                </span>
                <h4 className="text-zinc-900 dark:text-zinc-100 font-bold">
                  {t.future.nowTitle}
                </h4>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t.future.nowBody}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {t.future.launchBadge}
                </span>
                <h4 className="text-blue-900 dark:text-blue-100 font-bold">
                  {t.future.launchTitle}
                </h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300/80">
                {t.future.launchBody}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {t.future.targetBadge}
                </span>
                <h4 className="text-emerald-900 dark:text-emerald-100 font-bold">
                  {t.future.targetTitle}
                </h4>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300/80 relative z-10">
                {t.future.targetBodyBefore}
                <strong>{t.future.targetBodyStrong}</strong>
                {t.future.targetBodyAfter}
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="w-full min-h-screen bg-background flex flex-col">
      <SiteHeader locale={locale} />
      <div className="flex-1 w-full pt-16">
        <Timeline data={data} heading={t.heading} intro={t.intro} />
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}
