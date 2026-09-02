import { Briefcase, Globe, MapPin } from "lucide-react";

import type { PublicProfile } from "@/lib/data/profile";
import { SERVICE_CATALOG } from "@/lib/validations/services";

const ROLE_LABEL: Record<PublicProfile["role"], string> = {
  FREELANCER: "Freelancer",
  CLIENT: "İşveren",
  ADMIN: "Yönetici",
};

/**
 * A profile as a counterparty sees it.
 *
 * Deliberately the same component on the public page and in the owner's own
 * dashboard: "profilini gör" is only an honest label if it renders the same
 * markup a stranger gets. Anything owner-only (edit form, IBAN state) sits
 * outside this component, not inside it behind a flag.
 */
export function ProfileCard({
  profile,
}: Readonly<{ profile: PublicProfile }>) {
  const memberSince = new Date(profile.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
  });

  return (
    <article className="flex flex-col gap-8">
      {/* Identity. Asymmetric on purpose: the avatar anchors left, the name
          and everything that qualifies it runs beside it. */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="bg-brand/10 text-brand flex size-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-semibold">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {profile.full_name}
            </h1>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              {ROLE_LABEL[profile.role]}
            </span>
          </div>

          {profile.headline ? (
            <p className="mt-1.5 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              {profile.headline}
            </p>
          ) : null}

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Lancerix ID</dt>
              <dd className="mono rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-medium tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {profile.public_id}
              </dd>
            </div>

            {profile.location ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                <dt className="sr-only">Konum</dt>
                <dd>{profile.location}</dd>
              </div>
            ) : null}

            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Katılım</dt>
              <dd>{memberSince} tarihinden beri</dd>
            </div>

            {profile.website_url ? (
              <div className="flex items-center gap-1.5">
                <Globe className="size-4" aria-hidden />
                <dt className="sr-only">Web sitesi</dt>
                <dd>
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noreferrer noopener nofollow"
                    className="hover:text-brand underline underline-offset-4"
                  >
                    {profile.website_url.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* The one number worth showing, and only because it is real: it
            counts FULFILLED contracts rather than a rating nobody has given
            yet. A fake five stars would cost more trust than it buys. */}
        <div className="shrink-0 rounded-2xl border border-zinc-200/80 px-5 py-4 text-center dark:border-zinc-800/80">
          <p className="tnum text-brand text-2xl font-semibold tabular-nums">
            {profile.completed_contracts}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            tamamlanan iş
          </p>
        </div>
      </header>

      {profile.services.length > 0 ? (
        <section>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Hizmetler
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {Object.values(SERVICE_CATALOG).map((group) => {
              const picked = group.items.filter((item) => profile.services.includes(item.value));
              if (picked.length === 0) return null;

              return (
                <div key={group.label}>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {group.label}
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-2">
                    {picked.map((item) => (
                      <li
                        key={item.value}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {profile.skills.length > 0 ? (
        <section>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Uzmanlıklar
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.bio ? (
        <section>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Hakkında
          </h2>
          <p className="mt-3 max-w-[65ch] text-sm leading-relaxed whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
            {profile.bio}
          </p>
        </section>
      ) : null}

      {profile.companies.length > 0 ? (
        <section>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Bağlı şirketler
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {profile.companies.map((company) => (
              <li
                key={company.id}
                className="flex items-center gap-2.5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <Briefcase className="size-4 shrink-0 text-zinc-400" aria-hidden />
                {company.legal_name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!profile.headline &&
      !profile.bio &&
      profile.skills.length === 0 &&
      profile.services.length === 0 &&
      profile.location === null ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Bu profil henüz doldurulmamış.
        </p>
      ) : null}
    </article>
  );
}
