"use client";

import { useActionState, useState } from "react";

import {
  createContract,
  findCounterparty,
  type CounterpartyResult,
  type FormState,
} from "@/app/(dashboard)/actions";
import { Field, Select, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
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
 * cannot parse is left out rather than guessed at.
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
    <dl className="grid gap-3 rounded-xl border border-zinc-200 px-5 py-4 sm:grid-cols-3 dark:border-zinc-800">
      <div>
        <dt className="text-xs text-zinc-500 dark:text-zinc-400">
          Sözleşme bedeli
        </dt>
        <dd className="tnum mt-0.5 text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {formatKurus(gross)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-zinc-500 dark:text-zinc-400">
          Müşteri escrow&apos;a yatırır
        </dt>
        <dd className="tnum mt-0.5 text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {formatKurus(charge)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-zinc-500 dark:text-zinc-400">
          Stopaj sonrası eline geçen
        </dt>
        <dd className="tnum text-brand mt-0.5 text-sm font-medium">
          {formatKurus(net)}
        </dd>
      </div>
      <p className="text-xs leading-relaxed text-zinc-500 sm:col-span-3 dark:text-zinc-400">
        Hizmet bedeli senin bedelinin üstüne eklenir ve müşteri tarafından
        ödenir; eline geçen tutardan düşülmez.
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
          side resolves to an account and a company to bill. */}
      <form action={lookupAction} className="flex max-w-md flex-col gap-2">
        <Field
          label="Müşteri e-postası"
          htmlFor="lookupEmail"
          hint="Tam adres. Müşterinin kayıtlı olması ve bir şirket eklemiş olması gerekir."
        >
          <div className="flex gap-2">
            <TextInput
              id="lookupEmail"
              name="clientEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="finans@sirket.com"
              required
            />
            <SubmitButton tone="secondary" pendingLabel="Aranıyor...">
              Bul
            </SubmitButton>
          </div>
        </Field>

        {lookup.error ? (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {lookup.error}
          </p>
        ) : null}

        {lookup.client ? (
          <p role="status" className="text-brand text-sm">
            {lookup.client.fullName} bulundu.
          </p>
        ) : null}
      </form>

      {lookup.client ? (
        <form action={action} className="flex max-w-2xl flex-col gap-6">
          <input type="hidden" name="clientEmail" value={email} />

          <Field label="Fatura edilecek şirket" htmlFor="companyId">
            <Select id="companyId" name="companyId" required>
              {lookup.client.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legal_name} — {c.vkn}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Proje başlığı" htmlFor="title">
            <TextInput id="title" name="title" required />
          </Field>

          <Field
            label="İşin kapsamı"
            htmlFor="scopeOfWork"
            hint="İki tarafın imzalayacağı metin bu. Onayın ne anlama geldiğini burası belirler, o yüzden somut yazmakta fayda var."
          >
            <TextArea
              id="scopeOfWork"
              name="scopeOfWork"
              required
              rows={4}
              placeholder="Ne teslim edilecek ve neye teslim edilmiş sayılacak."
            />
          </Field>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Aşamalar
            </legend>
            <p className="-mt-2 max-w-[62ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Her aşama kendi başına fonlanır ve kendi başına serbest kalır.
              Birindeki tıkanma diğerlerini bekletmez.
            </p>

            {rows.map((row, index) => (
              <div
                key={row.id}
                className="grid gap-2 sm:grid-cols-[1fr_9rem_9rem_auto]"
              >
                <TextInput
                  name={`milestones[${index}][title]`}
                  value={row.title}
                  onChange={(e) => update(row.id, "title", e.target.value)}
                  placeholder="Aşama adı"
                  aria-label="Aşama adı"
                  required
                />
                <TextInput
                  name={`milestones[${index}][amount]`}
                  value={row.amount}
                  onChange={(e) => update(row.id, "amount", e.target.value)}
                  placeholder="10.000,00"
                  aria-label="Tutar"
                  inputMode="decimal"
                  required
                />
                <TextInput
                  name={`milestones[${index}][dueDate]`}
                  value={row.dueDate}
                  onChange={(e) => update(row.id, "dueDate", e.target.value)}
                  aria-label="Teslim tarihi"
                  type="date"
                />
                <button
                  type="button"
                  disabled={rows.length === 1}
                  onClick={() =>
                    setRows((current) => current.filter((r) => r.id !== row.id))
                  }
                  className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 active:translate-y-px disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                >
                  Kaldır
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setRows((current) => [
                  ...current,
                  blankRow((current.at(-1)?.id ?? 0) + 1),
                ])
              }
              className="self-start rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-950 hover:bg-zinc-50 active:translate-y-px dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              Aşama ekle
            </button>
          </fieldset>

          <Totals rows={rows} feeBps={feeBps} stopajBps={stopajBps} />

          <FormFeedback state={state} />
          <SubmitButton className="self-start" pendingLabel="Oluşturuluyor...">
            Sözleşmeyi oluştur
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
