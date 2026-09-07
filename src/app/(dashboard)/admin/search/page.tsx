import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { searchAdmin } from "@/lib/data/admin-search";
import { ROLE_LABEL } from "@/lib/labels";

const REQUEST_STATUS_LABEL: Record<string, string> = {
  OPEN: "Yanıt bekliyor",
  CONVERTED: "Sözleşmeye dönüştü",
  DECLINED: "Reddedildi",
};

export default async function AdminSearchPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string }> }>) {
  await requireRole("ADMIN");
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchAdmin(q) : [];

  return (
    <>
      <PageHeading title="Arama" subtitle="Sözleşme referansı, e-posta veya Lancerix ID ile ara." />

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="LX-XXXXXXXX, proje başlığı, e-posta veya Lancerix ID"
          className="w-full max-w-md rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="bg-brand text-brand-foreground rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 active:scale-[0.98]"
        >
          Ara
        </button>
      </form>

      {q.trim() && results.length === 0 ? (
        <EmptyState title="Sonuç bulunamadı" description={`"${q}" için eşleşen bir kayıt yok.`} />
      ) : null}

      {results.length > 0 ? (
        <ul className="flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-200/80 bg-white/90 dark:divide-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/80">
          {results.map((r) => {
            if (r.kind === "contract") {
              return (
                <li key={`contract-${r.id}`} className="p-4">
                  <Link href={`/contracts/${r.id}`} className="hover:underline">
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {r.title}
                    </span>
                    <span className="ml-2 font-mono text-xs text-zinc-400">{r.reference}</span>
                  </Link>
                </li>
              );
            }

            if (r.kind === "request") {
              return (
                <li key={`request-${r.id}`} className="p-4">
                  {/* No standalone /admin/requests view exists yet -- this is
                      the only page a request can be opened on, freelancer- or
                      admin-viewed alike (requireSession(), not
                      requireRole("FREELANCER")). */}
                  <Link href={`/freelancer/requests/${r.id}`} className="hover:underline">
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {r.title}
                    </span>
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[0.65rem] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {REQUEST_STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={`profile-${r.id}`} className="p-4">
                <Link href={`/admin/users/${r.id}`} className="hover:underline">
                  <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {r.fullName}
                  </span>
                  <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">{r.email}</span>
                  <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[0.65rem] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {ROLE_LABEL[r.role as keyof typeof ROLE_LABEL] ?? r.role}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
