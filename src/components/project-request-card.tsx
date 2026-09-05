import { Money } from "@/components/money";
import type { ProjectRequestRow } from "@/lib/data/project-requests";

const STATUS_STYLE = {
  OPEN: {
    label: "Yanıt bekliyor",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300",
  },
  CONVERTED: {
    label: "Sözleşmeye dönüştü",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  DECLINED: {
    label: "Reddedildi",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
  },
} as const;

/**
 * One project request, from either side.
 *
 * The budget renders as whatever the client actually gave: a range, a single
 * bound, or nothing. Inventing the missing half ("50.000 ve üzeri" when they
 * only set a ceiling) would put words in their mouth on the one number the
 * conversation is most likely to turn on.
 */
export function ProjectRequestCard({
  request,
  counterpartyLabel,
  children,
}: Readonly<{
  request: ProjectRequestRow;
  counterpartyLabel: string;
  children?: React.ReactNode;
}>) {
  const status = STATUS_STYLE[request.status];

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {request.title}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {counterpartyLabel}: {request.counterpartyName}
            {request.counterpartyPublicId ? (
              <span className="ml-1.5 font-mono text-[0.7rem] tracking-wider">
                {request.counterpartyPublicId}
              </span>
            ) : null}
            {" · "}
            {request.created_at.slice(0, 10)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {request.brief}
      </p>

      {(request.budget_min_kurus !== null || request.budget_max_kurus !== null) && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Bütçe:{" "}
          {request.budget_min_kurus !== null && request.budget_max_kurus !== null ? (
            <>
              <Money kurus={request.budget_min_kurus} /> –{" "}
              <Money kurus={request.budget_max_kurus} />
            </>
          ) : request.budget_min_kurus !== null ? (
            <>
              <Money kurus={request.budget_min_kurus} /> ve üzeri
            </>
          ) : (
            <>
              en fazla <Money kurus={request.budget_max_kurus!} />
            </>
          )}
        </p>
      )}

      {request.status === "DECLINED" && request.decline_reason ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          Red gerekçesi: {request.decline_reason}
        </p>
      ) : null}

      {children}
    </article>
  );
}
