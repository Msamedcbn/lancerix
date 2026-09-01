import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicProfileForm } from "@/app/(dashboard)/profil/profile-form";
import { PageHeading, Panel } from "@/components/page-shell";
import { ProfileCard } from "@/components/profile-card";
import { requireSession } from "@/lib/auth/session";
import { getMyProfile, getPublicProfile } from "@/lib/data/profile";

/**
 * Your own profile, inside the dashboard.
 *
 * Before this the only route to it was the 8-character ID in the sidebar
 * footer, which opened the public page in a new tab where the header offered
 * "Giriş Yap" to someone already signed in. A user could not see what a
 * counterparty sees without leaving the product and looking like a stranger
 * to it.
 *
 * The preview renders the same ProfileCard the public page renders, read
 * through the same public_profile() function, so "başkaları böyle görüyor"
 * is a fact rather than a claim.
 */
export default async function MyProfilePage() {
  const session = await requireSession();
  const [mine, publicView] = await Promise.all([
    getMyProfile(session.userId),
    getPublicProfile(session.publicId),
  ]);

  if (!publicView) notFound();

  return (
    <>
      <PageHeading
        title="Profilim"
        subtitle="Sözleşme kurduğun tarafın seni nasıl gördüğü"
        action={
          <Link
            href={`/profile/${session.publicId}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Herkese açık sayfayı aç
          </Link>
        }
      />

      <Panel title="Başkaları böyle görüyor">
        <ProfileCard profile={publicView} />
      </Panel>

      <Panel title="Profili düzenle">
        <PublicProfileForm
          headline={mine.headline}
          bio={mine.bio}
          skills={mine.skills ?? []}
          location={mine.location}
          websiteUrl={mine.website_url}
          isFreelancer={mine.role === "FREELANCER"}
        />
      </Panel>
    </>
  );
}
