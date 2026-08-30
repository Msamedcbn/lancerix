/**
 * Skeletons that match the shape of what is loading, not a spinner.
 *
 * A spinner says "wait"; a skeleton says "a list of five rows is arriving",
 * which stops the layout jumping when it does. The shimmer lives in a
 * pseudo-element so nothing here re-renders.
 */
export function SkeletonRows({ rows = 4 }: Readonly<{ rows?: number }>) {
  return (
    <div
      className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
      aria-hidden
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex w-full max-w-sm flex-col gap-2">
            <div className="skeleton h-4 w-2/3 rounded bg-zinc-100 dark:bg-zinc-900" />
            <div className="skeleton h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-900" />
          </div>
          <div className="skeleton h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonHeading() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <div className="skeleton h-7 w-48 rounded bg-zinc-100 dark:bg-zinc-900" />
      <div className="skeleton h-4 w-72 rounded bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}

export function SkeletonStats({ count = 3 }: Readonly<{ count?: number }>) {
  return (
    <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
        >
          <div className="skeleton h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="skeleton h-7 w-32 rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}
