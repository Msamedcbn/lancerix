import type { Metadata } from "next";
import type { Route } from "next";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/(auth)/actions";
import { Sidebar, type NavItem } from "@/components/dashboard-nav";
import { PublicIdBadge } from "@/components/public-id-badge";
import { requireSession, type UserRole } from "@/lib/auth/session";

/** Every page behind this layout is one signed-in user's own data -- never a
 * page for a search result to send a stranger to. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const FREELANCER_NAV: readonly NavItem[] = [
  { href: "/freelancer" as Route, label: "Projeler & Sözleşmeler", icon: "briefcase", section: "HAKEMLİK & PROTOKOL" },
  { href: "/freelancer/new" as Route, label: "Yeni Proje / Şartname", icon: "file-text" },
  { href: "/freelancer/requests" as Route, label: "Gelen Talepler", icon: "inbox" },
  { href: "/freelancer/earnings" as Route, label: "Kazanç & Hak Ediş", icon: "wallet" },
  { href: "/freelancer/invoices" as Route, label: "Makbuzlar", icon: "receipt" },
  { href: "/dashboard" as Route, label: "Güvenlik Merkezi", icon: "shield-check", section: "GÜVENLİK & PENTEST" },
  { href: "/targets" as Route, label: "Hedefler & Varlıklar", icon: "globe" },
  { href: "/scans" as Route, label: "Denetim Taramaları", icon: "terminal" },
  { href: "/vulnerabilities" as Route, label: "Zafiyetler", icon: "shield-alert" },
  { href: "/izleme" as Route, label: "Sürekli İzleme", icon: "radar" },
  { href: "/profil" as Route, label: "Hesap & Ayarlar", icon: "user", section: "HESAP" },
];

const CLIENT_NAV: readonly NavItem[] = [
  { href: "/client" as Route, label: "Sözleşmeler & Ödemeler", icon: "credit-card", section: "HAKEMLİK & ONAY" },
  { href: "/client/approvals" as Route, label: "Teslimatlar & Onaylar", icon: "check-circle" },
  { href: "/client/requests" as Route, label: "Geliştirici Çağır", icon: "user-plus" },
  { href: "/client/company" as Route, label: "Şirket Bilgileri", icon: "building" },
  { href: "/client/invoices" as Route, label: "Faturalar", icon: "file-text" },
  { href: "/dashboard" as Route, label: "Güvenlik Merkezi", icon: "shield-check", section: "GÜVENLİK & PENTEST" },
  { href: "/targets" as Route, label: "Hedefler & Varlıklar", icon: "globe" },
  { href: "/scans" as Route, label: "Denetim Taramaları", icon: "terminal" },
  { href: "/izleme" as Route, label: "Sürekli İzleme", icon: "radar" },
  { href: "/profil" as Route, label: "Hesap & Ayarlar", icon: "user", section: "HESAP" },
];

const ADMIN_NAV: readonly NavItem[] = [
  { href: "/admin" as Route, label: "Yönetici Masası", icon: "layout-dashboard", section: "YÖNETİM" },
  { href: "/admin/analytics" as Route, label: "Analytics", icon: "trending-up" },
  { href: "/admin/disputes" as Route, label: "Uyuşmazlıklar & İtirazlar", icon: "alert-triangle" },
  { href: "/admin/qa-queue" as Route, label: "QA Kuyruğu", icon: "list-checks" },
  { href: "/admin/users" as Route, label: "Kullanıcılar", icon: "contact" },
  { href: "/freelancer" as Route, label: "Geliştirici Projeleri", icon: "briefcase", section: "HAKEMLİK & PROTOKOL" },
  { href: "/client" as Route, label: "İşveren Masası", icon: "credit-card" },
  { href: "/dashboard" as Route, label: "Güvenlik Merkezi", icon: "shield-check", section: "GÜVENLİK & PENTEST" },
  { href: "/targets" as Route, label: "Hedefler & Varlıklar", icon: "globe" },
  { href: "/scans" as Route, label: "Denetim Taramaları", icon: "terminal" },
  { href: "/vulnerabilities" as Route, label: "Zafiyetler", icon: "shield-alert" },
  { href: "/compliance" as Route, label: "SOC 2 & Uyumluluk", icon: "list-checks" },
  { href: "/site-kontrol" as Route, label: "Site Kontrolü", icon: "shield" },
  { href: "/profil" as Route, label: "Hesap & Ayarlar", icon: "user", section: "HESAP" },
];

const NAV: Record<UserRole, readonly NavItem[]> = {
  FREELANCER: FREELANCER_NAV,
  CLIENT: CLIENT_NAV,
  ADMIN: ADMIN_NAV,
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();
  const nav = NAV[session.role] || FREELANCER_NAV;

  const header = (
    <Link href={nav[0]!.href} className="flex items-center gap-2.5">
      <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
        <ShieldCheck className="size-4" aria-hidden />
      </span>
      <span className="font-display text-base font-extrabold tracking-tight text-foreground">
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
