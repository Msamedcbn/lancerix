"use client";

import { useActionState } from "react";
import { toggleWorkflowPhase } from "@/app/(dashboard)/contracts/[id]/actions/workflow";
import { Loader2 } from "lucide-react";

type TogglePhaseFormProps = {
  contractId: string;
  phaseId: string;
  isCompleted: boolean;
};

export function TogglePhaseForm({
  contractId,
  phaseId,
  isCompleted,
}: TogglePhaseFormProps) {
  const [, formAction, isPending] = useActionState(
    async () => {
      const res = await toggleWorkflowPhase(contractId, phaseId, !isCompleted);
      return res;
    },
    null
  );

  return (
    <form action={formAction} className="mt-2 flex w-full">
      <button
        type="submit"
        disabled={isPending}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          isCompleted
            ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
        }`}
      >
        {isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <span className="flex size-3.5 items-center justify-center rounded-sm border border-current">
            {isCompleted && (
              <span className="h-1.5 w-1.5 rounded-sm bg-current" />
            )}
          </span>
        )}
        {isCompleted ? "Tamamlandı İşaretini Kaldır" : "Tamamlandı Olarak İşaretle"}
      </button>
    </form>
  );
}
