"use client";

import { useActionState } from "react";

import {
  updatePublicProfile,
  type FormState,
} from "@/app/(dashboard)/profil/actions";
import { Field, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

/** The public half of a profile: what a counterparty reads. */
export function PublicProfileForm({
  headline,
  bio,
  skills,
  location,
  websiteUrl,
  isFreelancer,
}: Readonly<{
  headline: string | null;
  bio: string | null;
  skills: string[];
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
        hint="Virgülle ayır. En fazla 12 tane."
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
