"use client";

import type { ContractRow } from "@/lib/data/contracts";
import { StatusBadge } from "@/components/status-badge";
import { Money } from "@/components/money";
import { PhaseFlowchart } from "@/components/phase-flowchart";

type WorkflowDiagramProps = {
  contract: ContractRow;
  productType: string;
  criteriaCount?: number;
  side?: "freelancer" | "client";
};

export function WorkflowDiagram({
  contract,
  productType,
  criteriaCount = 0,
  side,
}: Readonly<WorkflowDiagramProps>) {
  if (productType === "QA_ONLY") {
    const phases = contract.phases ?? [];

    if (phases.length > 0) {
      // A real plan with named phases deserves a flow, not a card grid.
      return (
        <PhaseFlowchart contractId={contract.id} phases={phases} side={side} />
      );
    }

    return (
      <div className="fade-in relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 p-6 shadow-sm backdrop-blur-md dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs">
              QA
            </span>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              Proje Doğrulama İş Akışı (Workflow)
            </h3>
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
            {criteriaCount} Kabul Kriteri
          </span>
        </div>

        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          <li className="relative flex flex-col gap-2 rounded-xl bg-white/90 p-4 border border-zinc-200/80 shadow-2xs dark:bg-zinc-900/90 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
                ✓
              </span>
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                1. Kriter Tanımı
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Kabul Şartları Belirlendi
            </p>
            <p className="text-[0.75rem] text-zinc-500 dark:text-zinc-400">
              {criteriaCount} test kriteri donduruldu.
            </p>
          </li>

          <li className="relative flex flex-col gap-2 rounded-xl bg-white/90 p-4 border border-indigo-200 shadow-2xs dark:bg-zinc-900/90 dark:border-indigo-800/60">
            <div className="flex items-center justify-between">
              <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold animate-pulse">
                2
              </span>
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                2. Test Koşumu
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Teslim & QA Taraması
            </p>
            <p className="text-[0.75rem] text-zinc-500 dark:text-zinc-400">
              Otonom ajan veya tester doğrulaması.
            </p>
          </li>

          <li className="relative flex flex-col gap-2 rounded-xl bg-white/90 p-4 border border-zinc-200/80 shadow-2xs dark:bg-zinc-900/90 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="flex size-6 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 text-xs font-bold dark:bg-zinc-700 dark:text-zinc-300">
                3
              </span>
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                3. Onay / Rapor
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Müşteri Kararı & Rapor
            </p>
            <p className="text-[0.75rem] text-zinc-500 dark:text-zinc-400">
              Kabul edilince süreç tamamlanır.
            </p>
          </li>
        </ol>
      </div>
    );
  }

  const milestones = contract.milestones;
  const completedCount = milestones.filter((m) => m.status === "RELEASED" || m.status === "COMPLETED").length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="fade-in relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-brand text-brand-foreground font-bold text-xs">
              📊
            </span>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              Canlı Proje Akış Şeması (Milestone Workflow)
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Freelancer her etabı bitirdikçe işaretler (`[x]`), müşteri canlı aşama ilerlemesini izler.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">İlerleme</p>
            <p className="text-sm font-bold text-brand">{completedCount}/{milestones.length} Faz (%{progressPercent})</p>
          </div>
          <div className="size-10 rounded-full border-4 border-brand/20 border-t-brand flex items-center justify-center text-xs font-extrabold text-brand">
            %{progressPercent}
          </div>
        </div>
      </div>

      <ol className="mt-6 flex flex-col gap-4">
        {milestones.map((m, index) => {
          const isDone = m.status === "RELEASED" || m.status === "COMPLETED";
          const isInProgress = m.status === "IN_PROGRESS" || m.status === "SUBMITTED";

          return (
            <li
              key={m.id}
              className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border p-4 transition-all ${
                isDone
                  ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                  : isInProgress
                  ? "border-brand bg-brand/5 shadow-xs ring-1 ring-brand/20 dark:bg-brand/10"
                  : "border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-800/80 dark:bg-zinc-950/40"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isInProgress
                      ? "bg-brand text-brand-foreground animate-pulse"
                      : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {isDone ? "✓" : index + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                      Faz {m.sequence_no}: {m.title}
                    </span>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.7rem] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        [x] Tamamlandı
                      </span>
                    ) : null}
                  </div>

                  {m.due_date ? (
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      📅 Hedef Teslim: {m.due_date}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <StatusBadge status={m.status} />
                <Money
                  kurus={m.gross_amount_kurus}
                  className="text-sm font-bold text-zinc-950 dark:text-zinc-50"
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
