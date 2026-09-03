import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Transactional mail through Resend.
 *
 * Deliberately not fatal to the action that triggers it: a signature that was
 * recorded is recorded whether or not the other side could be emailed. But it
 * is never silent either -- the caller is handed the reason and says so,
 * because the objection clock ("sessizlik kabul sayılır") is only fair if the
 * client was actually told the window opened.
 *
 * This was fully disabled for a stretch (commit 807b3f0) pending an in-app
 * notification redesign that never landed -- meaning every event that starts
 * an objection/review clock went out completely silently. Restored rather
 * than left off: a clock nobody is told about is worse than a clock told by
 * email that might occasionally fail to send.
 */
export type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendEmail({
  to,
  subject,
  body,
}: Readonly<{ to: string; subject: string; body: string }>): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    return {
      ok: false,
      reason: "email is not configured yet (RESEND_API_KEY and MAIL_FROM are unset)",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text: body }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, reason: `Resend returned ${response.status}: ${detail}` };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "unknown network error",
    };
  }
}

/**
 * A registered account's address, read with the service role.
 *
 * RLS hides it from the other party for good reason, and that reason does
 * not change here -- this runs on the server, the address is never returned
 * to the browser, and it exists only to put a message in the right inbox.
 */
export async function addressOf(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  return data?.email ?? null;
}

/**
 * The address to notify: the registered account's own email first, falling
 * back to a directly-known address for a party who invited someone by email
 * but does not yet have an account. contracts.client_email is largely vestigial
 * now that invites go by public_id (createContract writes "" there), so this
 * resolves to null -- and a clear reason -- for most current contracts rather
 * than silently having nowhere to send.
 */
async function addressFor(toUserId: string | null, fallbackEmail: string): Promise<string | null> {
  if (toUserId) {
    const registered = await addressOf(toUserId);
    if (registered) return registered;
  }
  return fallbackEmail.trim() || null;
}

const appUrlFor = (path: string) => {
  const base =
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return `${base}${path}`;
};

export async function notifyContractInvite({
  to,
  contractId,
  contractTitle,
  freelancerName,
  hasAccount,
}: Readonly<{
  to: string;
  contractId: string;
  contractTitle: string;
  freelancerName: string;
  hasAccount: boolean;
}>): Promise<SendResult> {
  return sendEmail({
    to,
    subject: `Yeni sözleşme daveti: ${contractTitle}`,
    body: [
      `${freelancerName} seninle Lancerix üzerinden bir sözleşme kurdu.`,
      "",
      `Sözleşme: ${contractTitle}`,
      `Görüntüle: ${appUrlFor(`/contracts/${contractId}`)}`,
      "",
      hasAccount
        ? "Giriş yapıp sözleşmeyi inceleyebilirsin."
        : "Devam etmek için önce bir hesap oluşturman gerekiyor.",
    ].join("\n"),
  });
}

export async function notifySignatureRequested({
  toUserId,
  fallbackEmail,
  contractId,
  contractTitle,
  signerName,
}: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  contractTitle: string;
  signerName: string;
}>): Promise<SendResult> {
  const to = await addressFor(toUserId, fallbackEmail);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  return sendEmail({
    to,
    subject: `İmzanız bekleniyor: ${contractTitle}`,
    body: [
      `${signerName} bir sözleşmeyi imzaladı ve sizin imzanızı bekliyor.`,
      "",
      `Sözleşme: ${contractTitle}`,
      `Görüntüle: ${appUrlFor(`/contracts/${contractId}`)}`,
      "",
      "İki taraf da imzaladığında sözleşme yürürlüğe girer.",
    ].join("\n"),
  });
}

export async function notifyDelivery({
  toUserId,
  fallbackEmail,
  contractId,
  milestoneTitle,
  windowDays,
  deadline,
}: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  milestoneTitle: string;
  windowDays: number;
  deadline: string;
}>): Promise<SendResult> {
  const to = await addressFor(toUserId, fallbackEmail);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  return sendEmail({
    to,
    subject: `Teslim edildi: ${milestoneTitle}`,
    body: [
      `Bir aşama teslim edildi ve ${windowDays} günlük itiraz süreniz başladı.`,
      "",
      `Aşama: ${milestoneTitle}`,
      `Son itiraz tarihi: ${deadline}`,
      `İncele: ${appUrlFor(`/contracts/${contractId}`)}`,
      "",
      "Bu süre içinde itiraz etmezseniz teslimat sözleşme uyarınca kabul",
      "edilmiş sayılır ve kabul kayda geçer.",
    ].join("\n"),
  });
}

