"use client";

import { useActionState, useState } from "react";

import {
  createContract,
  findCounterparty,
  type CounterpartyResult,
  type FormState,
} from "@/app/(dashboard)/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeEscrowSplit,
  formatKurus,
  MIN_MILESTONE_GROSS_KURUS,
  parseTryToKurus,
} from "@/lib/escrow/money";

const LOOKUP_INITIAL: CounterpartyResult = { error: null };
const FORM_INITIAL: FormState = { error: null };

type Row = { id: number; title: string; amount: string; dueDate: string };

const blankRow = (id: number): Row => ({ id, title: "", amount: "", dueDate: "" });

/**
 * Live preview of what the client will owe and what the freelancer will keep.
 *
 * It calls the same computeEscrowSplit() the database mirrors, so the figure
 * quoted while drafting is the figure the milestone will carry. Anything it
 * cannot parse is simply left out rather than guessed at.
 */
function Totals({
  rows,
  feeBps,
  stopajBps,
}: Readonly<{ rows: Row[]; feeBps: number; stopajBps: number }>) {
  let gross = 0;
  let charge = 0;
  let net = 0;
  let priced = 0;

  for (const row of rows) {
    let kurus: number;
    try {
      kurus = parseTryToKurus(row.amount);
    } catch {
      continue;
    }
    if (kurus < MIN_MILESTONE_GROSS_KURUS) continue;

    const split = computeEscrowSplit({
      grossKurus: kurus,
      platformFeeBps: feeBps,
      stopajBps,
    });
    gross += split.grossKurus;
    charge += split.clientChargeKurus;
    net += split.freelancerNetKurus;
    priced += 1;
  }

  if (priced === 0) return null;

  return (
    <dl className="bg-muted/40 grid gap-2 rounded-lg border p-4 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Contract amount</dt>
        <dd className="font-medium">{formatKurus(gross)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Client transfers into escrow</dt>
        <dd className="font-medium">{formatKurus(charge)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">You receive after stopaj</dt>
        <dd className="font-semibold text-emerald-700">{formatKurus(net)}</dd>
      </div>
      <p className="text-muted-foreground pt-1 text-xs">
        The service fee is added on top of your amount and paid by the client,
        so it never comes out of what you receive.
      </p>
    </dl>
  );
}

export function ContractForm({
  feeBps,
  stopajBps,
}: Readonly<{ feeBps: number; stopajBps: number }>) {
  const [lookup, lookupAction] = useActionState(findCounterparty, LOOKUP_INITIAL);
  const [state, action] = useActionState(createContract, FORM_INITIAL);

  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<Row[]>([blankRow(0)]);

  const update = (id: number, field: keyof Row, value: string) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );

  return (
    <div className="flex flex-col gap-8">
      {/* Step one, on its own: the contract cannot be drafted until the other
          side is resolved to an account and a company to bill. */}
      <form action={lookupAction} className="flex max-w-md flex-col gap-3">
        <Label htmlFor="lookupEmail">Client email</Label>
        <div className="flex gap-2">
          <Input
            id="lookupEmail"
            name="clientEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="finance@company.com"
            required
          />
          <SubmitButton variant="secondary" pendingLabel="Looking...">
            Find
          </SubmitButton>
        </div>
        {lookup.error ? (
          <p className="text-destructive text-sm" role="alert">
            {lookup.error}
          </p>
        ) : null}
        {lookup.client ? (
          <p className="text-sm text-emerald-700" role="status">
            Found {lookup.client.fullName}.
          </p>
        ) : null}
      </form>

      {lookup.client ? (
        <form action={action} className="flex max-w-2xl flex-col gap-6">
          <input type="hidden" name="clientEmail" value={email} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="companyId">Bill to</Label>
            <select
              id="companyId"
              name="companyId"
              required
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              {lookup.client.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legal_name} — {c.vkn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Project title</Label>
            <Input id="title" name="title" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="scopeOfWork">Scope of work</Label>
            <textarea
              id="scopeOfWork"
              name="scopeOfWork"
              required
              rows={4}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
              placeholder="What is being delivered, and what counts as delivered."
            />
            <p className="text-muted-foreground text-sm">
              This is the text both sides sign. It decides what an approval
              means, so it is worth being specific.
            </p>
          </div>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-medium">Milestones</legend>
            <p className="text-muted-foreground -mt-2 text-sm">
              Each one is funded and released on its own. A hold-up on one does
              not block the others.
            </p>

            {rows.map((row, index) => (
              <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_10rem_10rem_auto]">
                <Input
                  name={`milestones[${index}][title]`}
                  value={row.title}
                  onChange={(e) => update(row.id, "title", e.target.value)}
                  placeholder="Milestone"
                  required
                />
                <Input
                  name={`milestones[${index}][amount]`}
                  value={row.amount}
                  onChange={(e) => update(row.id, "amount", e.target.value)}
                  placeholder="10.000,00"
                  inputMode="decimal"
                  required
                />
                <Input
                  name={`milestones[${index}][dueDate]`}
                  value={row.dueDate}
                  onChange={(e) => update(row.id, "dueDate", e.target.value)}
                  type="date"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={rows.length === 1}
                  onClick={() =>
                    setRows((current) => current.filter((r) => r.id !== row.id))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                setRows((current) => [
                  ...current,
                  blankRow((current.at(-1)?.id ?? 0) + 1),
                ])
              }
            >
              Add milestone
            </Button>
          </fieldset>

          <Totals rows={rows} feeBps={feeBps} stopajBps={stopajBps} />

          <FormFeedback state={state} />
          <SubmitButton pendingLabel="Creating...">Create contract</SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
