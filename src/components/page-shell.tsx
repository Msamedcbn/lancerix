import type { ReactNode } from "react";

/**
 * The heading every dashboard page opens with.
 *
 * Left-aligned and asymmetric on purpose: a centred heading in a working
 * interface wastes the eye's starting position. The action sits on the
 * opposite edge so the two never compete for the same scan.
 */
export function PageHeading({
  title,
  subtitle,
  action,
}: Readonly<{ title: string; subtitle?: string; action?: ReactNode }>) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[52ch]">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/**
 * An empty state that explains rather than apologises: what belongs here, and
 * what has to happen for it to fill. Deliberately not a card -- there is no
 * elevation to communicate when there is nothing to elevate.
 */
export function EmptyState({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children?: ReactNode }>) {
  return (
    <div className="reveal rounded-2xl border border-dashed border-zinc-200 px-6 py-10 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {title}
      </p>
      <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

/**
 * A figure without a box around it. Cards are for things that need elevation;
 * a number and its label need a baseline and some air.
 */
export function Stat({
  label,
  value,
  hint,
  index = 0,
}: Readonly<{
  label: string;
  value: ReactNode;
  hint?: string;
  index?: number;
}>) {
  return (
    <div
      className="reveal border-t border-zinc-200 pt-4 dark:border-zinc-800"
      style={{ "--i": index } as React.CSSProperties}
    >
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </p>
      <p className="tnum mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Rows separated by a hairline instead of wrapped in individual cards. At this
 * density a list of contracts reads faster as one surface than as a stack of
 * floating boxes.
 */
export function Rows({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {children}
    </div>
  );
}

export function Row({
  children,
  index = 0,
}: Readonly<{ children: ReactNode; index?: number }>) {
  return (
    <div
      className="reveal px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      style={{ "--i": index } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Used where elevation genuinely is the point: a signature block, a document. */
export function Panel({
  title,
  children,
  index = 0,
}: Readonly<{ title?: string; children: ReactNode; index?: number }>) {
  return (
    <section
      className="reveal rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_20px_40px_-24px_rgb(24_24_27/0.12)] dark:border-zinc-800 dark:bg-zinc-950"
      style={{ "--i": index } as React.CSSProperties}
    >
      {title ? (
        <h2 className="mb-4 text-sm font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
