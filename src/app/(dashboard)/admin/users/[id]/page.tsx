import { notFound } from "next/navigation";
import Link from "next/link";

import { Panel, PageHeading, EmptyState } from "@/components/page-shell";
import { ProjectRequestCard } from "@/components/project-request-card";
import { requireRole } from "@/lib/auth/session";
import { getProfileDetail } from "@/lib/data/admin-users";
import type { ProjectRequestRow } from "@/lib/data/project-requests";
import {
  LEVEL_LABEL,
  REFERRAL_SOURCE_LABEL,
  ROLE_LABEL,
  type ReferralSource,
  type ReviewerLevel,
} from "@/lib/labels";

import { UserNotes } from "./user-notes";
import {
  DeleteAccountForm,
  ProfileEditForm,
  RoleChangeForm,
  SuspensionControl,
} from "./user-management";

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

function RequestList({
  title,
  requests,
  counterpartyLabel,
}: Readonly<{
  title: string;
  requests: ProjectRequestRow[];
  counterpartyLabel: string;
}>) {
  return (
    <Panel title={title}>
      <div className="flex flex-col gap-4">
        {requests.map((r) => (
          <ProjectRequestCard key={r.id} request={r} counterpartyLabel={counterpartyLabel} />
        ))}
      </div>
    </Panel>
  );
}

export default async function AdminUserDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const session = await requireRole("ADMIN");
  const { id } = await params;
  const profile = await getProfileDetail(id);

  if (!profile) notFound();

  const isSelf = profile.id === session.userId;

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
            <span className="text-xs text-zinc-400">
              {new Date(profile.created_at).toLocaleDateString("tr-TR")} tarihinde katıldı
            </span>
            {profile.referral_source ? (
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                {REFERRAL_SOURCE_LABEL[profile.referral_source as ReferralSource] ?? profile.referral_source}
              </span>
            ) : null}
            {profile.suspended_at ? (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                Askıda
              </span>
            ) : null}
          </span>
        }
      />

      {profile.reviewer ? (
        <Panel title="QA Tester Profili">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {LEVEL_LABEL[profile.reviewer.level as ReviewerLevel] ?? profile.reviewer.level}
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

      {profile.role === "FREELANCER" && profile.requestsAsFreelancer.length > 0 ? (
        <RequestList
          title="Gelen proje talepleri"
          requests={profile.requestsAsFreelancer}
          counterpartyLabel="Müşteri"
        />
      ) : null}

      {profile.role === "CLIENT" && profile.requestsAsClient.length > 0 ? (
        <RequestList
          title="Gönderdiği proje talepleri"
          requests={profile.requestsAsClient}
          counterpartyLabel="Geliştirici"
        />
      ) : null}

      {profile.role === "ADMIN" ? (
        <EmptyState
          title="Bir yönetici hesabı"
          description="Bu profilin taraf olduğu bir sözleşme kavramı yok."
        />
      ) : null}

      {!isSelf ? (
        <Panel title="Hesap Yönetimi">
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Ad Soyad
              </p>
              <ProfileEditForm profileId={profile.id} fullName={profile.full_name} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Rol</p>
              <RoleChangeForm profileId={profile.id} currentRole={profile.role} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Askıya Alma
              </p>
              <SuspensionControl
                profileId={profile.id}
                suspendedAt={profile.suspended_at}
                suspensionReason={profile.suspension_reason}
              />
            </div>

            <div className="border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-800">
              <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Tehlikeli Bölge
              </p>
              <DeleteAccountForm profileId={profile.id} publicId={profile.public_id} />
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel title="Admin Notları">
        <UserNotes profileId={profile.id} notes={profile.notes} />
      </Panel>
    </>
  );
}
