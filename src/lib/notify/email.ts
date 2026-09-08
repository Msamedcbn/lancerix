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

/**
 * A client asking a freelancer to start a project.
 *
 * The brief is not included. It can run to 4000 characters, it is the client's
 * own words about their business, and it belongs behind auth like the rest of
 * the record. The email's job is to get the freelancer to open the request,
 * not to be the request.
 */
export async function notifyProjectRequest({
  toUserId,
  fallbackEmail,
  requestId,
  title,
  clientName,
}: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  requestId: string;
  title: string;
  clientName: string;
}>): Promise<SendResult> {
  const to = await addressFor(toUserId, fallbackEmail);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  return sendEmail({
    to,
    subject: `Yeni proje talebi: ${title}`,
    body: [
      `${clientName} seninle bir projeye başlamak istiyor.`,
      "",
      `Proje: ${title}`,
      `Talebi gör: ${appUrlFor(`/freelancer/requests/${requestId}`)}`,
      "",
      toUserId
        ? "Talebi sözleşmeye dönüştürebilir ya da gerekçesiyle reddedebilirsin."
        : "Devam etmek için önce bir hesap oluşturman gerekiyor.",
    ].join("\n"),
  });
}

/**
 * A new message on a contract thread.
 *
 * The body is deliberately not included: the thread is part of the contract
 * record and lives behind auth, and forwarding it into an inbox would put
 * contract correspondence somewhere neither party's RLS reaches. A preview of
 * the first line is enough to tell someone whether to open it now.
 *
 * Debouncing is the caller's job -- see postMessage in
 * contracts/[id]/actions/messages.ts -- because whether to send at all depends
 * on thread state this function has no business reading.
 */