export async function notifyDeliverySubmitted({
  toUserId,
  fallbackEmail,
  contractId,
  contractTitle,
  windowDays,
}: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  contractTitle: string;
  windowDays: number;
}>): Promise<SendResult> {
  const to = await addressFor(toUserId, fallbackEmail);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  return sendEmail({
    to,
    subject: `Teslim edildi, kontrol süren başladı: ${contractTitle}`,
    body: [
      `Teslimat yapıldı ve ${windowDays} günlük kontrol süreniz başladı.`,
      "",
      `Sözleşme: ${contractTitle}`,
      `İncele: ${appUrlFor(`/contracts/${contractId}`)}`,
      "",
      "Bu süre içinde bir karar vermezsen teslimat sözleşme uyarınca kabul",
      "edilmiş sayılır ve kabul kayda geçer.",
    ].join("\n"),
  });
}

export async function notifyQaOutcome({
  toUserId,
  fallbackEmail,
  contractId,
  contractTitle,
  accepted,
  note,
}: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  contractTitle: string;
  accepted: boolean;
  note: string | null;
}>): Promise<SendResult> {
  const to = await addressFor(toUserId, fallbackEmail);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  return sendEmail({
    to,
    subject: accepted
      ? `Teslimat kabul edildi: ${contractTitle}`
      : `İtiraz kaydedildi: ${contractTitle}`,
    body: [
      accepted
        ? "Müşteri teslimatı kabul etti."
        : "Müşteri teslimata itiraz etti.",
      "",
      `Sözleşme: ${contractTitle}`,
      ...(note ? ["", `Not: ${note}`] : []),
      `Görüntüle: ${appUrlFor(`/contracts/${contractId}`)}`,
    ].join("\n"),
  });
}

/**
 * Faz E #3 (2026-09-03 CEO strategy review): the client has gone quiet with
 * roughly a day left in the silence-is-acceptance window. Freelancer-only,
 * like notifyAutoAccepted -- addressOf() directly, no fallback, since a
 * freelancer always has a registered account to resolve.
 */
export async function notifyReviewDeadlineApproaching({
  toUserId,
  contractId,
  contractTitle,
  deadline,
}: Readonly<{
  toUserId: string;
  contractId: string;
  contractTitle: string;
  deadline: string;
}>): Promise<SendResult> {
  const to = await addressOf(toUserId);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  const deadlineDate = new Date(deadline).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
  });

  return sendEmail({
    to,
    subject: `Kontrol süresi yakında doluyor: ${contractTitle}`,
    body: [
      `Müşterinin kontrol süresi ${deadlineDate} tarihinde doluyor ve henüz bir karar verilmedi.`,
      "",
      `Sözleşme: ${contractTitle}`,
      `Görüntüle: ${appUrlFor(`/contracts/${contractId}`)}`,
      "",
      "Süre dolduğunda karar verilmemiş teslimat sözleşme uyarınca kabul",
      "edilmiş sayılır. Müşteriyi hatırlatmak istersen sözleşme sayfasındaki",
      "mesaj alanını kullanabilirsin.",
    ].join("\n"),
  });
}

export async function notifyAutoAccepted({
  toUserId,
  contractId,
  milestoneTitle,
}: Readonly<{
  toUserId: string;
  contractId: string;
  milestoneTitle: string;
}>): Promise<SendResult> {
  const to = await addressOf(toUserId);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  return sendEmail({
    to,
    subject: `Süre doldu, kabul edildi: ${milestoneTitle}`,
    body: [
      "İtiraz süresi doldu ve teslimat sözleşme uyarınca kabul edilmiş sayıldı.",
      "",
      `Aşama: ${milestoneTitle}`,
      `Kayıt: ${appUrlFor(`/contracts/${contractId}`)}`,
    ].join("\n"),
  });
}

/**
 * The daily admin digest -- sent to a fixed ADMIN_DIGEST_EMAIL, not a user
 * lookup, since there is one operator and no in-app concept yet of "who
 * gets ops mail" worth building. The cron only calls this when at least one
 * count is nonzero (no "all clear" noise mail) and only once per calendar
 * day (admin_digest_sends).
 */
export async function notifyAdminDigest({
  qaQueue,
  pendingOrders,
  pendingInvoices,
  disputes,
  unclaimedInvites,
}: Readonly<{
  qaQueue: number;
  pendingOrders: number;
  pendingInvoices: number;
  disputes: number;
  unclaimedInvites: number;
}>): Promise<SendResult> {
  const to = process.env.ADMIN_DIGEST_EMAIL;
  if (!to) return { ok: false, reason: "ADMIN_DIGEST_EMAIL is not set" };

  return sendEmail({
    to,
    subject: "Lancerix admin özeti",
    body: [
      "Bugün dikkat gerektiren:",
      "",
      `QA kuyruğu: ${qaQueue}`,
      `Bekleyen QA ödemesi: ${pendingOrders}`,
      `Bekleyen fatura: ${pendingInvoices}`,
      `İtirazlar: ${disputes}`,
      `Bekleyen davetler: ${unclaimedInvites}`,
      "",
      `Panel: ${appUrlFor("/admin")}`,
    ].join("\n"),
  });
}
