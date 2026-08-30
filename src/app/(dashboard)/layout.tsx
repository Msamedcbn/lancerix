import type { Route } from "next";
import Link from "next/link";
import {
  Building2,
  FileText,
  Gavel,
  LayoutDashboard,
  ReceiptText,
  ScrollText,
  UserCog,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { requireSession, type UserRole } from "@/lib/auth/session";

type NavItem = { href: Route; label: string; icon: LucideIcon };

/**
 * One nav per role. The areas mirror the split in CLAUDE.md: a freelancer sees
 * what they are owed, a client sees what they have to fund or approve, and an
 * admin sees the two things only an admin may touch -- disputes and the ledger.
 */
const NAV: Record<UserRole, readonly NavItem[]> = {
  FREELANCER: [
    { href: "/freelancer", label: "Projects", icon: LayoutDashboard },
    { href: "/freelancer/earnings", label: "Earnings", icon: Wallet },
    { href: "/freelancer/invoices", label: "Invoices", icon: ReceiptText },
    { href: "/freelancer/settings", label: "Settings", icon: UserCog },
  ],
  CLIENT: [
    { href: "/client", label: "Payments", icon: LayoutDashboard },
    { href: "/client/approvals", label: "Approvals", icon: FileText },
    { href: "/client/invoices", label: "Invoices", icon: ReceiptText },
    { href: "/client/company", label: "Company", icon: Building2 },
  ],
  ADMIN: [
    { href: "/admin", label: "Disputes", icon: Gavel },
    { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  ],
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const nav = NAV[session.role];

  return (
    <div className="min-h-dvh">
      <header className="flex h-14 items-center gap-6 border-b px-6">
        <Link href={nav[0]!.href} className="font-semibold tracking-tight">
          Lancerix
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Button key={href} asChild variant="ghost" size="sm">
              <Link href={href}>
                <Icon />
                {label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {session.fullName}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
