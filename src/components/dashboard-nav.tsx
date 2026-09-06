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
  Plus,
  Receipt,
  ScrollText,
  Search,
  Settings,
  UserPlus,
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
  | "user"
  | "layout-dashboard"
  | "search"
  | "inbox"
  | "user-plus"
  | "plus";

/**
 * `primary` marks the one item (per role, at most) that gets the floating
 * center button on mobile -- the create/start action a native app would
 * surface as a thumb-reachable FAB instead of burying it in the row.
 */
export type NavItem = {
  href: Route;
  label: string;
  icon: NavIcon;
  primary?: boolean;
};

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
  plus: Plus,
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

  // The mobile bar states the screen you're on, the way a native app's nav
  // bar does, instead of repeating the brand mark on every screen the way a
  // website header would. A drill-in page with no matching tab (e.g. a
  // contract detail) has no section to name, so it falls back to the brand.
  const activeItem = items.find((item) => item.href === activeHref);
  const ActiveIcon = activeItem ? ICONS[activeItem.icon] : null;

  // Its array position (not a fixed 50%) sets the floating button's
  // horizontal offset, so it lines up with the gap it leaves in the row
  // below regardless of how many items that role has.
  const primaryIndex = items.findIndex((item) => item.primary);
  const primaryItem = primaryIndex === -1 ? null : items[primaryIndex]!;
  const PrimaryIcon = primaryItem ? ICONS[primaryItem.icon] : null;

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border glass px-4 py-3 md:hidden">
        {ActiveIcon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <ActiveIcon className="size-4" aria-hidden />
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-[0.95rem] font-semibold tracking-tight text-foreground">
          {activeItem?.label ?? "Lancerix"}
        </span>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Çıkış"
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
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

      {/* Mobile: a full-width tab bar. More items than fit at a comfortable
          width (the admin nav has eight) scroll horizontally instead of
          squeezing every tab down to an unreadable, sub-44px sliver. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch overflow-x-auto border-t border-border glass md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          // .glass's own shadow drops downward, which is correct for the
          // sticky top bar but invisible here -- a shadow below a
          // bottom-pinned element falls past the viewport edge. This keeps
          // the glass highlight but points the elevation shadow up instead,
          // so the bar actually reads as floating above the content.
          boxShadow:
            "inset 0 1px 1px oklch(1 0 0 / 15%), 0 -8px 24px -4px oklch(0 0 0 / 12%)",
        }}
      >
        {items.map((item) => {
          if (item.primary) {
            // Left empty on purpose: the floating button below sits above
            // this exact slot. Rendered here (not skipped) so the remaining
            // tabs keep the same width as if it were a normal item, instead
            // of stretching to fill the gap.
            return (
              <span key={item.href} aria-hidden className="min-w-[4.25rem] flex-1 shrink-0" />
            );
          }

          const active = isActive(item.href);
          const Icon = ICONS[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-w-[4.25rem] flex-1 shrink-0 flex-col items-center gap-1 py-2 transition-transform active:scale-95"
            >
              <span
                className={`flex items-center justify-center rounded-xl px-3 py-1 transition-colors ${
                  active ? "bg-brand/10" : "bg-transparent"
                }`}
              >
                <Icon
                  className={`size-5 ${active ? "text-brand" : "text-muted-foreground"}`}
                  aria-hidden
                />
              </span>
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
      </nav>

      {/* A separate fixed element, not a flex child of the bar above: the
          bar needs overflow-x-auto for roles with more tabs than fit (see
          admin), and CSS has no way to let one axis scroll while the other
          stays visible on the same box -- setting overflow-y to visible
          there would be silently forced back to auto. Floating this on top
          instead sidesteps that entirely. */}
      {primaryItem && PrimaryIcon ? (
        <Link
          href={primaryItem.href}
          aria-label={primaryItem.label}
          className="fixed z-40 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30 ring-4 ring-background transition-transform active:scale-95 md:hidden"
          style={{
            left: `${((primaryIndex + 0.5) / items.length) * 100}%`,
            bottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
          }}
        >
          <PrimaryIcon className="size-6" aria-hidden />
        </Link>
      ) : null}
    </>
  );
}
