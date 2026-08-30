"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: Route; label: string };

/**
 * Isolated as a client component only because the active state needs the
 * pathname. Everything else in the shell stays on the server.
 *
 * The active item is marked with weight and a hairline rather than a filled
 * pill: at this size a filled background is louder than the page heading it
 * is supposed to be subordinate to.
 */
export function DashboardNav({ items }: Readonly<{ items: readonly NavItem[] }>) {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-3 py-3 text-sm whitespace-nowrap ${
              active
                ? "border-zinc-950 font-medium text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
