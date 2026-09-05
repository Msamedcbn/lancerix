"use client";

import { BarChart3, Calendar } from "lucide-react";

import type { ContractRow } from "@/lib/data/contracts";
import { StatusBadge } from "@/components/status-badge";
import { Money } from "@/components/money";
import { PhaseFlowchart } from "@/components/phase-flowchart";
import type { MessageRow } from "@/lib/data/messages";

type WorkflowDiagramProps = {
  contract: ContractRow;
  productType: string;
  criteriaCount?: number;
  side?: "freelancer" | "client";
  messages?: MessageRow[];
};

export function WorkflowDiagram({
  contract,
  productType,
  criteriaCount = 0,
  side,
  messages = [],
}: Readonly<WorkflowDiagramProps>) {
  if (productType === "QA_ONLY") {
    const phases = contract.phases ?? [];

    if (phases.length > 0) {
      // A real plan with named phases deserves a flow, not a card grid.
      return (
        <PhaseFlowchart
          contractId={contract.id}
          phases={phases}
          side={side}
          messages={messages}
        />
      );
    }

    // Same three fixed stages every QA_ONLY contract passes through before
    // real phases exist to hand off to PhaseFlowchart above -- a rail, not a
    // card grid, for the same reason PhaseFlowchart itself is a rail: a node
    // that's just a label survives a column, one that carries a description
    // does not.
    const WORKFLOW_STEPS = [
      {
        eyebrow: "1. Kriter Tanımı",
        title: "Kabul Şartları Belirlendi",
        body: `${criteriaCount} test kriteri donduruldu.`,
        tone: "bg-emerald-500 text-white",
        mark: "✓",
      },
      {
        eyebrow: "2. Test Koşumu",
        title: "Teslim & QA Taraması",
        body: "Otonom ajan veya tester doğrulaması.",
        tone: "bg-indigo-600 text-white animate-pulse",
        mark: "2",
      },
      {
        eyebrow: "3. Onay / Rapor",
        title: "Müşteri Kararı & Rapor",
        body: "Kabul edilince süreç tamamlanır.",
        tone: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
        mark: "3",
      },
    ] as const;

    return (
      <div className="fade-in rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <div className="flex flex-col gap-3 pb-5 border-b border-zinc-100 dark:border-zinc-800/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Proje Doğrulama İş Akışı
          </h3>
          <span className="self-start rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 shrink-0 dark:bg-zinc-800 dark:text-zinc-300 sm:self-auto">
            {criteriaCount} Kabul Kriteri
          </span>
        </div>

        <ol className="mt-6 flex flex-col">
          {WORKFLOW_STEPS.map((step, index) => {
            const isLast = index === WORKFLOW_STEPS.length - 1;
            return (
              <li key={step.eyebrow} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.tone}`}
                  >
                    {step.mark}
                  </span>
                  {!isLast ? (
                    <span aria-hidden className="w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-700" />
                  ) : null}
                </div>
                <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-6"}`}>
                  <p className="text-[0.7rem] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {step.eyebrow}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{step.body}</p>
                </div>
              </li>
            );
          })}
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
              <BarChart3 className="size-4" aria-hidden />
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
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <Calendar className="size-3" aria-hidden />
                      Hedef Teslim: {m.due_date}
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
