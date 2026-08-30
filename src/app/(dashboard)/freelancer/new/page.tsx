import Link from "next/link";

import { ContractForm } from "@/app/(dashboard)/freelancer/new/contract-form";
import { EmptyState, PageHeading } from "@/components/page-shell";
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

  const missing = profile
    ? payoutBlockers({ tckn: profile.tckn, iban: profile.iban })
    : ["TCKN", "IBAN"];

  return (
    <>
      <PageHeading
        title="Yeni sözleşme"
        subtitle="Anlaşmayı ve aşamalarını kur"
      />

      {/* A warning rather than a block: the contract can be drafted and signed
          now, and only the payout at the end actually needs these. */}
      {missing.length > 0 ? (
        <EmptyState
          title={`${missing.join(" ve ")} dosyada yok`}
          description="Bu sözleşmeyi şimdi kurup imzalayabilirsin, ama ödeme bilgilerin tamamlanmadan sana hiçbir ödeme yapılamaz."
        >
          <Link
            href="/freelancer/settings"
            className="text-brand text-sm font-medium hover:underline"
          >
            Ayarlardan ekle
          </Link>
        </EmptyState>
      ) : null}

      <ContractForm
        feeBps={DEFAULT_PLATFORM_FEE_BPS}
        stopajBps={DEFAULT_STOPAJ_BPS}
      />
    </>
  );
}
