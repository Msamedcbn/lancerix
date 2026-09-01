import type { ReactNode } from "react";

/**
 * The heading every dashboard page opens with.
 * Features clean typographic hierarchy and an optional action container.
 */
export function PageHeading({
  title,
  subtitle,
  action,
}: Readonly<{ title: string; subtitle?: ReactNode; action?: ReactNode }>) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
      <div className="max-w-[58ch]">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
          {title}
        </h1>
        {subtitle ? (
          <div className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/**
 * An elevated empty state card with dashed border, icon container, and action.
 */
export function EmptyState({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children?: ReactNode }>) {
  return (
    <div className="fade-in group relative overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200/80 bg-zinc-50/50 p-8 sm:p-12 text-center dark:border-zinc-800/80 dark:bg-zinc-900/20">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-brand/20">
        <svg
          aria-hidden="true"
          className="size-6 text-brand"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-[50ch] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {children ? <div className="mt-6 flex justify-center">{children}</div> : null}
    </div>
  );
}

/**
 * A KPI Metric Card with subtle gradient background and tabular figure display.
 */
export function Stat({
  label,
  value,
  hint,
}: Readonly<{
  label: string;
  value: ReactNode;
  hint?: string;
}>) {
  return (
    <div className="fade-in relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/30 to-zinc-100/50 p-6 shadow-sm dark:border-zinc-800/80 dark:from-zinc-900/90 dark:via-zinc-900/50 dark:to-zinc-950">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <span className="size-2 rounded-full bg-brand animate-pulse" />
      </div>
      <p className="tnum mt-3 text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A responsive grid container for card-based lists.
 */
export function Rows({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">{children}</div>;
}

/**
 * An elevated interactive card container with hover lift, gradient border glow, and transition effects.
 */
export function Row({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="fade-in group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:hover:border-brand/40 dark:hover:shadow-zinc-950/50">
      {children}
    </div>
  );
}

/**
 * A glassmorphic panel container for dedicated sections like documents, signature blocks, and forms.
 */
export function Panel({
  title,
  action,
  children,
}: Readonly<{ title?: string; action?: ReactNode; children: ReactNode }>) {
  return (
    <section className="fade-in relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:shadow-zinc-950/40">
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {title}
            </h2>
          ) : null}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

