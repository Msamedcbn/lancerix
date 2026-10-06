import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { renderContractDocument } from "@/lib/contracts/document";
import { renderContractPdf } from "@/lib/contracts/pdf";
import { getContract } from "@/lib/data/contracts";

export const dynamic = "force-dynamic";

/**
 * The same deterministic text record/page.tsx shows, as a PDF download.
 *
 * getContract() already scopes to the caller (party or admin) via RLS --
 * requireSession() only proves someone is signed in, not who. A stranger's
 * contract id here comes back 404 the same way the browser page does.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await requireSession();
  const contract = await getContract(id, session.userId);

  if (!contract) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const type = request.nextUrl.searchParams.get("type");

  let document: string;
  let filename = `${contract.reference}.pdf`;

  if (type === "dossier") {
    const { listDeliveries, listDeliveryEvents } = await import("@/lib/data/deliveries");
    const { renderArbitrationDossier } = await import("@/lib/contracts/dossier");
    const { hashDocument } = await import("@/lib/contracts/document");

    const baseContractDoc = renderContractDocument(
      contract,
      contract.milestones,
      {
        freelancerName:
          contract.freelancer_id === session.userId
            ? session.fullName
            : contract.counterpartyName,
        clientName:
          contract.client_id === session.userId
            ? session.fullName
            : contract.counterpartyName,
        company: contract.company,
      },
      contract.criteria,
    );
    const contractHash = hashDocument(baseContractDoc);

    const deliveries = await listDeliveries(contract.id);
    const deliveryEvents = await listDeliveryEvents(deliveries.map((d) => d.id));

    document = renderArbitrationDossier(
      contract,
      {
        freelancerName:
          contract.freelancer_id === session.userId
            ? session.fullName
            : contract.counterpartyName,
        clientName:
          contract.client_id === session.userId
            ? session.fullName
            : contract.counterpartyName,
        company: contract.company,
      },
      contract.criteria,
      contract.milestones,
      deliveries,
      deliveryEvents,
      contract.signatures.map((s) => ({
        party: s.party,
        signed_at: s.signed_at,
        ip_address: s.ip_address,
        document_sha256: s.document_sha256,
      })),
      contractHash,
    );
    filename = `${contract.reference}-bilirkisi-raporu.pdf`;
  } else {
    document = renderContractDocument(
      contract,
      contract.milestones,
      {
        freelancerName:
          contract.freelancer_id === session.userId
            ? session.fullName
            : contract.counterpartyName,
        clientName:
          contract.client_id === session.userId
            ? session.fullName
            : contract.counterpartyName,
        company: contract.company,
      },
      contract.criteria,
    );
  }

  const pdfBytes = await renderContractPdf(document, {
    reference: contract.reference,
    title: type === "dossier" ? `${contract.title} — Bilirkişi Raporu` : contract.title,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
