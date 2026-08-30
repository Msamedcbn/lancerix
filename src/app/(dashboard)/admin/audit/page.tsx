import { EmptyState, PageHeading } from "@/components/empty-state";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth/session";
import { listLedger } from "@/lib/data/contracts";

export default async function AdminAuditPage() {
  await requireRole("ADMIN");
  const rows = await listLedger();

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Audit log"
        subtitle="Every escrow transition, append-only"
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No transitions recorded"
          description="Every status change writes a ledger row in the same transaction, with the full money split snapshotted. Rows are never updated or deleted, so this list only ever grows."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Transition</th>
                <th className="px-4 py-2 font-medium">By</th>
                <th className="px-4 py-2 text-right font-medium">Client paid</th>
                <th className="px-4 py-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="text-muted-foreground px-4 py-2 whitespace-nowrap">
                    {row.created_at.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      {row.from_status ? (
                        <StatusBadge status={row.from_status} />
                      ) : (
                        <span className="text-muted-foreground">new</span>
                      )}
                      <span className="text-muted-foreground">&rarr;</span>
                      <StatusBadge status={row.to_status} />
                    </span>
                  </td>
                  <td className="text-muted-foreground px-4 py-2">
                    {row.actor_kind}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Money kurus={row.client_charge_kurus} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Money kurus={row.freelancer_net_kurus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
