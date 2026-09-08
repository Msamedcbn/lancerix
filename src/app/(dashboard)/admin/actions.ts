"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { logAdminEvent } from "@/lib/data/admin-activity";
import { MoneyError, parseTryToKurus } from "@/lib/escrow/money";
import { FAIL, firstIssue, OK, toUserMessage, type FormState } from "@/lib/forms";
import { notifyReviewerAdded } from "@/lib/notify/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type { FormState };

const userNoteSchema = z.object({
  profileId: z.string().uuid(),
  body: z.string().trim().min(1, "Not boş olamaz.").max(2000, "Not çok uzun."),
});

/**
 * Suspend/unsuspend only ever gates NEW contract creation
 * (contracts_insert_freelancer, 20260904000006_user_suspension_and_role_change.sql)
 * -- not login, not any in-flight contract/delivery/message RPC. Two people
 * who already agreed to work together finish that work; a suspended user
 * just can't start anything new. Deliberately not threaded through 8+
 * existing RPCs to keep this a single, low-risk enforcement point.
 */
export async function suspendUser(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const profileId = String(formData.get("profileId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!profileId) return FAIL("Kullanıcı eksik.");
  if (!reason) return FAIL("Bir gerekçe gir.");
  if (profileId === session.userId) return FAIL("Kendi hesabını askıya alamazsın.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      suspended_at: new Date().toISOString(),
      suspended_by: session.userId,
      suspension_reason: reason,
    })
    .eq("id", profileId);
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "user_suspended", "profile", profileId, { reason });

  revalidatePath(`/admin/users/${profileId}`);
  return OK("Kullanıcı askıya alındı.");
}

export async function unsuspendUser(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const profileId = String(formData.get("profileId") ?? "");
  if (!profileId) return FAIL("Kullanıcı eksik.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ suspended_at: null, suspended_by: null, suspension_reason: null })
    .eq("id", profileId);
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "user_unsuspended", "profile", profileId, {});

  revalidatePath(`/admin/users/${profileId}`);
  return OK("Askı kaldırıldı.");
}

const roleChangeSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(["FREELANCER", "CLIENT", "ADMIN"]),
});

/**
 * guard_profile_role() (20260830000100_init.sql) already enforces that only
 * an admin may change a role and that nobody may change their own -- this
 * action is just the UI's path to a mutation the DB already secures. The
 * one thing added here: promoting to ADMIN requires the confirm=yes flag
 * the UI only sends after an explicit "type ADMIN to confirm" step, since
 * that grant is full admin power with no finer-grained role today.
 */
