import { ProfileForm } from "@/app/(dashboard)/freelancer/settings/profile-form";
import { EmptyState, PageHeading } from "@/components/page-shell";
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
    <>
      <PageHeading title="Ayarlar" subtitle="Kimlik ve ödeme bilgilerin" />

      {missing.length > 0 ? (
        <EmptyState
          title={`${missing.join(" ve ")} eksik`}
          description="Bunlar olmadan da aşama teslim edilebilir ve onaylanabilir, ama dosyada olmadan para escrow hesabından çıkamaz."
        />
      ) : null}

      <ProfileForm
        fullName={profile?.full_name ?? session.fullName}
        tckn={profile?.tckn ?? null}
        iban={profile?.iban ?? null}
      />
    </>
  );
}
