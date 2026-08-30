import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SendResult = { ok: true } | { ok: false; reason: string };

/**
 * Transactional mail through Resend.
 *
 * Deliberately not fatal to the action that triggers it: a signature that was
 * recorded is recorded whether or not the other side could be emailed. But it
 * is never silent either -- the caller is handed the reason and says so, because
 * the objection clock is only fair if the client was actually told the work
 * arrived.
 */
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
      reason:
        "email is not configured yet (RESEND_API_KEY and MAIL_FROM are unset)",
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
 * A counterparty's address, read with the service role.
 *
 * RLS hides it from the other party for good reason, and that reason does not
 * change here -- this runs on the server, the address is never returned to the
 * browser, and it exists only to put a message in the right inbox.
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

const appUrlFor = (path: string) => {
  const base =
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return `${base}${path}`;
};

export async function notifySignatureRequested({
  toUserId,
  contractId,
  contractTitle,
  signerName,
}: Readonly<{
  toUserId: string;
  contractId: string;
  contractTitle: string;
  signerName: string;
}>): Promise<SendResult> {
  const to = await addressOf(toUserId);
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
  contractId,
  milestoneTitle,
  windowDays,
  deadline,
}: Readonly<{
  toUserId: string;
  contractId: string;
  milestoneTitle: string;
  windowDays: number;
  deadline: string;
}>): Promise<SendResult> {
  const to = await addressOf(toUserId);
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
