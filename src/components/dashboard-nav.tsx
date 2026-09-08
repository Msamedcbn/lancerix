"use client";

import {
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle2,
  Contact,
  CreditCard,
  FileText,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MoreHorizontal,
  Radar,
  Receipt,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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
  | "user"
  | "layout-dashboard"
  | "search"
  | "inbox"
  | "user-plus"
  | "shield-check"
  | "radar";

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
  "layout-dashboard": LayoutDashboard,
  search: Search,
  inbox: Inbox,
  "user-plus": UserPlus,
  "shield-check": ShieldCheck,
  radar: Radar,
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

  // iOS/Android tab-bar convention: five slots, max. Past that, a bar either
  // scrolls (undiscoverable -- nothing hints there's more, as admin's eight
  // items just did) or squeezes every label into an unreadable sliver.
  // Neither beats the standard fix: keep the first four, fold the rest
  // behind a "More" sheet.
  const MAX_MOBILE_TABS = 5;
  const hasOverflow = items.length > MAX_MOBILE_TABS;
  const visibleItems = hasOverflow ? items.slice(0, MAX_MOBILE_TABS - 1) : items;
  const overflowItems = hasOverflow ? items.slice(MAX_MOBILE_TABS - 1) : [];
  const overflowActive = overflowItems.some((item) => isActive(item.href));

  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border glass px-4 py-3 md:hidden">
        {header}
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Çıkış"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-[1.1rem]" />
          </button>
        </form>
      </div>

      <aside className="sticky top-0 z-30 hidden h-dvh w-72 shrink-0 flex-col border-r border-border glass md:flex">
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
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon
                  className={`size-[1.05rem] shrink-0 ${active ? "" : "text-muted-foreground/80 group-hover:text-foreground/80"}`}
                  aria-hidden
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">{footer}</div>
      </aside>

      {/* Mobile: a full-width tab bar, capped at five slots (see
          MAX_MOBILE_TABS above) so it never needs to scroll or squeeze. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border glass md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const Icon = ICONS[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-w-[4.25rem] flex-1 shrink-0 flex-col items-center gap-1 py-2.5"
            >
              <Icon
                className={`size-5 ${active ? "text-brand" : "text-muted-foreground"}`}
                aria-hidden
              />
              <span
                className={`max-w-full truncate px-1 text-[0.65rem] leading-none ${
                  active ? "text-brand font-medium" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {hasOverflow ? (
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className="flex min-w-[4.25rem] flex-1 shrink-0 flex-col items-center gap-1 py-2.5"
          >
            <MoreHorizontal
              className={`size-5 ${overflowActive ? "text-brand" : "text-muted-foreground"}`}
              aria-hidden
            />
            <span
              className={`max-w-full truncate px-1 text-[0.65rem] leading-none ${
                overflowActive ? "text-brand font-medium" : "text-muted-foreground"
              }`}
            >
              Daha fazla
            </span>
          </button>
        ) : null}
      </nav>

      {hasOverflow && moreOpen ? (
        <>
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-30 md:hidden"
          />
          <div
            className="glass fixed inset-x-4 z-40 flex flex-col gap-0.5 rounded-2xl border border-border p-2 shadow-lg md:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.75rem)" }}
          >
            {overflowItems.map((item) => {
              const active = isActive(item.href);
              const Icon = ICONS[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    active ? "bg-brand-muted text-brand font-medium" : "text-foreground"
                  }`}
                >
                  <Icon className="size-[1.05rem] shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}
