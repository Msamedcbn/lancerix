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

  const document = renderContractDocument(
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

  const pdfBytes = await renderContractPdf(document, {
    reference: contract.reference,
    title: contract.title,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${contract.reference}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
