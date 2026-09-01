import "server-only";

/**
 * Transactional email is DISABLED.
 *
 * Emails are only used for account verification (handled by Supabase Auth).
 * All application-level notifications are disabled until the notification
 * system is redesigned (in-app notifications, push, etc.).
 *
 * Function signatures are preserved so callers don't break, but every
 * function returns { ok: true } without sending anything.
 */

export type SendResult = { ok: true } | { ok: false; reason: string };

const NOOP: SendResult = { ok: true };

export async function sendEmail(_args: Readonly<{
  to: string;
  subject: string;
  body: string;
}>): Promise<SendResult> {
  return NOOP;
}

export async function addressOf(_userId: string): Promise<string | null> {
  return null;
}

export async function notifyContractInvite(_args: Readonly<{
  to: string;
  contractId: string;
  contractTitle: string;
  freelancerName: string;
  hasAccount: boolean;
}>): Promise<SendResult> {
  return NOOP;
}

export async function notifySignatureRequested(_args: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  contractTitle: string;
  signerName: string;
}>): Promise<SendResult> {
  return NOOP;
}

export async function notifyDelivery(_args: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  milestoneTitle: string;
  windowDays: number;
  deadline: string;
}>): Promise<SendResult> {
  return NOOP;
}

export async function notifyDeliverySubmitted(_args: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  contractTitle: string;
  windowDays: number;
}>): Promise<SendResult> {
  return NOOP;
}

export async function notifyQaOutcome(_args: Readonly<{
  toUserId: string | null;
  fallbackEmail: string;
  contractId: string;
  contractTitle: string;
  accepted: boolean;
  note: string | null;
}>): Promise<SendResult> {
  return NOOP;
}

export async function notifyAutoAccepted(_args: Readonly<{
  toUserId: string;
  contractId: string;
  milestoneTitle: string;
}>): Promise<SendResult> {
  return NOOP;
}
