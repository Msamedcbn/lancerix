"use client";

import { useActionState, useState } from "react";

import {
  createProjectRequest,
  type FormState,
} from "@/app/(dashboard)/client/request-actions";
import { Field, TextArea, TextInput } from "@/components/field";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";

const INITIAL: FormState = { error: null };

/**
 * The client's way in.
 *
 * Addressed to one freelancer, by Lancerix ID or by one email -- the same two
 * ways a freelancer already addresses a client, in reverse. There is no
 * browse, no search and no "find me someone": this form assumes you already
 * know who you want to work with, which is what keeps it intake and not a job
 * board.
 */
export function ProjectRequestForm() {
  const [state, action] = useActionState(createProjectRequest, INITIAL);
  const [byEmail, setByEmail] = useState(false);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-5">
      {byEmail ? (
        <Field
          label="Geliştiricinin E-postası"
          htmlFor="freelancerEmail"
          hint="Geliştirici henüz Lancerix'te değilse bu adrese davet gider; hesabını açtığında talep ona bağlanır."
        >
          <TextInput
            id="freelancerEmail"
            name="freelancerEmail"
            type="email"
            placeholder="gelistirici@ornek.com"
          />
        </Field>
      ) : (
        <Field
          label="Geliştiricinin Lancerix ID'si"
          htmlFor="freelancerPublicId"
          hint="Profilindeki 8 haneli ID. Geliştiricinden isteyebilirsin."
        >
          <TextInput
            id="freelancerPublicId"
            name="freelancerPublicId"
            placeholder="Örn: A3K9F2B1"
            maxLength={8}
            className="font-mono uppercase tracking-widest"
          />
        </Field>
      )}

      <button
        type="button"
        onClick={() => setByEmail((v) => !v)}
        className="self-start text-xs font-semibold text-brand underline underline-offset-4"
      >
        {byEmail
          ? "← Geliştiricinin Lancerix ID'si var, onunla çağır"
          : "Geliştiricinin Lancerix hesabı yok mu? E-posta ile çağır"}
      </button>

      <Field label="Proje Başlığı" htmlFor="title">
        <TextInput id="title" name="title" placeholder="Örn: Kurumsal web sitesi yenileme" />
      </Field>

      <Field
        label="Ne Yaptırmak İstiyorsun?"
        htmlFor="brief"
        hint="Sözleşme metni değil, kısa bir brief. Kapsamı ve fazları geliştirici sonra sözleşmeye yazacak."
      >
        <TextArea
          id="brief"
          name="brief"
          rows={5}
          placeholder="Mevcut durumu, beklentini ve varsa takvimini birkaç cümleyle anlat..."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bütçe — Alt Sınır (₺, isteğe bağlı)" htmlFor="budgetMin">
          <TextInput id="budgetMin" name="budgetMin" placeholder="Örn: 50.000,00" />
        </Field>
        <Field label="Bütçe — Üst Sınır (₺, isteğe bağlı)" htmlFor="budgetMax">
          <TextInput id="budgetMax" name="budgetMax" placeholder="Örn: 80.000,00" />
        </Field>
      </div>

      <FormFeedback state={state} />

      <SubmitButton className="self-start" pendingLabel="Gönderiliyor...">
        Talebi Gönder
      </SubmitButton>
    </form>
  );
}
