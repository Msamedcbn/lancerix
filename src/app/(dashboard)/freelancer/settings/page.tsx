import { ProfileForm } from "@/app/(dashboard)/freelancer/settings/profile-form";
import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";
import { payoutBlockers } from "@/lib/validations/profile";
import { createClient } from "@/lib/supabase/server";

export default async function FreelancerSettingsPage() {
  const session = await requireRole("FREELANCER");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, tckn, iban")
    .eq("id", session.userId)
    .single();

  const missing = profile
    ? payoutBlockers({ tckn: profile.tckn, iban: profile.iban })
    : ["TCKN", "IBAN"];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Settings"
        subtitle="Your identity and payout details"
      />

      {missing.length > 0 ? (
        <EmptyState
          title={`${missing.join(" and ")} still missing`}
          description="A milestone can be delivered and approved without these, but the money cannot leave escrow until they are on file."
        />
      ) : null}

      <ProfileForm
        fullName={profile?.full_name ?? session.fullName}
        tckn={profile?.tckn ?? null}
        iban={profile?.iban ?? null}
      />
    </div>
  );
}
