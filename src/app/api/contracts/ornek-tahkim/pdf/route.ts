import { NextResponse } from "next/server";

import { renderArbitrationDossier } from "@/lib/contracts/dossier";
import { renderContractPdf } from "@/lib/contracts/pdf";
import { SHOWCASE_KUYUMCU_DATA } from "@/lib/data/verification";
import type { Contract, Milestone, AcceptanceCriterion } from "@/lib/data/contracts";
import type { DeliveryRow, DeliveryEvent } from "@/lib/data/deliveries";

export const dynamic = "force-dynamic";

export async function GET() {
  const dummyContract: Contract = {
    id: "showcase-kuyumcu-85k",
    reference: SHOWCASE_KUYUMCU_DATA.reference,
    title: SHOWCASE_KUYUMCU_DATA.title,
    status: "COMPLETED",
    project_amount_kurus: SHOWCASE_KUYUMCU_DATA.projectAmountKurus,
    currency: "TRY",
    freelancer_id: "user-freelancer-85k",
    client_id: "user-client-85k",
    client_email: "yonetim@kuyumcu-demo.com",
    created_at: SHOWCASE_KUYUMCU_DATA.createdAt,
    updated_at: SHOWCASE_KUYUMCU_DATA.deliveredAt,
    client_name: SHOWCASE_KUYUMCU_DATA.clientName,
    company_name: SHOWCASE_KUYUMCU_DATA.companyName ?? null,
    company_tax_no: "1234567890",
    company_tax_office: "Boğaziçi Kurumlar VD",
    delivery_window_days: 7,
    arbitration_mode: "PROTOCOL",
    raw_brief: "Kuyumculuk e-ticaret sitesi için canlı altın ve döviz kur çekme motoru, dinamik fiyatlama ve MASAK AML uyumluluk altyapısı.",
    is_signed_by_freelancer: true,
    is_signed_by_client: true,
  } as unknown as Contract;

  const parties = {
    freelancerName: SHOWCASE_KUYUMCU_DATA.freelancerName,
    clientName: SHOWCASE_KUYUMCU_DATA.clientName,
    company: {
      legal_name: SHOWCASE_KUYUMCU_DATA.companyName!,
      vkn: "1234567890",
      tax_office: "Boğaziçi Kurumlar VD",
      address: "Kapalıçarşı No: 42 Fatih / İstanbul",
    },
  };

  const criteria: AcceptanceCriterion[] = SHOWCASE_KUYUMCU_DATA.criteria.map((c, i) => ({
    id: c.id,
    contract_id: "showcase-kuyumcu-85k",
    sequence_no: i + 1,
    title: c.title,
    description: c.description,
    is_required: true,
    created_at: SHOWCASE_KUYUMCU_DATA.createdAt,
  } as unknown as AcceptanceCriterion));

  const milestones: Milestone[] = [
    {
      id: "m1",
      contract_id: "showcase-kuyumcu-85k",
      sequence_no: 1,
      title: "Canlı Kur Motoru, MASAK AML Entegrasyonu ve Canlı Demo Yayını",
      amount_kurus: SHOWCASE_KUYUMCU_DATA.projectAmountKurus,
      deadline: "2026-10-06",
      status: "COMPLETED",
      created_at: SHOWCASE_KUYUMCU_DATA.createdAt,
    } as unknown as Milestone,
  ];

  const deliveries: DeliveryRow[] = [
    {
      id: "del-85k",
      contract_id: "showcase-kuyumcu-85k",
      milestone_id: "m1",
      submitted_by: "user-freelancer-85k",
      submitted_at: SHOWCASE_KUYUMCU_DATA.deliveredAt,
      artifact_url: SHOWCASE_KUYUMCU_DATA.stagingUrl,
      artifact_sha256: SHOWCASE_KUYUMCU_DATA.deliverySha256,
      notes: "22 günlük geliştirme ve test fazı tamamlanarak canlı staging ortamında altın API beslemesi ve MASAK log mekanizması devreye alınmıştır.",
      status: "ACCEPTED",
      client_review_deadline: "2026-10-13T14:30:00Z",
      decision_notes: "TBK m. 477 uyarınca 7 günlük yasal itiraz süresinde somut teknik ayıp bildirimi yapılmadığından teslimat kanunen zımnen kabul edilmiştir.",
      created_at: SHOWCASE_KUYUMCU_DATA.deliveredAt,
      updated_at: "2026-10-13T14:30:01Z",
      orders: [],
      reports: [],
    } as unknown as DeliveryRow,
  ];

  const deliveryEvents: DeliveryEvent[] = [
    {
      id: "ev-1",
      delivery_id: "del-85k",
      from_status: null,
      to_status: "SUBMITTED",
      created_at: SHOWCASE_KUYUMCU_DATA.deliveredAt,
      actor_role: "FREELANCER",
      reason: "Teslimat yapıldı ve 7 günlük yasal inceleme penceresi açıldı.",
    } as unknown as DeliveryEvent,
    {
      id: "ev-2",
      delivery_id: "del-85k",
      from_status: "SUBMITTED",
      to_status: "ACCEPTED",
      created_at: "2026-10-13T14:30:01Z",
      actor_role: "SYSTEM",
      reason: "TBK m. 477 uyarınca 7 günlük sürede teknik ayıp bildirilmediğinden otomatik zımni kabul gerçekleşti.",
    } as unknown as DeliveryEvent,
  ];

  const signatures = [
    {
      party: "FREELANCER",
      signed_at: "2026-09-14T09:12:44Z",
      ip_address: "185.22.184.12 (İstanbul, TR)",
      document_sha256: "7a41ef689bc01a4ef...981c",
    },
    {
      party: "CLIENT",
      signed_at: "2026-09-14T11:04:18Z",
      ip_address: "212.156.40.85 (İstanbul, TR)",
      document_sha256: "3d92fb011ce499ab...22c7",
    },
  ];

  const dossierText = renderArbitrationDossier(
    dummyContract,
    parties,
    criteria,
    milestones,
    deliveries,
    deliveryEvents,
    signatures,
    SHOWCASE_KUYUMCU_DATA.contractSha256,
  );

  const verifyBaseUrl =
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://app.lancerix.com");

  const pdfBytes = await renderContractPdf(dossierText, {
    reference: SHOWCASE_KUYUMCU_DATA.reference,
    title: `${SHOWCASE_KUYUMCU_DATA.title} — Bilirkişi Raporu`,
    verifyUrl: `${verifyBaseUrl}/verify/${SHOWCASE_KUYUMCU_DATA.reference}`,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${SHOWCASE_KUYUMCU_DATA.reference}-ornek-bilirkisi-raporu.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
