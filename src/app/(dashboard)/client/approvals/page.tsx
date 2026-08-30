import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { listMilestones } from "@/lib/data/contracts";

export default async function ClientApprovalsPage() {
  const session = await requireRole("CLIENT");
  const submitted = await listMilestones(["SUBMITTED"], "client", session.userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Approvals"
        subtitle="Delivered work waiting on you"
      />

      {submitted.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          description="A delivery lands here with the time left to object. If the window passes without an objection the payment is released automatically -- that clock is the point of the contract."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {submitted.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  <Link
                    href={`/contracts/${m.contract_id}`}
                    className="hover:underline"
                  >
                    {m.title}
                  </Link>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {m.contract.reference} &middot; delivered by {m.counterpartyName}
                  {m.submitted_at ? ` on ${m.submitted_at.slice(0, 10)}` : ""}
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground text-sm">
                  Approve or send it back on the contract page.
                </span>
                <Money kurus={m.gross_amount_kurus} className="font-medium" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
