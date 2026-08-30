import { EmptyState, PageHeading } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/session";

export default async function FreelancerProjectsPage() {
  const session = await requireRole("FREELANCER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title="Projects" subtitle={`${session.email}`} />
      <EmptyState
        title="No projects yet"
        description="A project appears here once a contract is signed. Each of its milestones is funded and released on its own, so a delay on one does not hold up the others."
      />
    </div>
  );
}
