import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { kurus, listMilestones } from "@/lib/data/contracts";

export default async function ClientPaymentsPage() {
  const session = await requireRole("CLIENT");
  const waiting = await listMilestones(["AWAITING_PAYMENT"], "client", session.userId);

  const total = waiting.reduce(
    (sum, m) => sum + kurus(m.client_charge_kurus, "client_charge_kurus"),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Payments"
        subtitle="Milestones waiting to be funded"
      />

      {waiting.length === 0 ? (
        <EmptyState
          title="Nothing to fund"
          description="Milestones waiting to be funded appear here with the contract amount, the service fee added on top, and the total to transfer into escrow."
        />
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">
                Total to transfer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Money kurus={total} className="text-2xl font-semibold" />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {waiting.map((m) => (
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
                    {m.contract.reference} &middot; {m.counterpartyName}
                  </p>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-1 text-sm sm:grid-cols-3">
                    <div className="flex justify-between sm:pr-6">
                      <dt className="text-muted-foreground">Contract amount</dt>
                      <dd>
                        <Money kurus={m.gross_amount_kurus} />
                      </dd>
                    </div>
                    <div className="flex justify-between sm:px-3">
                      <dt className="text-muted-foreground">Service fee</dt>
                      <dd>
                        <Money
                          kurus={kurus(m.platform_fee_kurus, "platform_fee_kurus")}
                        />
                      </dd>
                    </div>
                    <div className="flex justify-between font-medium sm:pl-6">
                      <dt>You transfer</dt>
                      <dd>
                        <Money
                          kurus={kurus(m.client_charge_kurus, "client_charge_kurus")}
                        />
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Funding is deliberately not a button. A milestone only becomes
              IN_PROGRESS when a verified provider webhook says the money is
              actually held, which is the whole point of escrow. */}
          <p className="text-muted-foreground text-sm">
            Funding is confirmed by the payment provider, not by clicking here.
            A milestone starts only once the money is genuinely held.
          </p>
        </>
      )}
    </div>
  );
}
