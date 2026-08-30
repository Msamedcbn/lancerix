"use client";

import { useActionState } from "react";

import { saveProfile, type FormState } from "@/app/(dashboard)/actions";
import { Field, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

export function ProfileForm({
  fullName,
  tckn,
  iban,
}: Readonly<{ fullName: string; tckn: string | null; iban: string | null }>) {
  const [state, action] = useActionState(saveProfile, INITIAL);

  return (
    <form action={action} className="flex max-w-md flex-col gap-5">
      <Field label="Ad soyad" htmlFor="fullName">
        <TextInput id="fullName" name="fullName" defaultValue={fullName} required />
      </Field>

      <Field
        label="TCKN"
        htmlFor="tckn"
        hint="İlk ödemeden önce zorunlu, çünkü serbest meslek makbuzu bu numara üzerine düzenlenir. Doğrulama hem burada hem veritabanında yapılır."
      >
        <TextInput
          id="tckn"
          name="tckn"
          defaultValue={tckn ?? ""}
          inputMode="numeric"
          maxLength={11}
          placeholder="11 hane"
        />
      </Field>

      <Field
        label="IBAN"
        htmlFor="iban"
        hint="Serbest kalan aşamaların yatırılacağı hesap. Yalnızca Türkiye IBAN'ı."
      >
        <TextInput
          id="iban"
          name="iban"
          defaultValue={iban ?? ""}
          placeholder="TR00 0000 0000 0000 0000 0000 00"
        />
      </Field>

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
        Kaydet
      </SubmitButton>
    </form>
  );
}