export async function notifyNewMessage({
  toUserId,
  fallbackEmail,
  contractId,
  contractTitle,
  senderName,
  preview,
}: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  contractTitle: string;
  senderName: string;
  preview: string;
}>): Promise<SendResult> {
  const to = await addressFor(toUserId, fallbackEmail);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  return sendEmail({
    to,
    subject: `Yeni mesaj: ${contractTitle}`,
    body: [
      `${senderName} sözleşme yazışmasına bir mesaj bıraktı.`,
      "",
      `Sözleşme: ${contractTitle}`,
      `"${preview}"`,
      "",
      `Yanıtla: ${appUrlFor(`/contracts/${contractId}`)}`,
      "",
      "Yazışma sözleşme kaydının parçasıdır; buradan yanıtlaman kaydın",
      "eksiksiz kalmasını sağlar.",
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
 * A new Tier 3/4 reviewer was just added to the roster (2026-09-06 four-role
 * audit, Finding 1). No account exists yet at this point for the common
 * case addReviewer() now supports -- this is a plain heads-up, not a link to
 * anything, since there is nothing to act on until a client actually
 * selects them (that is notifyReviewerAssigned, below).
 */
export async function notifyReviewerAdded({
  to,
  fullName,
}: Readonly<{ to: string; fullName: string }>): Promise<SendResult> {
  return sendEmail({
    to,
    subject: "Lancerix mühendis kadrosuna eklendin",
    body: [
      `Merhaba ${fullName},`,
      "",
      "Lancerix'te bir müşteri seni QA doğrulama mühendisi olarak seçtiğinde",
      "buraya bir e-posta gelecek -- o e-postadaki linkten, hesap açmana gerek",
      "kalmadan raporunu doğrudan yazabileceksin.",
      "",
      "Şimdilik yapman gereken bir şey yok.",
    ].join("\n"),
  });
}

/**
 * A client selected this reviewer and the freelancer delivered -- there is
 * now something real to review. The link is single-use and expires in 14
 * days (submit_qa_delivery() issues it, expire-reviewer-tokens.ts's cron
 * clears it out and tells the admin if it goes unused).
 *
 * fallbackEmail is the reviewer's own qa_reviewers.email for the no-account
 * case; toUserId is set only when profile_id is not null.
 */
export async function notifyReviewerAssigned({
  toUserId,
  fallbackEmail,
  contractTitle,
  reviewerName,
  token,
}: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractTitle: string;
  reviewerName: string;
  token: string;
}>): Promise<SendResult> {
  const to = await addressFor(toUserId, fallbackEmail);
  if (!to) return { ok: false, reason: "no address on file for that reviewer" };

  return sendEmail({
    to,
    subject: `Yeni QA incelemesi: ${contractTitle}`,
    body: [
      `Merhaba ${reviewerName},`,
      "",
      `"${contractTitle}" sözleşmesi için QA incelemesine seçildin.`,
      "",
      `Raporunu buradan gönder: ${appUrlFor(`/reviewer-report/${token}`)}`,
      "",
      "Bu link tek kullanımlıktır ve 14 gün içinde kullanılmazsa geçersiz",
      "olur -- hesap açmana gerek yok, linke tıklayıp doğrudan raporunu",
      "yazabilirsin.",
    ].join("\n"),
  });
}

/**
 * A reviewer's link expired before they used it (2026-09-06 four-role audit)
 * -- the one path the admin re-enters the loop on, since removing them as
 * the manual relay for the happy path must not mean losing visibility when
 * a reviewer simply never acts. Sent once per token by
 * expire-reviewer-tokens' cron.
 */
export async function notifyReviewerTokenExpired({
  contractTitle,
  reviewerName,
}: Readonly<{ contractTitle: string; reviewerName: string }>): Promise<SendResult> {
  const to = process.env.ADMIN_DIGEST_EMAIL;
  if (!to) return { ok: false, reason: "ADMIN_DIGEST_EMAIL is not set" };

  return sendEmail({
    to,
    subject: `Reviewer raporu gelmedi: ${contractTitle}`,
    body: [
      `${reviewerName}, "${contractTitle}" için 14 gün içinde rapor göndermedi`,
      "ve linki geçersiz oldu.",
      "",
      `Panel: ${appUrlFor("/admin/qa-queue")}`,
      "",
      "Reviewer'a ulaşıp durumu sorman ya da /admin/reviewers üzerinden",
      "sözleşmeye yeni bir reviewer atayıp müşteriyi bilgilendirmen gerekebilir.",
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

/**
 * Notifies the user when their standalone site QA report payment is confirmed
 * via Polar webhook, including a direct link to their shareable public report.
 */
export async function notifyStandaloneCheckPaid({
  toUserId,
  orderId,
  targetUrl,
  packageName,
}: Readonly<{
  toUserId: string;
  orderId: string;
  targetUrl: string;
  packageName: string;
}>): Promise<SendResult> {
  const to = await addressOf(toUserId);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  return sendEmail({
    to,
    subject: `QA Doğrulama Raporunuz Hazır: ${targetUrl}`,
    body: [
      `Lancerix Bağımsız Otomatik QA taraması tamamlandı ve ödemeniz onaylandı.`,
      "",
      `Paket: ${packageName}`,
      `Hedef URL: ${targetUrl}`,
      "",
      `Kamuya açık doğrulanmış raporunuzu inceleyin ve yazdırın:`,
      appUrlFor(`/r/${orderId}`),
      "",
      "Raporunuz SHA-256 kriptografik mührü ile veritabanımızda güvence altındadır.",
    ].join("\n"),
  });
}


/**
 * The monitoring subscription's only outbound mail, and the reason anyone stays
 * subscribed: what changed since the last scan.
 *
 * Sent only when diffScans() found something (src/lib/qa/diff.ts). A weekly
 * "nothing changed" mail would be filtered inside a month, and a filtered mail
 * is a subscription with no observable value -- so silence is the correct
 * output for a site that did not move.
 */
export async function notifyMonitoringChange({
  toUserId,
  targetUrl,
  changes,
}: Readonly<{
  toUserId: string;
  targetUrl: string;
  changes: readonly { direction: "WORSE" | "BETTER"; summary: string }[];
}>): Promise<SendResult> {
  const to = await addressOf(toUserId);
  if (!to) return { ok: false, reason: "no address on file for that account" };

  const worse = changes.filter((c) => c.direction === "WORSE");
  const better = changes.filter((c) => c.direction === "BETTER");

  // The subject carries the news: a regression is the thing worth opening the
  // mail for, so it goes in the line the customer reads in the inbox list.
  const subject = worse.length
    ? `${targetUrl} — ${worse.length} kötüleşme tespit edildi`
    : `${targetUrl} — ${better.length} iyileşme tespit edildi`;

  const lines = [`Son taramanızla bir önceki tarama arasındaki farklar:`, "", `Hedef: ${targetUrl}`, ""];
  if (worse.length) {
    lines.push("KÖTÜLEŞENLER");
    for (const c of worse) lines.push(`  - ${c.summary}`);
    lines.push("");
  }
  if (better.length) {
    lines.push("İYİLEŞENLER");
    for (const c of better) lines.push(`  - ${c.summary}`);
    lines.push("");
  }
  lines.push("Değişmeyen kontroller bu listede yer almaz.");

  return sendEmail({ to, subject, body: lines.join("\n") });
}
