import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/page-shell";
import { ProjectRequestCard } from "@/components/project-request-card";
import { requireRole } from "@/lib/auth/session";
import { listOutgoingRequests } from "@/lib/data/project-requests";

import { ProjectRequestForm } from "./request-form";

export default async function ClientRequestsPage() {
  const session = await requireRole("CLIENT");
  const requests = await listOutgoingRequests(session.userId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title="Geliştirici çağır"
        subtitle="Birlikte çalıştığın geliştiriciyi Lancerix'e çağır. Talebi o sözleşmeye dönüştürür; kapsamı ve fazları yazan taraf o olur."
      />

      <ProjectRequestForm />

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          Gönderdiğin talepler
        </h2>

        {requests.length === 0 ? (
          <EmptyState
            title="Henüz talep göndermedin"
            description="Yukarıdaki formla geliştiricini çağırdığında talebin durumu burada görünür."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map((request) => (
              <ProjectRequestCard
                key={request.id}
                request={request}
                counterpartyLabel="Geliştirici"
              >
                {request.status === "CONVERTED" && request.contract_id ? (
                  <Link
                    href={`/contracts/${request.contract_id}`}
                    className="self-start text-xs font-semibold text-brand underline underline-offset-4"
                  >
                    Sözleşmeyi gör →
                  </Link>
                ) : null}
              </ProjectRequestCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
