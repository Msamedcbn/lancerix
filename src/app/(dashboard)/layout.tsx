import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";
import { requireSession, type UserRole } from "@/lib/auth/session";

/**
 * One nav per role. The areas mirror the split in CLAUDE.md: a freelancer sees
 * what they are owed, a client sees what they have to fund or approve, and an
 * admin sees the two things only an admin may touch -- disputes and the ledger.
 */
const NAV: Record<UserRole, readonly NavItem[]> = {
  FREELANCER: [
    { href: "/freelancer", label: "Projeler" },
    { href: "/freelancer/earnings", label: "Kazanç" },
    { href: "/freelancer/invoices", label: "Makbuzlar" },
    { href: "/freelancer/settings", label: "Ayarlar" },
  ],
  CLIENT: [
    { href: "/client", label: "Ödemeler" },
    { href: "/client/approvals", label: "Onaylar" },
    { href: "/client/invoices", label: "Faturalar" },
    { href: "/client/company", label: "Şirket" },
  ],
  ADMIN: [
    { href: "/admin", label: "İtirazlar" },
    { href: "/admin/audit", label: "Kayıt defteri" },
  ],
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const nav = NAV[session.role];

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      {/* The header is the only sticky layer in the app, so it is the only
          place a z-index is justified. */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link
            href={nav[0]!.href}
            className="py-3 text-[0.95rem] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            Lancerix
          </Link>

          <DashboardNav items={nav} />

          <div className="ml-auto flex items-center gap-3 py-3">
            <span className="hidden max-w-[18ch] truncate text-sm text-zinc-500 sm:inline dark:text-zinc-400">
              {session.fullName}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
