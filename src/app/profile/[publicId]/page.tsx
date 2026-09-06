import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProfileCard } from "@/components/profile-card";
import { getPublicProfile } from "@/lib/data/profile";
import { socialMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ publicId: string }> }>): Promise<Metadata> {
  const { publicId } = await params;
  const profile = await getPublicProfile(publicId);
  if (!profile) return { title: "Profil bulunamadı — Lancerix" };

  const title = `${profile.full_name} — Lancerix`;
  const description =
    profile.headline ?? `${profile.full_name} kullanıcısının Lancerix profili.`;

  return { title, description, ...socialMetadata({ title, description }) };
}

/**
 * A profile as a stranger sees it.
 *
 * Reads through public_profile(), a security-definer function returning named
 * columns, so this unauthenticated route needs no service-role key and cannot
 * widen to email/tckn/iban by accident. Renders the same ProfileCard the
 * owner previews in their dashboard.
 */
export default async function ProfilePage({
  params,
}: Readonly<{ params: Promise<{ publicId: string }> }>) {
  const { publicId } = await params;
  const profile = await getPublicProfile(publicId);

  if (!profile) notFound();

  return (
    <div className="fade-in rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md sm:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/80">
      <ProfileCard profile={profile} />
    </div>
  );
}
