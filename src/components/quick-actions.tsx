import type { Route } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const TINTS = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
} as const;

export type QuickAction = {
  label: string;
  icon: LucideIcon;
  href: Route;
  tint: keyof typeof TINTS;
};

/**
 * The mobile home screen's shortcut grid -- a Server Component (no hooks
 * needed), so unlike Sidebar it can take the lucide icon components directly
 * as props instead of a string key: this only ever renders from other Server
 * Components, so nothing here crosses the client-serialization boundary.
 *
 * Desktop already has the full sidebar a click away, so this is md:hidden --
 * it exists because a thumb on a phone reaches a home-screen tile faster than
 * it reaches the rail.
 */
export function QuickActions({ items }: Readonly<{ items: readonly QuickAction[] }>) {
  return (
    <div className="grid grid-cols-4 gap-x-3 gap-y-4 md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1.5 active:scale-[0.96]"
          >
            <span
              className={`flex size-12 items-center justify-center rounded-2xl text-white shadow-sm ${TINTS[item.tint]}`}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="text-center text-[0.7rem] leading-tight text-zinc-600 dark:text-zinc-300">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
