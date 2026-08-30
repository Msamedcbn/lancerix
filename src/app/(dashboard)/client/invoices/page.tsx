import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { kurus, listMilestones } from "@/lib/data/contracts";

export default async function ClientInvoicesPage() {
  const session = await requireRole("CLIENT");
  const released = await listMilestones(["RELEASED"], "client", session.userId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Invoices"
        subtitle="Documents issued to your company"
      />

      {released.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="One invoice per released milestone, issued to the company on the contract, covering both the freelancer's fee and the platform's service fee."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {released.map((m) => (
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
                  {m.released_at ? ` · ${m.released_at.slice(0, 10)}` : ""}
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
                    <dt>Total paid</dt>
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
      )}
    </div>
  );
}
