import type { Route } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import {
  getDashboardCounts,
  stalenessLevel,
  type DashboardSection,
} from "@/lib/data/admin-dashboard";

const CARD_TONE = {
  none: "border-zinc-200/80 dark:border-zinc-800/80",
  amber: "border-amber-300 dark:border-amber-800",
  red: "border-rose-300 dark:border-rose-800",
} as const;

const BADGE_TONE = {
  none: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  red: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
} as const;

/**
 * One dashboard card. Staleness coloring is opt-in per card (pass
 * `staleness={false}` for unclaimed invites, which TODOS.md's 2026-09-03
 * decision deliberately leaves un-thresholded -- no deadline exists for an
 * invite, so there is nothing honest to turn red about).
 */
function Card({
  title,
  href,
  section,
  staleness = true,
}: Readonly<{
  title: string;
  href: Route;
  section: DashboardSection;
  staleness?: boolean;
}>) {
  const level = section.ok && staleness ? stalenessLevel(section.oldestAt) : "none";

  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 rounded-2xl border bg-white/90 p-5 shadow-sm backdrop-blur-md transition-colors hover:bg-zinc-50/80 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 ${CARD_TONE[level]}`}
    >
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
      {section.ok ? (
        <div className="flex items-center gap-2">
          <span className="tnum text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            {section.count}
          </span>
          {level !== "none" ? (
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${BADGE_TONE[level]}`}>
              {level === "red" ? "7+ gündür bekliyor" : "3+ gündür bekliyor"}
            </span>
          ) : null}
        </div>
      ) : (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          — yüklenemedi
        </span>
      )}
    </Link>
  );
}

export default async function AdminHomePage() {
  await requireRole("ADMIN");
  const data = await getDashboardCounts();

  const allClear =
    data.qaQueue.ok &&
    data.pendingOrders.ok &&
    data.pendingInvoices.ok &&
    data.disputes.ok &&
    data.unclaimedInvites.ok &&
    data.qaQueue.count === 0 &&
    data.pendingOrders.count === 0 &&
    data.pendingInvoices.count === 0 &&
    data.disputes.count === 0 &&
    data.unclaimedInvites.count === 0;

  return (
    <>
      <PageHeading
        title="Panel"
        subtitle="Dikkat gerektiren her şey tek bakışta -- kalanı ilgili sayfada."
      />

      {allClear ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          🎉 Her şey temiz — dikkat gerektiren bir şey yok.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="QA kuyruğu" href="/admin/qa-queue" section={data.qaQueue} />
        <Card title="Bekleyen QA ödemesi" href="/admin/qa-queue" section={data.pendingOrders} />
        <Card title="Bekleyen fatura" href="/admin/invoices" section={data.pendingInvoices} />
        <Card title="İtirazlar" href="/admin/disputes" section={data.disputes} />
        <Card
          title="Bekleyen davetler"
          href="/admin/users"
          section={data.unclaimedInvites}
          staleness={false}
        />
      </div>
    </>
  );
}
