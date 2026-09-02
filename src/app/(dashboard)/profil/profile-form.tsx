"use client";

import { useActionState, useState } from "react";

import {
  updatePayoutInfo,
  updatePublicProfile,
  type FormState,
} from "@/app/(dashboard)/profil/actions";
import { Field, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { SERVICE_CATALOG } from "@/lib/validations/services";

const INITIAL: FormState = { error: null };

/**
 * Picking services by category, checkboxes grouped and collapsible.
 *
 * A flat list of ~40 items is a wall; grouping under the same six categories
 * a project is created in keeps the choice legible and lets a category with
 * nothing selected stay collapsed by default.
 */
function ServicesPicker({ selected }: Readonly<{ selected: Set<string> }>) {
  const [checked, setChecked] = useState(selected);

  const toggle = (value: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="services" value={[...checked].join(",")} />
      {Object.entries(SERVICE_CATALOG).map(([category, group]) => {
        const groupCount = group.items.filter((item) => checked.has(item.value)).length;

        return (
          <details
            key={category}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800"
            open={groupCount > 0}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {group.label}
              {groupCount > 0 ? (
                <span className="bg-brand-muted text-brand rounded-full px-2 py-0.5 text-xs font-semibold">
                  {groupCount}
                </span>
              ) : null}
            </summary>
            <div className="grid gap-2 border-t border-zinc-100 px-4 py-3 sm:grid-cols-2 dark:border-zinc-800">
              {group.items.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={checked.has(item.value)}
                    onChange={() => toggle(item.value)}
                    className="accent-brand size-4"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

/** The public half of a profile: what a counterparty reads. */
export function PublicProfileForm({
  headline,
  bio,
  skills,
  services,
  location,
  websiteUrl,
  isFreelancer,
}: Readonly<{
  headline: string | null;
  bio: string | null;
  skills: string[];
  services: string[];
  location: string | null;
  websiteUrl: string | null;
  isFreelancer: boolean;
}>) {
  const [state, action] = useActionState(updatePublicProfile, INITIAL);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <Field
        label="Başlık"
        htmlFor="headline"
        hint="Adının hemen altında görünür. Ne yaptığını tek cümlede söyle."
      >
        <TextInput
          id="headline"
          name="headline"
          defaultValue={headline ?? ""}
          maxLength={120}
          placeholder={
            isFreelancer
              ? "Örn: Kıdemli video editörü ve motion tasarımcı"
              : "Örn: E-ticaret şirketi, dijital pazarlama ekibi"
          }
        />
      </Field>

      <Field
        label="Uzmanlıklar"
        htmlFor="skills"
        hint="Virgülle ayır. En fazla 12 tane. Araçlar, yazılımlar vb. serbest metin."
      >
        <TextInput
          id="skills"
          name="skills"
          defaultValue={skills.join(", ")}
          placeholder={
            isFreelancer
              ? "Premiere Pro, After Effects, Renk düzeltme"
              : "E-ticaret, Perakende, B2B"
          }
        />
      </Field>

      {isFreelancer ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Hizmetler</p>
          <p className="-mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Verdiğin hizmet kategorilerini seç -- bir müşteri seni bunlara göre bulur.
          </p>
          <ServicesPicker selected={new Set(services)} />
        </div>
      ) : null}

      <Field
        label="Hakkında"
        htmlFor="bio"
        hint="Nasıl çalıştığın, hangi işleri aldığın. Uzun olabilir."
      >
        <TextArea
          id="bio"
          name="bio"
          rows={5}
          defaultValue={bio ?? ""}
          maxLength={2000}
          placeholder={
            isFreelancer
              ? "Hangi tür projeler aldığını, süreçini ve neyi iyi yaptığını anlat."
              : "Şirketinin ne yaptığını ve nasıl çalışmayı tercih ettiğini anlat."
          }
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Konum" htmlFor="location" hint="İsteğe bağlı.">
          <TextInput
            id="location"
            name="location"
            defaultValue={location ?? ""}
            maxLength={120}
            placeholder="İstanbul, Türkiye"
          />
        </Field>

        <Field label="Web sitesi" htmlFor="websiteUrl" hint="İsteğe bağlı.">
          <TextInput
            id="websiteUrl"
            name="websiteUrl"
            defaultValue={websiteUrl ?? ""}
            inputMode="url"
            placeholder="https://portfolyo.com"
          />
        </Field>
      </div>

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
        Profili kaydet
      </SubmitButton>
    </form>
  );
}

/**
 * Faturalandırma: the name a payout is made out to, TCKN, IBAN.
 *
 * Never shown to a counterparty. This is what a client or Jobtogo needs to
 * pay a freelancer correctly, so it is asked for directly rather than
 * inferred -- the same fields Jobtogo's own onboarding collects.
 */
export function PayoutInfoForm({
  fullName,
  tckn,
  iban,
  disabled = false,
}: Readonly<{
  fullName: string;
  tckn: string | null;
  iban: string | null;
  disabled?: boolean;
}>) {
  const [state, action] = useActionState(updatePayoutInfo, INITIAL);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <Field
        label="Ad Soyad"
        htmlFor="fullName"
        hint="Ödemenin yapılacağı isim. Banka hesabındaki adla birebir aynı olmalı."
      >
        <TextInput
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          maxLength={160}
          disabled={disabled}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="TC Kimlik No" htmlFor="tckn" hint="11 haneli.">
          <TextInput
            id="tckn"
            name="tckn"
            defaultValue={tckn ?? ""}
            inputMode="numeric"
            maxLength={11}
            placeholder="12345678901"
            disabled={disabled}
          />
        </Field>

        <Field label="IBAN" htmlFor="iban" hint="TR ile başlayan 26 karakter.">
          <TextInput
            id="iban"
            name="iban"
            defaultValue={iban ?? ""}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            disabled={disabled}
          />
        </Field>
      </div>

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Kaydediliyor..." disabled={disabled}>
        {disabled ? "Faz 2'de aktif olacak" : "Faturalandırma bilgilerini kaydet"}
      </SubmitButton>
    </form>
  );
}
