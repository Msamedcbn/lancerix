import {
  AlertTriangle,
  Contact,
  FileText,
  ListChecks,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";

import { PageHeading, Rows, Row, EmptyState } from "@/components/page-shell";
import { QuickActions, type QuickAction } from "@/components/quick-actions";
import { requireRole } from "@/lib/auth/session";
import {
  listProfilesByRole,
  listReviewersWithProfile,
} from "@/lib/data/admin-users";
import { LEVEL_LABEL, type ReviewerLevel } from "@/lib/labels";

const TABS = [
  { key: "freelancer", label: "Freelancer'lar" },
  { key: "client", label: "Müşteriler" },
  { key: "qa", label: "QA Tester'lar" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const QUICK_ACTIONS: readonly QuickAction[] = [
  { label: "Kullanıcılar", icon: Contact, href: "/admin/users", tint: "emerald" },
  { label: "QA kuyruğu", icon: ListChecks, href: "/admin/qa-queue", tint: "sky" },
  { label: "Mühendisler", icon: Users, href: "/admin/reviewers", tint: "amber" },
  { label: "Faturalar", icon: FileText, href: "/admin/invoices", tint: "violet" },
  { label: "İtirazlar", icon: AlertTriangle, href: "/admin/disputes", tint: "rose" },
  { label: "Kayıt defteri", icon: ScrollText, href: "/admin/audit", tint: "indigo" },
];

export default async function AdminUsersPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ tab?: string }> }>) {
  await requireRole("ADMIN");
  const { tab: rawTab } = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : "freelancer";

  return (
    <>
      <QuickActions items={QUICK_ACTIONS} />

      <PageHeading
        title="Kullanıcılar"
        subtitle="Platformdaki herkes -- freelancer, müşteri ve QA tester -- tek dizinde."
      />

      <nav className="-mb-px flex items-center gap-1 overflow-x-auto border-b border-zinc-200/60 dark:border-zinc-800/60">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/users?tab=${t.key}`}
            className={`border-b-2 px-3 py-2.5 text-sm whitespace-nowrap ${
              tab === t.key
                ? "border-zinc-950 font-medium text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "qa" ? <QaTestersTab /> : <PeopleTab role={tab === "freelancer" ? "FREELANCER" : "CLIENT"} />}
    </>
  );
}

/** Joined within the last 7 days -- worth an admin's eye without digging into each profile. */
const NEW_MEMBER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function PeopleTab({ role }: Readonly<{ role: "FREELANCER" | "CLIENT" }>) {
  const people = await listProfilesByRole(role);

  if (people.length === 0) {
    return (
      <EmptyState
        title="Henüz kimse yok"
        description={role === "FREELANCER" ? "Kayıtlı bir freelancer yok." : "Kayıtlı bir müşteri yok."}
      />
    );
  }

  return (
    <Rows>
      {people.map((p) => {
        const isNew = Date.now() - Date.parse(p.created_at) < NEW_MEMBER_WINDOW_MS;
        return (
          <Link key={p.id} href={`/admin/users/${p.id}`}>
            <Row>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {p.full_name}
                    {isNew ? (
                      <span className="rounded-full bg-brand-muted text-brand px-1.5 py-0.5 text-[0.65rem] font-semibold">
                        Yeni
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {p.email} · {p.created_at.slice(0, 10)} tarihinde katıldı
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tnum rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    {p.contractCount} sözleşme
                  </span>
                  <span className="tnum font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    {p.public_id}
                  </span>
                </div>
              </div>
            </Row>
          </Link>
        );
      })}
    </Rows>
  );
}

async function QaTestersTab() {
  const reviewers = await listReviewersWithProfile();

  if (reviewers.length === 0) {
    return (
      <EmptyState title="Kadro boş" description="Henüz bir QA tester eklenmemiş.">
        <Link
          href="/admin/reviewers"
          className="bg-brand text-brand-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Mühendis ekle
        </Link>
      </EmptyState>
    );
  }

  return (
    <Rows>
      {reviewers.map((r) => {
        const row = (
          <Row>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {r.displayName}
                  {!r.hasAccount && (
                    <span className="ml-1.5 rounded-full bg-sky-50 px-1.5 py-0.5 text-[0.65rem] font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                      Hesabı yok
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {r.displayEmail}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    r.active
                      ? "bg-brand-muted text-brand"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {r.active ? "Aktif" : "Pasif"}
                </span>
                <span className="tnum text-xs text-zinc-500 dark:text-zinc-400">
                  {LEVEL_LABEL[r.level as ReviewerLevel] ?? r.level} · {r.years_experience}+ yıl
                </span>
              </div>
            </div>
          </Row>
        );

        // No profile_id means no user-detail page to link to (2026-09-06
        // four-role audit: a reviewer added by email alone).
        return r.profile_id ? (
          <Link key={r.id} href={`/admin/users/${r.profile_id}`}>
            {row}
          </Link>
        ) : (
          <div key={r.id}>{row}</div>
        );
      })}
    </Rows>
  );
}
