"use client";

import {
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle2,
  Contact,
  CreditCard,
  FileText,
  ListChecks,
  LogOut,
  Receipt,
  ScrollText,
  Settings,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A string key, not a component reference: a Server Component may pass this
 * NavItem to the client, but it cannot pass a lucide component object across
 * that boundary directly -- only plain data survives serialization. The
 * client-only ICONS map below is what turns the key back into a component.
 */
export type NavIcon =
  | "briefcase"
  | "wallet"
  | "receipt"
  | "settings"
  | "credit-card"
  | "check-circle"
  | "file-text"
  | "building"
  | "list-checks"
  | "users"
  | "contact"
  | "alert-triangle"
  | "scroll"
  | "user";

export type NavItem = { href: Route; label: string; icon: NavIcon };

const ICONS: Record<NavIcon, typeof Briefcase> = {
  briefcase: Briefcase,
  wallet: Wallet,
  receipt: Receipt,
  settings: Settings,
  "credit-card": CreditCard,
  "check-circle": CheckCircle2,
  "file-text": FileText,
  building: Building2,
  "list-checks": ListChecks,
  users: Users,
  contact: Contact,
  "alert-triangle": AlertTriangle,
  scroll: ScrollText,
  user: UserRound,
};

/**
 * The primary navigation, in two bodies sharing one item list.
 *
 * Desktop keeps a pinned left rail -- a mouse has room to spare. A phone does
 * not, and a drawer a thumb has to summon before every move between sections
 * is friction a native app would never ask for; a bottom tab bar puts every
 * top-level destination one tap away, which is why the mobile body is a bar,
 * not a collapsed copy of the rail.
 */
export function Sidebar({
  items,
  header,
  footer,
  signOutAction,
}: Readonly<{
  items: readonly NavItem[];
  header: ReactNode;
  footer: ReactNode;
  signOutAction: () => Promise<void>;
}>) {
  const pathname = usePathname();

  // The single most specific match, not every prefix match: "/freelancer" is
  // a prefix of "/freelancer/settings" too, so a naive startsWith check lit
  // up both "Projeler" and "Ayarlar" at once. Picking the longest matching
  // href leaves exactly one item active.
  const activeHref = items.reduce<Route | null>((best, item) => {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matches) return best;
    if (!best || item.href.length > best.length) return item.href;
    return best;
  }, null);
  const isActive = (href: Route) => href === activeHref;

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/80">
        {header}
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Çıkış"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            <LogOut className="size-[1.1rem]" />
          </button>
        </form>
      </div>

      <aside className="sticky top-0 z-30 hidden h-dvh w-72 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div className="px-5 py-5">{header}</div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = ICONS[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-brand-muted text-brand font-medium"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <Icon
                  className={`size-[1.05rem] shrink-0 ${active ? "" : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"}`}
                  aria-hidden
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">{footer}</div>
      </aside>

      {/* Mobile: a full-width tab bar. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-zinc-200 bg-white/95 backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = ICONS[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <Icon
                className={`size-5 ${active ? "text-brand" : "text-zinc-400 dark:text-zinc-500"}`}
                aria-hidden
              />
              <span
                className={`max-w-full truncate px-1 text-[0.65rem] leading-none ${
                  active ? "text-brand font-medium" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
