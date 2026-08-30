import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function AdminDisputesPage() {
  await requireRole("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title="Disputes" subtitle={`Milestones a party has escalated`} />
      <EmptyState
        title="No open disputes"
        description="A disputed milestone can only end in a release or a cancellation, and only an administrator may resolve it. Open disputes will be listed here with both parties' accounts."
      />
    </div>
  );
}
