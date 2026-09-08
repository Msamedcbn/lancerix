import { ContractForm } from "@/app/(dashboard)/freelancer/new/contract-form";
import { PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listPreviousClients } from "@/lib/data/contracts";
import { getProjectRequest, resolveClientPublicId } from "@/lib/data/project-requests";

export default async function NewContractPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ request?: string }> }>) {
  const session = await requireRole("FREELANCER");
  const { request: requestId } = await searchParams;

  const previousClients = await listPreviousClients(session.userId);

  // Converting a client's request. Anything other than an OPEN request
  // addressed to this freelancer is ignored rather than refused: the wizard
  // still works, it just starts empty, and convert_project_request() is the
  // authority on whether the link is allowed at submit time anyway.
  const request = requestId ? await getProjectRequest(requestId) : null;
  const fromRequest =
    request && request.status === "OPEN" && request.freelancer_id === session.userId
      ? {
          id: request.id,
          clientPublicId: await resolveClientPublicId(request.client_id),
          title: request.title,
          brief: request.brief,
        }
      : null;

  return (
    <>
      <PageHeading
        title="Yeni proje"
        subtitle="Anlaşmayı ve aşamalarını kur"
      />

      {/* Keyed by user so two accounts sharing one browser never restore each
          other's half-written contract, and by request so converting one does
          not collide with a draft started from scratch. */}
      <ContractForm
        draftKey={`lancerix:contract-draft:${session.userId}${
          fromRequest ? `:request:${fromRequest.id}` : ""
        }`}
        previousClients={previousClients}
        fromRequest={fromRequest}
      />
    </>
  );
}
