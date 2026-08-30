import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function AdminAuditPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title="Audit log" subtitle={`Every escrow transition, append-only`} />
      <EmptyState
        title="No transitions recorded"
        description="Every status change writes a ledger row in the same transaction, with the full money split snapshotted. Rows are never updated or deleted, so this list only ever grows."
      />
    </div>
  );
}