export async function changeUserRole(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const parsed = roleChangeSchema.safeParse({
    profileId: formData.get("profileId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  if (parsed.data.role === "ADMIN" && formData.get("confirmAdmin") !== "yes") {
    return FAIL("ADMIN yetkisi vermek için onay adımını tamamla.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.profileId);
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "user_role_changed", "profile", parsed.data.profileId, {
    newRole: parsed.data.role,
  });

  revalidatePath(`/admin/users/${parsed.data.profileId}`);
  return OK("Rol güncellendi.");
}

const profileEditSchema = z.object({
  profileId: z.string().uuid(),
  fullName: z.string().trim().min(2, "İsim en az 2 karakter olmalı.").max(255, "İsim çok uzun."),
});

/**
 * Just full_name -- editing email would desync from auth.users (the real
 * identity record) without a proper re-verification flow, and TCKN/IBAN are
 * checksum-validated financial/identity fields a support-driven admin edit
 * would too easily get wrong. Out of scope here; both stay user-editable
 * from their own profile settings only.
 */
export async function updateUserProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const parsed = profileEditSchema.safeParse({
    profileId: formData.get("profileId"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", parsed.data.profileId);
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "user_profile_edited", "profile", parsed.data.profileId, {
    fullName: parsed.data.fullName,
  });

  revalidatePath(`/admin/users/${parsed.data.profileId}`);
  return OK("Profil güncellendi.");
}

/**
 * Real deletion, not a soft flag -- but only ever succeeds for a genuinely
 * empty account. Every FK from contracts/platform_invoices/payouts/companies
 * to profiles is ON DELETE RESTRICT (verified directly against the schema
 * before building this), so Postgres itself refuses the cascade the moment
 * any real history exists; this action does not try to out-think that, it
 * just surfaces whatever error the database gives back. The confirmation
 * text is checked server-side against the profile's own public_id -- never
 * trust a client-only confirm on something this irreversible.
 */
export async function deleteUserAccount(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const profileId = String(formData.get("profileId") ?? "");
  const confirmText = String(formData.get("confirmText") ?? "").trim();
  if (!profileId) return FAIL("Kullanıcı eksik.");
  if (profileId === session.userId) return FAIL("Kendi hesabını silemezsin.");

  const supabase = await createClient();
  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("public_id")
    .eq("id", profileId)
    .maybeSingle();
  if (lookupError) return FAIL(lookupError.message);
  if (!profile) return FAIL("Kullanıcı bulunamadı.");
  if (confirmText !== profile.public_id) {
    return FAIL("Onay metni Lancerix ID ile eşleşmiyor.");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) {
    // The expected shape of this failure: any real contract/invoice/payout
    // history means an ON DELETE RESTRICT constraint somewhere refuses the
    // cascade, and Postgres's own error message is what the admin needs to
    // see -- "this account has real history, suspend it instead."
    return FAIL(error.message);
  }

  await logAdminEvent(session.userId, "user_deleted", "profile", profileId, {
    publicId: profile.public_id,
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

/**
 * A timestamped note an admin leaves on a user's profile -- never a single
 * editable field two admins could silently overwrite, always a log entry.
 * admin_user_notes is is_admin()-only at the RLS level; the profile owner
 * never sees these.
 */
export async function addUserNote(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const parsed = userNoteSchema.safeParse({
    profileId: formData.get("profileId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.from("admin_user_notes").insert({
    profile_id: parsed.data.profileId,
    author_id: session.userId,
    body: parsed.data.body,
  });
  if (error) return FAIL(error.message);

  revalidatePath(`/admin/users/${parsed.data.profileId}`);
  return OK("Not eklendi.");
}

const reportSchema = z.object({
  deliveryId: z.string().uuid(),
  contractId: z.string().uuid(),
  status: z.enum(["PASS", "FAIL", "PARTIAL"]),
  findings: z.string().trim().min(10, "Bulguları en az on karakterle yaz."),
});

/**
 * The QA desk's verdict on a queued delivery.
 *
 * This is two transitions, not one: QA_QUEUED -> QA_DONE lands the report,
 * then QA_DONE -> AWAITING_CLIENT opens the client's review window, mirroring
 * what Tier 1 does immediately on submit. Splitting them keeps each move a
 * single legal edge in delivery_status_transitions rather than inventing a
 * shortcut edge the state machine does not know about -- but both moves and
 * the report insert between them happen inside one RPC (submit_qa_report(),
 * see 20260901160000_atomic_qa_writes.sql) so a mid-chain failure cannot
 * strand the delivery in QA_DONE with no report to show for it.
 *
 * A report is evidence -- qa_reports is append-only and its digest is what a
 * PDF export would later be checked against, so the hash covers the exact
 * text a client is asked to trust, not a paraphrase of it. The hash itself
 * stays computed here rather than in SQL: it does not depend on the clock,
 * so there is nothing to gain from moving it server-side.
 */
export async function submitQaReport(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const parsed = reportSchema.safeParse({
    deliveryId: formData.get("deliveryId"),
    contractId: formData.get("contractId"),
    status: formData.get("status"),
    findings: formData.get("findings"),
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const { deliveryId, contractId, status, findings } = parsed.data;
  const supabase = await createClient();

  const digest = createHash("sha256")
    .update(`${deliveryId}:${status}:${findings}`)
    .digest("hex");

  const { error } = await supabase.rpc("submit_qa_report", {
    p_delivery_id: deliveryId,
    p_contract_id: contractId,
    p_status: status,
    p_findings: findings,
    p_document_sha256: digest,
  });
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "qa_report_submitted", "delivery", deliveryId, { status });

  revalidatePath("/admin/qa-queue");
  revalidatePath(`/contracts/${contractId}`);
  return OK("Rapor kaydedildi. Müşterinin kontrol süresi başladı.");
}

const reviewerSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta gir."),
  fullName: z.string().trim().min(2, "İsim en az 2 karakter olmalı."),
  level: z.enum(["PRINCIPAL", "SENIOR"]),
  yearsExperience: z.coerce.number().int().positive("Yıl sayısı pozitif olmalı."),
  specialties: z
    .string()
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  bio: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
});

/**
 * Adding an engineer to the Tier 3/4 roster.
 *
 * No account is required (2026-09-06 four-role audit, Finding 1): a reviewer
 * never logs in (the token-link report flow needs no session), so requiring
 * one up front was a dead-end for the exact case this exists to serve --
 * onboarding a real tester for the first time. find_counterparty is still
 * tried first (an existing account's own name/email stay authoritative if
 * one exists), and qa_reviewers.full_name/email carry the identity when it
 * doesn't.
 */
export async function addReviewer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const parsed = reviewerSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    level: formData.get("level"),
    yearsExperience: formData.get("yearsExperience"),
    specialties: formData.get("specialties") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();

  const { data: found, error: lookupError } = await supabase.rpc(
    "find_counterparty",
    { p_email: parsed.data.email },
  );
  if (lookupError) return FAIL(toUserMessage(lookupError, "Hesap arama sırasında bir hata oluştu."));
  const profile = found?.[0] ?? null;

  const { error, data: reviewer } = await supabase
    .from("qa_reviewers")
    .insert({
      profile_id: profile?.id ?? null,
      full_name: profile ? null : parsed.data.fullName,
      email: profile ? null : parsed.data.email,
      level: parsed.data.level,
      years_experience: parsed.data.yearsExperience,
      specialties: parsed.data.specialties,
      bio: parsed.data.bio,
    })
    .select("id")
    .single();
  if (error) return FAIL(toUserMessage(error, "Mühendis eklenemedi."));

  await logAdminEvent(session.userId, "reviewer_added", "qa_reviewer", reviewer.id, {
    level: parsed.data.level,
    hasAccount: profile !== null,
  });

  if (!profile) {
    const sent = await notifyReviewerAdded({ to: parsed.data.email, fullName: parsed.data.fullName });
    if (!sent.ok) {
      return OK("Mühendis kadroya eklendi, ama bilgilendirme e-postası iletilemedi.");
    }
  }

  revalidatePath("/admin/reviewers");
  return OK("Mühendis kadroya eklendi.");
}

/** Retiring or bringing back a reviewer -- never a delete, orders still reference them. */
export async function setReviewerActive(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const reviewerId = String(formData.get("reviewerId") ?? "");
  const active = formData.get("active") === "true";
  if (!reviewerId) return FAIL("Mühendis eksik.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("qa_reviewers")
    .update({ active })
    .eq("id", reviewerId);
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "reviewer_active_toggled", "qa_reviewer", reviewerId, {
    active,
  });

  revalidatePath("/admin/reviewers");
  return OK(active ? "Mühendis aktifleştirildi." : "Mühendis pasife alındı.");
}

/**
 * Setting the reviewer's own TIER3/TIER4 fee.
 *
 * choose_qa_tier() refuses to order a reviewer with no rate_kurus set, so
 * this has to exist before a freelancer can pick TIER3/4 for that reviewer
 * at all -- it is not just a later repricing tool.
 */
export async function setReviewerRate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const reviewerId = String(formData.get("reviewerId") ?? "");
  if (!reviewerId) return FAIL("Mühendis eksik.");

  let rateKurus: number;
  try {
    rateKurus = parseTryToKurus(String(formData.get("rate") ?? ""));
  } catch (err) {
    return FAIL(err instanceof MoneyError ? err.message : "Geçerli bir tutar gir.");
  }
  if (rateKurus <= 0) return FAIL("Ücret sıfırdan büyük olmalı.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("qa_reviewers")
    .update({ rate_kurus: rateKurus })
    .eq("id", reviewerId);
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "reviewer_rate_set", "qa_reviewer", reviewerId, {
    rateKurus,
  });

  revalidatePath("/admin/reviewers");
  return OK("Mühendis ücreti güncellendi.");
}

/**
 * Manually marking a QA tier order paid -- the fallback for a fee settled
 * outside Polar (bank transfer, etc). Only a PENDING order can be
 * marked this way; PAID/WAIVED/FAILED are not admin-editable states here.
 */
export async function markQaOrderPaid(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const orderId = String(formData.get("orderId") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();
  if (!orderId) return FAIL("Sipariş eksik.");
  if (!reference) return FAIL("Bir referans (dekont no, vb.) gir.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("qa_tier_orders")
    .update({
      payment_status: "PAID",
      provider_reference: reference,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_status", "PENDING");
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "qa_order_marked_paid", "qa_tier_order", orderId, {
    reference,
  });

  revalidatePath("/admin/qa-queue");
  return OK("Sipariş ödendi olarak işaretlendi.");
}

/**
 * Setting the real amount on a platform invoice.
 *
 * confirm_start_date() auto-files the WORK_START row from
 * project_amount_kurus * platform_fee_bps, but this stays available to
 * override -- a CUSTOM invoice type still starts at 0, and any amount may
 * need correcting by hand. Only a PENDING invoice can be repriced: once it
 * is PAID or CANCELLED the amount is history, not a draft.
 */
export async function setInvoiceAmount(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return FAIL("Fatura eksik.");

  let amountKurus: number;
  try {
    amountKurus = parseTryToKurus(String(formData.get("amount") ?? ""));
  } catch (err) {
    return FAIL(err instanceof MoneyError ? err.message : "Geçerli bir tutar gir.");
  }
  if (amountKurus <= 0) return FAIL("Tutar sıfırdan büyük olmalı.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_invoices")
    .update({ amount_kurus: amountKurus })
    .eq("id", invoiceId)
    .eq("status", "PENDING");
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "invoice_amount_set", "platform_invoice", invoiceId, {
    amountKurus,
  });

  revalidatePath("/admin/invoices");
  return OK("Fatura tutarı güncellendi.");
}

/**
 * Marking a platform invoice paid or cancelled -- the only two moves an
 * admin gets here.
 *
 * A PAID commission invoice carries a Jobtogo reference: until Lancerix has
 * its own company, this fee is invoiced through Jobtogo rather than
 * Lancerix issuing its own fatura, so the reference is what a later audit
 * reconciles against. Required only going to PAID -- cancelling needs no
 * paper trail.
 */
export async function setInvoiceStatus(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("ADMIN");

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const status = z.enum(["PAID", "CANCELLED"]).safeParse(formData.get("status"));
  if (!invoiceId) return FAIL("Fatura eksik.");
  if (!status.success) return FAIL("Geçersiz durum.");

  const jobtogoReference = String(formData.get("jobtogoReference") ?? "").trim();
  if (status.data === "PAID" && !jobtogoReference) {
    return FAIL("Ödendi işaretlemek için Jobtogo fatura referansını gir.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_invoices")
    .update({
      status: status.data,
      paid_at: status.data === "PAID" ? new Date().toISOString() : null,
      jobtogo_reference: status.data === "PAID" ? jobtogoReference : null,
    })
    .eq("id", invoiceId);
  if (error) return FAIL(error.message);

  await logAdminEvent(session.userId, "invoice_status_set", "platform_invoice", invoiceId, {
    status: status.data,
  });

  revalidatePath("/admin/invoices");
  return OK(status.data === "PAID" ? "Fatura ödendi olarak işaretlendi." : "Fatura iptal edildi.");
}
