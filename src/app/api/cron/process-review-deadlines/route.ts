import { NextResponse, type NextRequest } from "next/server";

import { notifyDeliveryTacitlyAccepted } from "@/lib/notify/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * TBK m. 477 Otomatik Zımni Kabul Motoru (Review Deadline Expiration Engine)
 *
 * Türk Borçlar Kanunu Madde 477 gereğince:
 * "Eserin açıkça veya örtülü olarak kabulünden sonra, yüklenici her türlü
 * sorumluluktan kurtulur; ancak, onun tarafından kasten gizlenen ve usulüne
 * göre gözden geçirme sırasında fark edilemeyen ayıplar için sorumluluğu devam eder.
 * İşsahibi, gözden geçirmeyi ve bildirimde bulunmayı ihmal ederse, eseri kabul etmiş sayılır."
 *
 * Bu endpoint, 7 günlük yasal inceleme penceresi dolmuş (client_review_deadline <= NOW())
 * ve somut teknik ayıp bildirilmemiş tüm teslimatları otomatik olarak ACCEPTED statüsüne
 * geçirir, denetim kaydını mühürler ve taraflara resmi bildirim gönderir.
 */
async function handleProcessReviewDeadlines(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set; refusing to run unauthenticated" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret") || request.nextUrl.searchParams.get("key");

  const isAuthorised =
    authHeader === `Bearer ${secret}` ||
    querySecret === secret;

  if (!isAuthorised) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // Find deliveries awaiting client review where deadline has passed
  const { data: expired, error } = await admin
    .from("deliveries")
    .select(`
      id,
      contract_id,
      contracts (
        id,
        reference,
        title,
        freelancer_id,
        client_id,
        client_email
      )
    `)
    .eq("status", "AWAITING_CLIENT")
    .not("client_review_deadline", "is", null)
    .lte("client_review_deadline", nowIso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const accepted: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  for (const delivery of expired ?? []) {
    const { error: transitionError } = await admin.rpc("transition_delivery", {
      p_delivery_id: delivery.id,
      p_to_status: "ACCEPTED",
      p_reason: "TBK m. 477 uyarınca 7 günlük yasal inceleme süresinde somut teknik ayıp bildirimi yapılmadığından teslimat kanunen zımnen kabul edilmiştir.",
    });

    if (transitionError) {
      failed.push({ id: delivery.id, reason: transitionError.message });
      continue;
    }

    accepted.push(delivery.id);

    const contract = delivery.contracts;
    if (contract) {
      try {
        await notifyDeliveryTacitlyAccepted({
          toClientUserId: contract.client_id,
          clientFallbackEmail: contract.client_email ?? "",
          toFreelancerUserId: contract.freelancer_id,
          contractId: contract.id,
          contractTitle: contract.title,
          reference: contract.reference,
        });
      } catch (notifyErr) {
        console.error(
          `[TBK-477-CRON] Failed to send email notification for contract ${contract.id}:`,
          notifyErr,
        );
      }
    }
  }

  return NextResponse.json({
    ok: true,
    checked: expired?.length ?? 0,
    acceptedCount: accepted.length,
    acceptedIds: accepted,
    failed,
    timestamp: nowIso,
  });
}

export async function GET(request: NextRequest) {
  return handleProcessReviewDeadlines(request);
}

export async function POST(request: NextRequest) {
  return handleProcessReviewDeadlines(request);
}
