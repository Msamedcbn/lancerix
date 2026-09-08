"use client";

import { useActionState, useState } from "react";

import { createStandaloneCheck, type FormState } from "@/app/(dashboard)/standalone-qa-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { STANDALONE_CHECK_FEE_KURUS, type StandaloneCheckType } from "@/lib/validations/standalone-qa";

const INITIAL: FormState = { error: null };

const CHECK_TYPE_OPTIONS: { value: StandaloneCheckType; label: string; hint: string }[] = [
  { value: "ACCESSIBILITY", label: "Erişilebilirlik", hint: "WCAG 2.1 A/AA taraması (axe-core)." },
  { value: "PERFORMANCE", label: "Hız & Performans", hint: "Core Web Vitals -- LCP, FCP, CLS (Lighthouse)." },
  { value: "SEO_META", label: "SEO & Meta Uyumluluğu", hint: "Başlık, açıklama, OG/Twitter kartları, canonical, favicon." },
  { value: "VISUAL_OVERFLOW", label: "Görsel/Mobil Taşma", hint: "320/768/1440px genişliklerde yatay taşma kontrolü." },
  { value: "DEAD_LINKS", label: "Ölü/Kırık Link Taraması", hint: "Sayfadaki her linke istek atıp 404/kırık olanları listeler." },
  { value: "FORM_VALIDATION", label: "Form & Validasyon Bütünlüğü", hint: "Gönder butonu, zorunlu alanlar, e-posta tipi kontrolü." },
  { value: "INTERACTION_SCAN", label: "Genel Etkileşim & Hata Taraması", hint: "Formları doldurur, butonlara tıklar, konsol hatalarını yakalar." },
];

export function StandaloneCheckForm() {
  const [state, action] = useActionState(createStandaloneCheck, INITIAL);
  const [checkType, setCheckType] = useState<StandaloneCheckType>("ACCESSIBILITY");
  const feeDisplay = (STANDALONE_CHECK_FEE_KURUS / 100).toFixed(2).replace(".", ",");

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-border p-4 dark:border-border/50">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="targetUrl" className="text-sm font-medium text-foreground">
          Test edilecek link
        </label>
        <input
          id="targetUrl"
          name="targetUrl"
          type="url"
          required
          placeholder="https://ornek-site.com"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Test türü</span>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CHECK_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex flex-1 cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                checkType === option.value
                  ? "border-brand bg-brand/5"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-foreground">
                <input
                  type="radio"
                  name="checkType"
                  value={option.value}
                  checked={checkType === option.value}
                  onChange={() => setCheckType(option.value)}
                  className="accent-brand"
                />
                {option.label}
              </span>
              <span className="pl-5.5 text-xs text-muted-foreground">{option.hint}</span>
            </label>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {feeDisplay} ₺ -- sözleşme veya proje gerekmez, herhangi bir link.
      </p>
      <SubmitButton pendingLabel="Taranıyor..." className="self-start">
        Taramayı başlat
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}
