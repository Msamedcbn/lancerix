import { notFound } from "next/navigation";
import Link from "next/link";

import { Panel, PageHeading, EmptyState } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { getProfileDetail } from "@/lib/data/admin-users";

import { UserNotes } from "./user-notes";

const ROLE_LABEL: Record<string, string> = {
  FREELANCER: "Freelancer",
  CLIENT: "Müşteri",
  ADMIN: "Yönetici",
};

const LEVEL_LABEL: Record<string, string> = {
  PRINCIPAL: "Principal / Lead",
  SENIOR: "Senior",
};

function ContractList({
  title,
  contracts,
}: Readonly<{
  title: string;
  contracts: { id: string; title: string; created_at: string }[];
}>) {
  return (
    <Panel title={title}>
      {contracts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Kayıt yok.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {contracts.map((c) => (
            <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
              <Link
                href={`/contracts/${c.id}`}
                className="flex items-center justify-between gap-3 text-sm hover:underline"
              >
                <span className="truncate text-zinc-950 dark:text-zinc-50">{c.title}</span>
                <span className="tnum shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {c.created_at.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default async function AdminUserDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requireRole("ADMIN");
  const { id } = await params;
  const profile = await getProfileDetail(id);

  if (!profile) notFound();

  return (
    <>
      <PageHeading
        title={profile.full_name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
            <span>{profile.email}</span>
            <span className="font-mono text-xs text-zinc-400">{profile.public_id}</span>
          </span>
        }
      />

      {profile.reviewer ? (
        <Panel title="QA Tester Profili">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {LEVEL_LABEL[profile.reviewer.level] ?? profile.reviewer.level}
            </span>
            <span className="tnum text-zinc-600 dark:text-zinc-300">
              {profile.reviewer.years_experience}+ yıl deneyim
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                profile.reviewer.active
                  ? "bg-brand-muted text-brand"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              {profile.reviewer.active ? "Aktif" : "Pasif"}
            </span>
          </div>
          {profile.reviewer.specialties.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.reviewer.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.7rem] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          {profile.reviewer.bio ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {profile.reviewer.bio}
            </p>
          ) : null}
        </Panel>
      ) : null}

      {profile.companies.length > 0 ? (
        <Panel title="Şirketleri">
          <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {profile.companies.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                <span className="text-zinc-950 dark:text-zinc-50">{c.legal_name}</span>
                <span className="tnum text-xs text-zinc-500 dark:text-zinc-400">
                  {c.vkn ?? "VKN yok"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {profile.role === "FREELANCER" ? (
        <ContractList title="Freelancer olduğu sözleşmeler" contracts={profile.contractsAsFreelancer} />
      ) : null}

      {profile.role === "CLIENT" ? (
        <ContractList title="Müşteri olduğu sözleşmeler" contracts={profile.contractsAsClient} />
      ) : null}

      {profile.role === "ADMIN" ? (
        <EmptyState
          title="Bir yönetici hesabı"
          description="Bu profilin taraf olduğu bir sözleşme kavramı yok."
        />
      ) : null}

      <Panel title="Admin Notları">
        <UserNotes profileId={profile.id} notes={profile.notes} />
      </Panel>
    </>
  );
}
