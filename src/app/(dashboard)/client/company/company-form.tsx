"use client";

import { useActionState } from "react";

import { saveCompany, type FormState } from "@/app/(dashboard)/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: FormState = { error: null };

export type CompanyValues = {
  id: string;
  legal_name: string;
  vkn: string;
  tax_office: string;
  address: string;
} | null;

export function CompanyForm({ company }: Readonly<{ company: CompanyValues }>) {
  const [state, action] = useActionState(saveCompany, INITIAL);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="companyId" value={company?.id ?? ""} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="legalName">Registered name</Label>
        <Input
          id="legalName"
          name="legalName"
          defaultValue={company?.legal_name ?? ""}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="vkn">VKN</Label>
        <Input
          id="vkn"
          name="vkn"
          defaultValue={company?.vkn ?? ""}
          inputMode="numeric"
          maxLength={10}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="taxOffice">Tax office</Label>
        <Input
          id="taxOffice"
          name="taxOffice"
          defaultValue={company?.tax_office ?? ""}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Billing address</Label>
        <Input
          id="address"
          name="address"
          defaultValue={company?.address ?? ""}
          required
        />
      </div>

      <FormFeedback state={state} />
      <SubmitButton pendingLabel="Saving...">
        {company ? "Update company" : "Add company"}
      </SubmitButton>
    </form>
  );
}
