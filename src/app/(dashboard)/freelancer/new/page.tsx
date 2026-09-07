import { ContractForm } from "@/app/(dashboard)/freelancer/new/contract-form";
import { PageHeading } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listPreviousClients } from "@/lib/data/contracts";
import { getMyProfile } from "@/lib/data/profile";
import { getProjectRequest, resolveClientPublicId } from "@/lib/data/project-requests";
import { DEFAULT_PLATFORM_FEE_BPS } from "@/lib/escrow/money";
import { DEFAULT_STOPAJ_BPS } from "@/lib/tax/stopaj";
import { payoutBlockers } from "@/lib/validations/profile";

export default async function NewContractPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ request?: string }> }>) {
  const session = await requireRole("FREELANCER");
  const { request: requestId } = await searchParams;

  const [profile, previousClients] = await Promise.all([
    getMyProfile(session.userId),
    listPreviousClients(session.userId),
  ]);

  // Only meaningful for QA_PLUS_ESCROW, which pays out through the platform.
  // A QA_ONLY contract settles payment directly between the parties, so
  // TCKN/IBAN never block it -- ContractForm decides whether to show this.
  const missing = payoutBlockers({ tckn: profile.tckn, iban: profile.iban });

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
        feeBps={DEFAULT_PLATFORM_FEE_BPS}
        stopajBps={DEFAULT_STOPAJ_BPS}
        payoutBlockers={missing}
        draftKey={`lancerix:contract-draft:${session.userId}${
          fromRequest ? `:request:${fromRequest.id}` : ""
        }`}
        previousClients={previousClients}
        fromRequest={fromRequest}
      />
    </>
  );
}
