import { PhaseNotesForm, PhaseNotesReadOnly } from "@/components/forms/phase-notes-form";
import { TogglePhaseForm } from "@/components/forms/toggle-phase-form";
import { PhaseItemsReadOnly, TogglePhaseItemForm } from "@/components/forms/toggle-phase-item-form";
import { PhaseThread } from "@/components/phase-thread";
import type { MessageRow } from "@/lib/data/messages";
import type { Phase } from "@/lib/data/contracts";

/**
 * The project's phases as a flow, not a card grid.
 *
 * A grid of equal cards says "here are some things"; a flow says "this comes
 * after that", which is the actual claim being made about a project plan.
 * The rail is the spine: it fills to the last completed phase, so progress
 * is readable at a glance without counting checkmarks.
 *
 * The rail runs vertically at every width. A horizontal flow reads well when
 * a node is just a label, but these nodes carry a description, a notes field
 * and a per-phase thread: at three columns the thread wrapped to one word per
 * line. Top-to-bottom still says "this comes after that", and it gives each
 * phase the full width its controls need.
 */
export function PhaseFlowchart({
  contractId,
  phases,
  side,
  messages = [],
}: Readonly<{
  contractId: string;
  phases: Phase[];
  side?: "freelancer" | "client";
  messages?: MessageRow[];
}>) {
  // One pass to bucket messages by phase, rather than filtering inside the
  // render loop once per phase.
  const byPhase = new Map<string, MessageRow[]>();
  for (const m of messages) {
    if (!m.phase_id) continue;
    const bucket = byPhase.get(m.phase_id);
    if (bucket) bucket.push(m);
    else byPhase.set(m.phase_id, [m]);
  }
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

      <ol className="flex flex-col">
        {ordered.map((phase, index) => {
          const isDone = phase.is_completed;
          const isCurrent = index === currentIndex;
          const isLast = index === ordered.length - 1;

          return (
            <li key={phase.id} className="relative flex gap-4">
              {/* The rail: node, then a connector filling the rest of the row
                  so consecutive phases join into one continuous line. */}
              <div className="flex flex-col items-center">
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
                    className={`w-0.5 flex-1 ${
                      isDone ? "bg-brand" : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  />
                ) : null}
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-8"}`}>
                <p
                  className={`text-sm font-semibold ${
                    isDone || isCurrent
                      ? "text-zinc-950 dark:text-zinc-50"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {phase.title}
                </p>

                {phase.start_date || phase.end_date ? (
                  <p className="tnum mt-0.5 text-xs text-zinc-400">
                    {phase.start_date ?? "?"} → {phase.end_date ?? "?"}
                  </p>
                ) : phase.estimated_days ? (
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

                {phase.items.length > 0 ? (
                  <div className="mt-3 max-w-2xl rounded-xl border border-zinc-100 bg-zinc-50/60 p-2 dark:border-zinc-800/60 dark:bg-zinc-950/30">
                    <p className="px-2 py-1 text-[0.65rem] font-semibold text-zinc-400">
                      {phase.items.filter((it) => it.is_completed).length}/{phase.items.length}{" "}
                      madde tamamlandı
                    </p>
                    {side === "freelancer" ? (
                      <div className="flex flex-col">
                        {phase.items.map((item) => (
                          <TogglePhaseItemForm
                            key={item.id}
                            contractId={contractId}
                            itemId={item.id}
                            title={item.title}
                            isCompleted={item.is_completed}
                          />
                        ))}
                      </div>
                    ) : (
                      <PhaseItemsReadOnly items={phase.items} />
                    )}
                  </div>
                ) : null}

                <div className="mt-3 flex max-w-2xl flex-col gap-2">
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

                  <PhaseThread
                    contractId={contractId}
                    phaseId={phase.id}
                    messages={byPhase.get(phase.id) ?? []}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
