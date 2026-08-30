import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function FreelancerEarningsPage() {
  await requireRole("FREELANCER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title="Earnings" subtitle={`What has been released, and what is still locked`} />
      <EmptyState
        title="Nothing released yet"
        description="Released milestones are listed here with the stopaj withheld and the net paid out. The platform fee is charged to the client and never comes out of this figure."
      />
    </div>
  );
}
