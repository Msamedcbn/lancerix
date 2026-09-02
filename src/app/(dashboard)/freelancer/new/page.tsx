import { ContractForm } from "@/app/(dashboard)/freelancer/new/contract-form";
import { PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { DEFAULT_PLATFORM_FEE_BPS } from "@/lib/escrow/money";
import { DEFAULT_STOPAJ_BPS } from "@/lib/tax/stopaj";
import { payoutBlockers } from "@/lib/validations/profile";
import { createClient } from "@/lib/supabase/server";

export default async function NewContractPage() {
  const session = await requireRole("FREELANCER");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("tckn, iban")
    .eq("id", session.userId)
    .single();

  // Only meaningful for QA_PLUS_ESCROW, which pays out through the platform.
  // A QA_ONLY contract settles payment directly between the parties, so
  // TCKN/IBAN never block it -- ContractForm decides whether to show this.
  const missing = profile
    ? payoutBlockers({ tckn: profile.tckn, iban: profile.iban })
    : ["TCKN", "IBAN"];

  return (
    <>
      <PageHeading
        title="Yeni proje"
        subtitle="Anlaşmayı ve aşamalarını kur"
      />

      <ContractForm
        feeBps={DEFAULT_PLATFORM_FEE_BPS}
        stopajBps={DEFAULT_STOPAJ_BPS}
        payoutBlockers={missing}
      />
    </>
  );
}
