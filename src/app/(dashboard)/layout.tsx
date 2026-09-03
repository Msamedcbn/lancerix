import { Briefcase, Building2, ClipboardList } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { Sidebar, type NavItem } from "@/components/dashboard-nav";
import { PublicIdBadge } from "@/components/public-id-badge";
import { requireSession, type UserRole } from "@/lib/auth/session";

/**
 * One nav per role. The areas mirror the split in CLAUDE.md: a freelancer sees
 * what they are owed, a client sees what they have to fund or approve, and an
 * admin sees the Faz 1 QA desk -- the queue, the roster, the invoices --
 * plus the two things only an admin may touch: objections and the ledger.
 *
 * icon is a string key, not the lucide component itself: this file is a
 * Server Component and only plain data may cross into Sidebar, a Client
 * Component (see dashboard-nav.tsx for why).
 */
const NAV: Record<UserRole, readonly NavItem[]> = {
  FREELANCER: [
    { href: "/freelancer", label: "Projeler", icon: "briefcase" },
    { href: "/freelancer/earnings", label: "Kazanç", icon: "wallet" },
    { href: "/freelancer/invoices", label: "Makbuzlar", icon: "receipt" },
    { href: "/profil", label: "Profilim", icon: "user" },
    { href: "/freelancer/settings", label: "Ayarlar", icon: "settings" },
  ],
  CLIENT: [
    { href: "/client", label: "Ödemeler", icon: "credit-card" },
    { href: "/client/approvals", label: "Onaylar", icon: "check-circle" },
    { href: "/client/invoices", label: "Faturalar", icon: "file-text" },
    { href: "/client/company", label: "Şirket", icon: "building" },
    { href: "/profil", label: "Profilim", icon: "user" },
  ],
  ADMIN: [
    { href: "/admin", label: "Panel", icon: "layout-dashboard" },
    { href: "/admin/users", label: "Kullanıcılar", icon: "contact" },
    { href: "/admin/qa-queue", label: "QA kuyruğu", icon: "list-checks" },
    { href: "/admin/reviewers", label: "Mühendisler", icon: "users" },
    { href: "/admin/invoices", label: "Faturalar", icon: "file-text" },
    { href: "/admin/disputes", label: "İtirazlar", icon: "alert-triangle" },
    { href: "/admin/audit", label: "Kayıt defteri", icon: "scroll" },
  ],
};

const ROLE_ICON: Record<UserRole, typeof ClipboardList> = {
  FREELANCER: Briefcase,
  CLIENT: Building2,
  ADMIN: ClipboardList,
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const nav = NAV[session.role];
  const RoleIcon = ROLE_ICON[session.role];

  const header = (
    <Link href={nav[0]!.href} className="flex items-center gap-2.5">
      <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-lg">
        <RoleIcon className="size-4" aria-hidden />
      </span>
      <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
        Lancerix
      </span>
    </Link>
  );

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {session.fullName}
        </p>
        <div className="mt-1">
          <PublicIdBadge publicId={session.publicId} />
        </div>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
        >
          Çıkış
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-background md:flex">
      <Sidebar items={nav} header={header} footer={footer} signOutAction={signOut} />

      <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col gap-8 px-4 py-8 pb-28 sm:px-6 sm:py-12 md:pb-12">
        {children}
      </main>
    </div>
  );
}
