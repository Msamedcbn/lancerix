"use client";

import { useActionState } from "react";

import { saveCompany, type FormState } from "@/app/(dashboard)/actions";
import { Field, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

export type CompanyValues = {
  id: string;
  legal_name: string;
  vkn: string | null;
  tax_office: string | null;
  address: string | null;
} | null;

export function CompanyForm({ company }: Readonly<{ company: CompanyValues }>) {
  const [state, action] = useActionState(saveCompany, INITIAL);

  return (
    <form action={action} className="flex max-w-md flex-col gap-5">
      <input type="hidden" name="companyId" value={company?.id ?? ""} />

      <Field label="Ticaret unvanı" htmlFor="legalName">
        <TextInput
          id="legalName"
          name="legalName"
          defaultValue={company?.legal_name ?? ""}
          required
        />
      </Field>

      <Field
        label="VKN"
        htmlFor="vkn"
        hint="On hane. Fatura kesilmeye başlanmadan önce gerekir, QA testi için şart değil. Kontrol algoritması hem burada hem veritabanında doğrulanır."
      >
        <TextInput
          id="vkn"
          name="vkn"
          defaultValue={company?.vkn ?? ""}
          inputMode="numeric"
          maxLength={10}
        />
      </Field>

      <Field
        label="Vergi dairesi"
        htmlFor="taxOffice"
        hint="Fatura kesilmeye başlanmadan önce gerekir."
      >
        <TextInput
          id="taxOffice"
          name="taxOffice"
          defaultValue={company?.tax_office ?? ""}
        />
      </Field>

      <Field
        label="Fatura adresi"
        htmlFor="address"
        hint="Faturada basılacağı şekliyle, açık adres. Fatura kesilmeye başlanmadan önce gerekir."
      >
        <TextInput
          id="address"
          name="address"
          defaultValue={company?.address ?? ""}
        />
      </Field>

      <FormFeedback state={state} />
      <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
        {company ? "Şirketi güncelle" : "Şirket ekle"}
      </SubmitButton>
    </form>
  );
}
