import type { CriterionDraft } from "@/lib/validations/acceptance-criteria";

/**
 * FormData parsing shared by contract-actions.ts (previewContract,
 * createContract) and criteria-actions.ts (addAcceptanceCriteria) -- plain
 * helpers, not Server Actions themselves, so this file carries no "use
 * server" directive.
 */

/** Milestone rows arrive as milestones[0][title] style keys. */
export function readMilestones(formData: FormData) {
  const byIndex = new Map<number, { title: string; amount: string; dueDate: string }>();

  for (const [key, value] of formData.entries()) {
    const match = /^milestones\[(\d+)]\[(title|amount|dueDate)]$/.exec(key);
    if (!match) continue;

    const index = Number(match[1]);
    const field = match[2] as "title" | "amount" | "dueDate";
    const row = byIndex.get(index) ?? { title: "", amount: "", dueDate: "" };
    row[field] = String(value);
    byIndex.set(index, row);
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => row.title !== "" || row.amount !== "");
}

/** Free-text criteria: only description field. */
export function readCriteria(formData: FormData): CriterionDraft[] {
  const byIndex = new Map<number, { description: string }>();

  for (const [key, value] of formData.entries()) {
    const match = /^criteria\[(\d+)]\[description]$/.exec(key);
    if (!match) continue;

    const index = Number(match[1]);
    byIndex.set(index, { description: String(value) });
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => row.description.trim() !== "");
}

/** Workflow phases: title, description, startDate, endDate, and a nested checklist of items. */
export function readPhases(formData: FormData) {
  type PhaseRow = {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    items: Map<number, string>;
  };
  const blankRow = (): PhaseRow => ({ title: "", description: "", startDate: "", endDate: "", items: new Map() });
  const byIndex = new Map<number, PhaseRow>();

  for (const [key, value] of formData.entries()) {
    const flat = /^phases\[(\d+)]\[(title|description|startDate|endDate)]$/.exec(key);
    if (flat) {
      const index = Number(flat[1]);
      const field = flat[2] as "title" | "description" | "startDate" | "endDate";
      const row = byIndex.get(index) ?? blankRow();
      row[field] = String(value);
      byIndex.set(index, row);
      continue;
    }

    const item = /^phases\[(\d+)]\[items]\[(\d+)]\[title]$/.exec(key);
    if (item) {
      const index = Number(item[1]);
      const itemIndex = Number(item[2]);
      const row = byIndex.get(index) ?? blankRow();
      row.items.set(itemIndex, String(value));
      byIndex.set(index, row);
    }
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => ({
      title: row.title,
      description: row.description,
      startDate: row.startDate,
      endDate: row.endDate,
      items: [...row.items.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, title]) => title)
        .filter((title) => title.trim() !== ""),
    }))
    .filter((row) => row.title.trim() !== "");
}
