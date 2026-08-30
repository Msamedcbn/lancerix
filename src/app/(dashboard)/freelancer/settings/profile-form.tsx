"use client";

import { useActionState } from "react";

import { saveProfile, type FormState } from "@/app/(dashboard)/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL: FormState = { error: null };

export function ProfileForm({
  fullName,
  tckn,
  iban,
}: Readonly<{ fullName: string; tckn: string | null; iban: string | null }>) {
  const [state, action] = useActionState(saveProfile, INITIAL);

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tckn">TCKN</Label>
        <Input
          id="tckn"
          name="tckn"
          defaultValue={tckn ?? ""}
          inputMode="numeric"
          maxLength={11}
          placeholder="11 digits"
        />
        <p className="text-muted-foreground text-sm">
          Required before a first payout, because the SMM is issued against it.
          The checksum is verified here and again in the database.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="iban">IBAN</Label>
        <Input
          id="iban"
          name="iban"
          defaultValue={iban ?? ""}
          placeholder="TR00 0000 0000 0000 0000 0000 00"
        />
        <p className="text-muted-foreground text-sm">
          Where released milestones are paid. Turkish IBANs only.
        </p>
      </div>

      <FormFeedback state={state} />
      <SubmitButton pendingLabel="Saving...">Save profile</SubmitButton>
    </form>
  );
}
