import { notFound } from "next/navigation";

import Link from "next/link";

import { MilestoneActions } from "@/app/(dashboard)/contracts/[id]/milestone-actions";
import { SignContract } from "@/app/(dashboard)/contracts/[id]/signing";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getContract, kurus, type Milestone } from "@/lib/data/contracts";
import type { Enums } from "@/lib/supabase/database.types";

type EscrowStatus = Enums<"escrow_status">;
type Side = "freelancer" | "client";

/**
 * Which moves each side may make, and what to call them.
 *
 * This mirrors can_actor_transition() in Postgres rather than deciding
 * anything: the database refuses an edge this list gets wrong, so the worst a
 * mismatch here can do is hide a button or show one that errors. Funding is
 * absent on purpose -- only a verified provider webhook may move a milestone
 * into IN_PROGRESS, never a button.
 */
function actionsFor(status: EscrowStatus, side: Side) {
  const moves: Array<{ to: EscrowStatus; label: string }> = [];

  if (side === "freelancer" && status === "DRAFT") {
    moves.push({ to: "AWAITING_PAYMENT", label: "Publish for funding" });
  }

  if (side === "client" && status === "SUBMITTED") {
    moves.push({ to: "COMPLETED", label: "Approve delivery" });
    moves.push({ to: "IN_PROGRESS", label: "Send back for rework" });
  }

  if (status === "DRAFT" || status === "AWAITING_PAYMENT") {
    moves.push({ to: "CANCELLED", label: "Cancel" });
  }

  return moves;
}

/** Funded work is the only work either party may escalate. */
const DISPUTABLE: readonly EscrowStatus[] = [
  "IN_PROGRESS",
  "SUBMITTED",
  "COMPLETED",
];

function Countdown({ deadline }: Readonly<{ deadline: string }>) {
  const days = Math.ceil(
    (Date.parse(deadline) - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <p className="text-sm font-medium text-amber-700">
      {days > 0
        ? `Accepted automatically in ${days} day${days === 1 ? "" : "s"}, on ${deadline.slice(0, 10)}, unless objected to.`
        : `The objection window closed on ${deadline.slice(0, 10)}. Acceptance runs on the next sweep.`}
    </p>
  );
}

function MilestoneCard({
  milestone,
  side,
}: Readonly<{ milestone: Milestone; side: Side }>) {
  const gross = milestone.gross_amount_kurus;
  const charge = kurus(milestone.client_charge_kurus, "client_charge_kurus");
  const fee = kurus(milestone.platform_fee_kurus, "platform_fee_kurus");
  const stopaj = kurus(milestone.tax_withholding_kurus, "tax_withholding_kurus");
  const net = kurus(milestone.freelancer_net_kurus, "freelancer_net_kurus");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">
            {milestone.sequence_no}. {milestone.title}
          </CardTitle>
          {milestone.due_date ? (
            <p className="text-muted-foreground text-sm">
              Due {milestone.due_date}
            </p>
          ) : null}
        </div>
        <StatusBadge status={milestone.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-1 text-sm sm:grid-cols-2">
          <div className="flex justify-between sm:pr-6">
            <dt className="text-muted-foreground">Contract amount</dt>
            <dd>
              <Money kurus={gross} />
            </dd>
          </div>
          <div className="flex justify-between sm:pl-6">
            <dt className="text-muted-foreground">Client pays</dt>
            <dd>
              <Money kurus={charge} />
            </dd>
          </div>
          <div className="flex justify-between sm:pr-6">
            <dt className="text-muted-foreground">Service fee</dt>
            <dd>
              <Money kurus={fee} />
            </dd>
          </div>
          <div className="flex justify-between sm:pl-6">
            <dt className="text-muted-foreground">Stopaj</dt>
            <dd>
              <Money kurus={stopaj} />
            </dd>
          </div>
          <div className="flex justify-between font-medium sm:pr-6">
            <dt>Freelancer receives</dt>
            <dd>
              <Money kurus={net} className="text-emerald-700" />
            </dd>
          </div>
        </dl>

        {milestone.status === "SUBMITTED" && milestone.auto_accept_at ? (
          <Countdown deadline={milestone.auto_accept_at} />
        ) : null}

        <MilestoneActions
          milestoneId={milestone.id}
          actions={actionsFor(milestone.status, side)}
          canDispute={DISPUTABLE.includes(milestone.status)}
          canDeliver={side === "freelancer" && milestone.status === "IN_PROGRESS"}
        />
      </CardContent>
    </Card>
  );
}

export default async function ContractPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const session = await requireSession();
  const contract = await getContract(id, session.userId);

  if (!contract) notFound();

  const side: Side =
    contract.freelancer_id === session.userId ? "freelancer" : "client";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          title={contract.title}
          subtitle={`${contract.reference} · with ${contract.counterpartyName}`}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={`/contracts/${contract.id}/record`}>Record</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Terms</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="whitespace-pre-wrap">{contract.scope_of_work}</p>
          <dl className="grid gap-1 sm:grid-cols-2">
            <div className="flex justify-between sm:pr-6">
              <dt className="text-muted-foreground">Service fee</dt>
              <dd>{contract.platform_fee_bps / 100}%</dd>
            </div>
            <div className="flex justify-between sm:pl-6">
              <dt className="text-muted-foreground">Stopaj</dt>
              <dd>{contract.stopaj_bps / 100}%</dd>
            </div>
          </dl>
          {contract.company ? (
            <p className="text-muted-foreground">
              Billed to {contract.company.legal_name} (VKN {contract.company.vkn}),{" "}
              {contract.company.tax_office}.
            </p>
          ) : null}
          <p className="text-muted-foreground">
            A delivery not objected to within {contract.objection_window_days}{" "}
            days is accepted automatically, and the acceptance is recorded.
          </p>
          <p className="text-muted-foreground text-xs">
            These rates and that window were frozen when the contract was drawn
            up. A later change to any of them does not reach this contract.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatures</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SignContract
            contractId={contract.id}
            alreadySigned={contract.signatures.some(
              (s) => s.signer_id === session.userId,
            )}
            otherPartySigned={contract.signatures.some(
              (s) => s.signer_id !== session.userId,
            )}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {contract.milestones.map((m) => (
          <MilestoneCard key={m.id} milestone={m} side={side} />
        ))}
      </div>
    </div>
  );
}
