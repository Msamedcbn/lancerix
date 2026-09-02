"use client";

import { useActionState, useState } from "react";

import {
  createContract,
  findCounterparty,
  previewContract,
  type CounterpartyResult,
  type FormState,
  type PreviewResult,
} from "@/app/(dashboard)/actions";
import { Field, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_INFO,
  type ProjectCategory,
} from "@/lib/validations/project-category";

const LOOKUP_INITIAL: CounterpartyResult = { error: null };
const FORM_INITIAL: FormState = { error: null };
const PREVIEW_INITIAL: PreviewResult = { error: null };

type ProductType = "QA_ONLY" | "QA_PLUS_ESCROW";

const STEPS = ["Müşteri", "Proje & Kapsam", "İş Akışı", "Önizleme & Gönder"] as const;

type Phase = { id: number; title: string; description: string; estimatedDays: string };

const blankPhase = (id: number): Phase => ({ id, title: "", description: "", estimatedDays: "" });

/* ────────────────────────── Step Bar ────────────────────────── */
function StepBar({ current }: Readonly<{ current: number }>) {
  return (
    <nav aria-label="Sözleşme Adımları" className="mb-2 overflow-x-auto">
      <ol className="flex items-center gap-2 sm:gap-4 min-w-max pb-2">
        {STEPS.map((label, index) => {
          const isCurrent = index === current;
          const isDone = index < current;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                  isCurrent
                    ? "bg-brand text-brand-foreground shadow-md shadow-brand/20 ring-2 ring-brand/30"
                    : isDone
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-500"
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[0.7rem] font-extrabold ${
                    isCurrent
                      ? "bg-white/20 text-brand-foreground"
                      : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span>{label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <span className="h-0.5 w-4 sm:w-6 rounded bg-zinc-200 dark:bg-zinc-800" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ────────────────────── Counterparty Card ───────────────────── */
function CounterpartyCard({
  resolved,
}: Readonly<{
  resolved: NonNullable<CounterpartyResult["resolved"]>;
}>) {
  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-5 shadow-sm dark:border-emerald-800/60 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-extrabold text-white shadow-md">
          {resolved.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
            {resolved.fullName}
          </h3>
          <p className="mt-0.5 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.7rem] font-bold tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              ID: {resolved.publicId}
            </span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-semibold text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
              İşveren
            </span>
          </p>
        </div>
      </div>
      {resolved.companies.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {resolved.companies.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
            >
              🏢 {c.legal_name}
              {c.vkn && (
                <span className="text-zinc-400 dark:text-zinc-500">VKN {c.vkn}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────── Hidden Draft Fields for Forms ────────────── */
function DraftFields({
  productType,
  projectCategory,
  clientPublicId,
  companyId,
  title,
  scopeOfWork,
  phases,
  plannedStartDate,
  projectAmount,
}: Readonly<{
  productType: ProductType;
  projectCategory: ProjectCategory;
  clientPublicId: string;
  companyId: string;
  title: string;
  scopeOfWork: string;
  phases: Phase[];
  plannedStartDate: string;
  projectAmount: string;
}>) {
  return (
    <>
      <input type="hidden" name="productType" value={productType} />
      <input type="hidden" name="projectCategory" value={projectCategory} />
      <input type="hidden" name="clientPublicId" value={clientPublicId} />
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="scopeOfWork" value={scopeOfWork} />
      <input type="hidden" name="plannedStartDate" value={plannedStartDate} />
      <input type="hidden" name="projectAmount" value={projectAmount} />

      {phases.map((row, index) => (
        <div key={row.id}>
          <input type="hidden" name={`phases[${index}][title]`} value={row.title} />
          <input type="hidden" name={`phases[${index}][description]`} value={row.description} />
          <input type="hidden" name={`phases[${index}][estimatedDays]`} value={row.estimatedDays} />
        </div>
      ))}
    </>
  );
}

/* ────────────────────── Button Styles ───────────────────────── */
const NEXT_BUTTON =
  "bg-brand rounded-xl px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-md shadow-brand/20 transition-all hover:bg-brand/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-40";
const BACK_BUTTON =
  "rounded-xl border border-zinc-200/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800";

/* ═══════════════════════ MAIN FORM ═════════════════════════ */
export function ContractForm({
  feeBps,
  stopajBps,
  payoutBlockers,
}: Readonly<{ feeBps: number; stopajBps: number; payoutBlockers: string[] }>) {
  const [lookup, lookupAction] = useActionState(findCounterparty, LOOKUP_INITIAL);
  const [preview, previewAction] = useActionState(previewContract, PREVIEW_INITIAL);
  const [state, action] = useActionState(createContract, FORM_INITIAL);

  const [step, setStep] = useState(0);
  const [productType] = useState<ProductType>("QA_ONLY");
  const [projectCategory, setProjectCategory] = useState<ProjectCategory>("SOFTWARE");
  const [clientPublicId, setClientPublicId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [projectAmount, setProjectAmount] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);

  const updatePhase = (id: number, field: keyof Phase, value: string) =>
    setPhases((p) => p.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const clientSettled = Boolean(lookup.resolved);
  const companies = lookup.resolved?.companies ?? [];

  const draft = {
    productType,
    projectCategory,
    clientPublicId: lookup.resolved?.publicId ?? clientPublicId,
    companyId,
    title,
    scopeOfWork,
    phases,
    plannedStartDate,
    projectAmount,
  };

  return (
    <div className="flex flex-col gap-8">
      <StepBar current={step} />

      {/* ═══ STEP 0 — Müşteri Arama (ID ile) ═══ */}
      {step === 0 && (
        <div className="fade-in flex flex-col gap-6 max-w-xl">
          <form action={lookupAction} className="flex flex-col gap-4">
            <Field
              label="Müşteri Lancerix ID"
              htmlFor="lookupPublicId"
              hint="Müşterinin profilindeki 8 haneli Lancerix ID'sini girin."
            >
              <div className="flex gap-2">
                <TextInput
                  id="lookupPublicId"
                  name="clientPublicId"
                  value={clientPublicId}
                  onChange={(e) => setClientPublicId(e.target.value.toUpperCase())}
                  placeholder="Örn: A3K9F2B1"
                  required
                  maxLength={8}
                  className="font-mono tracking-widest uppercase"
                />
                <SubmitButton tone="secondary" pendingLabel="Aranıyor...">
                  Ara
                </SubmitButton>
              </div>
            </Field>

            {lookup.error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
              >
                {lookup.error}
              </p>
            )}
          </form>

          {lookup.resolved && (
            <CounterpartyCard resolved={lookup.resolved} />
          )}

          {companies.length > 0 && (
            <Field label="Fatura Edilecek Şirket" htmlFor="companyId">
              <select
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm text-zinc-950 shadow-xs transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="">Seçilmedi (isteğe bağlı)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.vkn ? `${c.legal_name} — VKN ${c.vkn}` : c.legal_name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <button
            type="button"
            disabled={!clientSettled}
            onClick={() => setStep(1)}
            className={NEXT_BUTTON}
          >
            Devam Et &rarr;
          </button>
        </div>
      )}

      {/* ═══ STEP 1 — Proje & Kapsam ═══ */}
      {step === 1 && (
        <div className="fade-in flex max-w-2xl flex-col gap-6">
          {/* Category first: it decides what the delivery step will ask for,
              so choosing it after writing the scope would mean rewriting the
              criteria against a different idea of "delivered". */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Ne tür bir iş?
            </legend>
            <p className="-mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Teslimde neyin isteneceğini bu belirler — yazılımda staging
              adresi, tasarımda Figma linki.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROJECT_CATEGORIES.map((value) => {
                const info = PROJECT_CATEGORY_INFO[value];
                const isSelected = projectCategory === value;
                return (
                  <label
                    key={value}
                    htmlFor={`category-${value}`}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 transition-all ${
                      isSelected
                        ? "border-brand bg-brand/5 ring-brand/20 shadow-sm ring-2 dark:bg-brand/10"
                        : "border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <input
                      id={`category-${value}`}
                      type="radio"
                      name="projectCategoryChoice"
                      value={value}
                      checked={isSelected}
                      onChange={() => setProjectCategory(value)}
                      className="accent-brand mt-0.5 size-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {info.label}
                      </span>
                      <span className="block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {info.tagline}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field label="Proje Başlığı" htmlFor="title">
            <TextInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Kurumsal Web Sitesi Tasarım & Geliştirme"
            />
          </Field>

          <Field
            label="İşin Kapsamı & Açıklaması"
            htmlFor="scopeOfWork"
            hint="İki tarafın imzalayacağı sözleşme metni. Teslim edilecek işlerin çerçevesini açıkça belirtin."
          >
            <TextArea
              id="scopeOfWork"
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              rows={5}
              placeholder="Proje kapsamında yapılacak işler, teknik gereksinimler ve genel şartlar..."
            />
          </Field>

          <Field
            label="Proje Bedeli (₺)"
            htmlFor="projectAmount"
            hint="Taraflar arasında doğrudan ödenecek brüt proje bedeli. Lancerix bu tutardan pay almaz."
          >
            <TextInput
              id="projectAmount"
              value={projectAmount}
              onChange={(e) => setProjectAmount(e.target.value)}
              placeholder="Örn: 50.000,00"
            />
          </Field>

          <Field
            label="Planlanan İş Başlangıç Tarihi"
            htmlFor="plannedStartDate"
            hint="İki taraf da bu tarihi onayladığında iş resmi olarak başlar."
          >
            <TextInput
              id="plannedStartDate"
              type="date"
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
            />
          </Field>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setStep(0)} className={BACK_BUTTON}>
              &larr; Geri
            </button>
            <button
              type="button"
              disabled={title.trim().length < 3 || scopeOfWork.trim().length < 20 || projectAmount.trim() === ""}
              onClick={() => setStep(2)}
              className={NEXT_BUTTON}
            >
              Devam Et &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2 — İş Akışı & Kriterler ═══ */}
      {step === 2 && (
        <div className="fade-in flex max-w-3xl flex-col gap-8">

          {/* ── Workflow Phases ── */}
          <fieldset className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <legend className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                İş Akışı (Fazlar)
              </legend>
              <p className="max-w-[60ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Projeyi aşamalara bölün. Her faz tamamlandığında işaretlenecek ve müşteriniz ilerlemeyi takip edecek.
              </p>
            </div>

            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className="relative flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-zinc-950 dark:text-zinc-50">
                    <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 text-xs font-extrabold text-brand">
                      {index + 1}
                    </span>
                    Faz #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhases((p) => p.filter((r) => r.id !== phase.id))}
                    className="text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg px-2 py-1 transition-colors dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    Kaldır
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Field label="Faz Başlığı" htmlFor={`phase-title-${phase.id}`}>
                      <TextInput
                        id={`phase-title-${phase.id}`}
                        value={phase.title}
                        onChange={(e) => updatePhase(phase.id, "title", e.target.value)}
                        placeholder="Örn: Tasarım Onayı"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="Tahmini Süre (gün)" htmlFor={`phase-days-${phase.id}`}>
                      <TextInput
                        id={`phase-days-${phase.id}`}
                        value={phase.estimatedDays}
                        onChange={(e) => updatePhase(phase.id, "estimatedDays", e.target.value)}
                        placeholder="Örn: 7"
                        inputMode="numeric"
                        maxLength={3}
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Açıklama (İsteğe Bağlı)" htmlFor={`phase-desc-${phase.id}`}>
                  <TextArea
                    id={`phase-desc-${phase.id}`}
                    value={phase.description}
                    onChange={(e) => updatePhase(phase.id, "description", e.target.value)}
                    rows={2}
                    placeholder="Bu fazda neler yapılacak?"
                  />
                </Field>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setPhases((p) => [...p, blankPhase((p.at(-1)?.id ?? 0) + 1)])}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900 transition-colors"
            >
              <svg className="size-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              + Yeni Faz Ekle
            </button>
          </fieldset>

          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Kabul kriterlerini müşteri belirler — sözleşmeyi gönderdikten sonra
            müşteri, imzalamadan önce kabul kriterlerini kendisi girecek.
          </p>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setStep(1)} className={BACK_BUTTON}>
              &larr; Geri
            </button>
            <form action={previewAction} onSubmit={() => setStep(3)}>
              <DraftFields {...draft} />
              <SubmitButton pendingLabel="Hazırlanıyor...">Önizle &rarr;</SubmitButton>
            </form>
          </div>
        </div>
      )}

      {/* ═══ STEP 3 — Önizleme & Gönder ═══ */}
      {step === 3 && (
        <div className="fade-in flex max-w-3xl flex-col gap-6">
          {preview.error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {preview.error}
            </p>
          )}

          {preview.document && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  📄 Sözleşme Önizlemesi
                </p>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
                  Hazır
                </span>
              </div>
              <pre className="max-h-[30rem] overflow-auto rounded-2xl border border-zinc-200/80 bg-zinc-900 p-6 text-xs leading-relaxed font-mono whitespace-pre-wrap text-zinc-100 shadow-inner dark:border-zinc-800">
                {preview.document}
              </pre>
            </>
          )}

          {/* Phase summary */}
          {phases.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/80">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 mb-3">
                📋 İş Akışı ({phases.length} Faz)
              </h3>
              <ol className="flex flex-col gap-2">
                {phases.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-extrabold text-brand">
                      {i + 1}
                    </span>
                    <span className="font-medium">{p.title}</span>
                    {p.estimatedDays && (
                      <span className="text-xs text-zinc-400">~{p.estimatedDays} gün</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {plannedStartDate && (
            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-4 dark:border-indigo-800/60 dark:bg-indigo-950/30">
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                📅 Planlanan Başlangıç: <strong>{plannedStartDate}</strong>
                <span className="block mt-1 text-xs font-normal text-indigo-600/80 dark:text-indigo-400/80">
                  İki taraf da bu tarihi onayladığında iş resmi olarak başlar.
                </span>
              </p>
            </div>
          )}

          <FormFeedback state={state} />

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setStep(2)} className={BACK_BUTTON}>
              &larr; Geri
            </button>
            <form action={action}>
              <DraftFields {...draft} />
              <SubmitButton pendingLabel="Oluşturuluyor...">
                Sözleşmeyi Oluştur
              </SubmitButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
