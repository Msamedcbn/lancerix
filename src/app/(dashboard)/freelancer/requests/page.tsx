import Link from "next/link";

import { EmptyState, PageHeading } from "@/components/page-shell";
import { ProjectRequestCard } from "@/components/project-request-card";
import { requireRole } from "@/lib/auth/session";
import { listIncomingRequests } from "@/lib/data/project-requests";

import { DeclineRequest } from "./decline-request";

export default async function FreelancerRequestsPage() {
  const session = await requireRole("FREELANCER");
  const requests = await listIncomingRequests(session.userId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title="Gelen talepler"
        subtitle="Müşterilerin seninle başlamak istediği projeler. Kabul kriterleri, kapsam ve fazlar sözleşmeyi kurarken senin elinde."
      />

      {requests.length === 0 ? (
        <EmptyState
          title="Gelen talep yok"
          description="Bir müşteri seni Lancerix ID'nle ya da e-postanla çağırdığında talebi burada görürsün."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((request) => (
            <ProjectRequestCard
              key={request.id}
              request={request}
              counterpartyLabel="Müşteri"
            >
              {request.status === "OPEN" ? (
                <div className="flex flex-wrap items-start gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                  <Link
                    href={`/freelancer/new?request=${request.id}`}
                    className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-md shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.98]"
                  >
                    Sözleşmeye dönüştür →
                  </Link>
                  <DeclineRequest requestId={request.id} />
                </div>
              ) : null}

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
  );
}
