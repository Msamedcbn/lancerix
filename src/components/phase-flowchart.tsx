import { PhaseNotesForm, PhaseNotesReadOnly } from "@/components/forms/phase-notes-form";
import { TogglePhaseForm } from "@/components/forms/toggle-phase-form";
import type { Tables } from "@/lib/supabase/database.types";

type Phase = Tables<"workflow_phases">;

/**
 * The project's phases as a flow, not a card grid.
 *
 * A grid of equal cards says "here are some things"; a flow says "this comes
 * after that", which is the actual claim being made about a project plan.
 * The rail is the spine: it fills to the last completed phase, so progress
 * is readable at a glance without counting checkmarks.
 *
 * Layout is a vertical rail on mobile and a horizontal one from `md` up.
 * Horizontal-on-mobile would either overflow or shrink each node past
 * legibility, and a plan you cannot read is not a plan.
 */
export function PhaseFlowchart({
  contractId,
  phases,
  side,
}: Readonly<{
  contractId: string;
  phases: Phase[];
  side?: "freelancer" | "client";
}>) {
  const ordered = [...phases].sort((a, b) => a.sequence_no - b.sequence_no);
  const doneCount = ordered.filter((p) => p.is_completed).length;
  const totalDays = ordered.reduce((sum, p) => sum + (p.estimated_days ?? 0), 0);

  // The first unfinished phase is "current". Everything before it is done,
  // everything after is upcoming -- which is what the rail fill encodes.
  const currentIndex = ordered.findIndex((p) => !p.is_completed);
  const progressPct =
    ordered.length === 0 ? 0 : Math.round((doneCount / ordered.length) * 100);

  return (
    <section className="fade-in rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Proje akışı
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {doneCount}/{ordered.length} faz tamamlandı
            {totalDays > 0 ? ` · toplam ~${totalDays} gün planlandı` : ""}
          </p>
        </div>
        <span className="tnum text-brand text-2xl font-semibold tabular-nums">
          %{progressPct}
        </span>
      </header>

      {/* Progress rail. aria-hidden because the same information is already
          in the header text; a screen reader does not need the decoration. */}
      <div
        aria-hidden
        className="mb-6 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
      >
        <div
          className="bg-brand h-full rounded-full transition-[width] duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ol className="flex flex-col gap-0 md:flex-row md:items-stretch md:gap-0">
        {ordered.map((phase, index) => {
          const isDone = phase.is_completed;
          const isCurrent = index === currentIndex;
          const isLast = index === ordered.length - 1;

          return (
            <li
              key={phase.id}
              className="relative flex flex-1 gap-4 pb-6 md:flex-col md:gap-0 md:pb-0"
            >
              {/* Node + connector. On mobile the connector is a vertical line
                  down the left gutter; from md it is a horizontal line on the
                  node row. */}
              <div className="flex flex-col items-center md:w-full md:flex-row">
                <span
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    isDone
                      ? "border-brand bg-brand text-brand-foreground"
                      : isCurrent
                        ? "border-brand bg-white text-brand dark:bg-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                  }`}
                >
                  {isDone ? "✓" : phase.sequence_no}
                </span>

                {!isLast ? (
                  <span
                    aria-hidden
                    className={`w-0.5 flex-1 md:h-0.5 md:w-auto ${
                      isDone ? "bg-brand" : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  />
                ) : (
                  <span aria-hidden className="w-0.5 flex-1 md:hidden" />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-2 md:pt-4 md:pr-6">
                <p
                  className={`text-sm font-semibold ${
                    isDone || isCurrent
                      ? "text-zinc-950 dark:text-zinc-50"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {phase.title}
                </p>

                {phase.estimated_days ? (
                  <p className="tnum mt-0.5 text-xs text-zinc-400">
                    ~{phase.estimated_days} gün
                  </p>
                ) : null}

                {phase.description ? (
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {phase.description}
                  </p>
                ) : null}

                {isCurrent ? (
                  <span className="bg-brand/10 text-brand mt-2 inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-semibold">
                    Şu an burada
                  </span>
                ) : null}

                <div className="mt-3 flex flex-col gap-2">
                  {side === "freelancer" ? (
                    <>
                      <PhaseNotesForm
                        contractId={contractId}
                        phaseId={phase.id}
                        notes={phase.notes}
                      />
                      <TogglePhaseForm
                        contractId={contractId}
                        phaseId={phase.id}
                        isCompleted={isDone ?? false}
                      />
                    </>
                  ) : (
                    <PhaseNotesReadOnly notes={phase.notes} />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
