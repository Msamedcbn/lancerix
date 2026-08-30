import Link from "next/link";

import { ContractForm } from "@/app/(dashboard)/freelancer/new/contract-form";
import { EmptyState, PageHeading } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-6">
      <PageHeading
        title="New contract"
        subtitle="Draw up the agreement and its milestones"
      />

      {/* A warning rather than a block: the contract can be drafted and signed
          now, and only the payout at the end actually needs these. */}
      {missing.length > 0 ? (
        <EmptyState
          title={`${missing.join(" and ")} not on file`}
          description="You can draft and sign this contract now, but nothing can be paid out to you until your payout details are complete."
        >
          <Button asChild variant="secondary" size="sm">
            <Link href="/freelancer/settings">Add them</Link>
          </Button>
        </EmptyState>
      ) : null}

      <ContractForm
        feeBps={DEFAULT_PLATFORM_FEE_BPS}
        stopajBps={DEFAULT_STOPAJ_BPS}
      />
    </div>
  );
}
