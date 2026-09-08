"use client";

import { useActionState } from "react";

import { FormFeedback, SubmitButton } from "@/components/form-feedback";

import { addMonitoredSite, removeMonitoredSite, startMonitoring, type FormState } from "./actions";

const INITIAL: FormState = { error: null };

export function StartMonitoringButton({
  planId,
  label,
}: Readonly<{ planId: string; label: string }>) {
  const [state, action] = useActionState(startMonitoring, INITIAL);

  return (
    <form action={action} className="flex flex-col items-start gap-1.5">
      <input type="hidden" name="planId" value={planId} />
      <SubmitButton pendingLabel="Ödemeye yönlendiriliyor..." className="text-xs">
        {label}
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}

export function AddSiteForm({ subscriptionId }: Readonly<{ subscriptionId: string }>) {
  const [state, action] = useActionState(addMonitoredSite, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <label className="flex-1 text-xs text-muted-foreground">
        İzlenecek adres
        <input
          name="targetUrl"
          type="url"
          required
          placeholder="https://ornek.com"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <SubmitButton pendingLabel="Ekleniyor..." className="text-xs">
        Siteyi ekle
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}

export function RemoveSiteButton({ siteId }: Readonly<{ siteId: string }>) {
  const [state, action] = useActionState(removeMonitoredSite, INITIAL);

  return (
    <form action={action}>
      <input type="hidden" name="siteId" value={siteId} />
      <SubmitButton pendingLabel="Kaldırılıyor..." className="text-xs">
        Kaldır
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
