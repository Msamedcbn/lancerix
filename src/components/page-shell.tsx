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
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-2 border-b border-border">
      <div className="max-w-[58ch]">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
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
    <div className="fade-in group relative overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-muted/30 p-8 sm:p-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
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
      <h3 className="mt-4 text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-[50ch] text-sm leading-relaxed text-muted-foreground">
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
    <div className="fade-in relative overflow-hidden rounded-2xl border border-border glass p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className="size-2 rounded-full bg-brand animate-pulse" />
      </div>
      <p className="tnum mt-3 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs font-medium text-muted-foreground">
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
    <div className="fade-in group relative overflow-hidden rounded-2xl border border-border glass p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
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
    <section className="fade-in relative overflow-hidden rounded-2xl border border-border glass p-6 shadow-sm">
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-base font-semibold tracking-tight text-foreground">
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

