"use client";

import { useActionState, useEffect, useState } from "react";
import { z } from "zod";

import { toggleQaReportShare, type FormState } from "@/app/(dashboard)/qa-actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { QaReport } from "@/lib/data/deliveries";

const INITIAL: FormState = { error: null };

const TONE: Record<string, string> = {
  PASS: "text-brand",
  FAIL: "text-rose-600 dark:text-rose-400",
};

const LABEL: Record<string, string> = {
  PASS: "Kriterler karşılandı",
  FAIL: "Kriterler karşılanmadı",
};

/**
 * report.results is a free-form jsonb column shared by every QA tier --
 * only the agent (src/lib/qa/agent.ts) currently populates `criteria`, an
 * admin/reviewer report has just `summary`. Parsed defensively rather than
 * cast: an older report predating this field, or a shape a future tier
 * writes differently, should render its summary instead of crashing the
 * panel.
 */
const criterionResultSchema = z.object({
  description: z.string(),
  met: z.enum(["PASS", "FAIL", "UNKNOWN"]),
  note: z.string(),
});
const reportResultsSchema = z.object({
  summary: z.string().optional(),
  criteria: z.array(criterionResultSchema).optional(),
});

const CRITERION_TONE: Record<string, string> = {
  PASS: "border-brand/30 bg-brand/5 text-brand",
  FAIL: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  UNKNOWN:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
};
const CRITERION_LABEL: Record<string, string> = { PASS: "Karşılandı", FAIL: "Karşılanmadı", UNKNOWN: "Belirsiz" };

/**
 * The report itself is always shown to both parties (unchanged from before
 * Faz E #1) -- only the share control is new, and only the freelancer who
 * owns the underlying contract ever sees it. A client viewing their own
 * delivery has no reason to publish or unpublish it; that is the
 * freelancer's portfolio choice, not something to negotiate per contract.
 */
export function QaReportSummary({
  report,
  contractId,
  isFreelancer,
}: Readonly<{
  report: QaReport;
  contractId: string;
  isFreelancer: boolean;
}>) {
  const [state, action] = useActionState(toggleQaReportShare, INITIAL);
  const [copied, setCopied] = useState(false);
  // window.location.origin doesn't exist during SSR -- setting it after
  // mount avoids a client/server render mismatch rather than guessing at
  // the origin server-side.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const tone = TONE[report.status] ?? "text-amber-700 dark:text-amber-400";
  const label = LABEL[report.status] ?? "Kısmen karşılandı";
  const shareUrl = report.share_token && origin ? `${origin}/report/${report.share_token}` : null;
  const results = reportResultsSchema.safeParse(report.results);
  const summary = results.success ? results.data.summary : undefined;
  const criteria = results.success ? results.data.criteria : undefined;

  return (
    <div className="rounded-xl border border-border p-4 dark:border-border/50">
      <p className={`text-sm font-medium ${tone}`}>{label}</p>
      <p className="tnum mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
        {report.generated_at.slice(0, 16).replace("T", " ")} · doğrulama raporu
      </p>
      {summary ? (
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 dark:text-muted-foreground">
          {summary}
        </p>
      ) : null}

      {criteria && criteria.length > 0 ? (
        <ol className="mt-3 flex flex-col gap-2">
          {criteria.map((c, i) => (
            <li
              key={i}
              className={`rounded-lg border px-3 py-2 text-xs ${CRITERION_TONE[c.met] ?? CRITERION_TONE.UNKNOWN}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">{c.description}</span>
                <span className="shrink-0 rounded-full bg-white/60 px-2 py-0.5 text-[0.65rem] font-medium dark:bg-black/20">
                  {CRITERION_LABEL[c.met] ?? c.met}
                </span>
              </div>
              {c.note ? <p className="mt-1 text-foreground/70 dark:text-foreground/60">{c.note}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}

      <p className="mt-3 font-mono text-[0.7rem] break-all text-muted-foreground">
        {report.document_sha256}
      </p>

      {isFreelancer ? (
        <div className="mt-3 border-t border-dashed border-border/60 pt-3">
          {shareUrl ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Bu rapor herkese açık bir linkte yayında. Portföyünde veya
                teklifinde paylaşabilirsin.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-[0.7rem] text-foreground"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {copied ? "Kopyalandı" : "Kopyala"}
                </button>
              </div>
              <form action={action}>
                <input type="hidden" name="reportId" value={report.id} />
                <input type="hidden" name="contractId" value={contractId} />
                <input type="hidden" name="share" value="false" />
                <SubmitButton
                  tone="secondary"
                  pendingLabel="Kaldırılıyor..."
                  className="self-start text-xs"
                >
                  Paylaşımı kaldır
                </SubmitButton>
              </form>
            </div>
          ) : (
            <form action={action} className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Bu raporu portföyünde paylaşmak ister misin? Sözleşme
                tutarı, taraf bilgileri veya iletişim bilgisi paylaşılmaz --
                yalnızca proje başlığı, kabul kriterleri ve sonuç.
              </p>
              <input type="hidden" name="reportId" value={report.id} />
              <input type="hidden" name="contractId" value={contractId} />
              <input type="hidden" name="share" value="true" />
              <SubmitButton
                tone="secondary"
                pendingLabel="Oluşturuluyor..."
                className="self-start text-xs"
              >
                Paylaşılabilir link oluştur
              </SubmitButton>
            </form>
          )}
          <FormFeedback state={state} />
        </div>
      ) : null}
    </div>
  );
}
