"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { MoneyError, parseTryToKurus } from "@/lib/escrow/money";
import { FAIL, firstIssue, OK, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

export type { FormState };

const userNoteSchema = z.object({
  profileId: z.string().uuid(),
  body: z.string().trim().min(1, "Not boş olamaz.").max(2000, "Not çok uzun."),
});

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
  await requireRole("ADMIN");

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

  revalidatePath("/admin/qa-queue");
  revalidatePath(`/contracts/${contractId}`);
  return OK("Rapor kaydedildi. Müşterinin kontrol süresi başladı.");
}

const reviewerSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta gir."),
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
 * The engineer needs a profile already -- find_counterparty is the same
 * exact-email lookup a freelancer uses to invite a client, reused here so we
 * never need a second way to turn an email into a profile id.
 */
export async function addReviewer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const parsed = reviewerSchema.safeParse({
    email: formData.get("email"),
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
  if (lookupError) return FAIL(lookupError.message);
  const profile = found?.[0];
  if (!profile) {
    return FAIL("Bu e-postayla kayıtlı bir hesap bulunamadı. Önce mühendis bir hesap açmalı.");
  }

  const { error } = await supabase.from("qa_reviewers").insert({
    profile_id: profile.id,
    level: parsed.data.level,
    years_experience: parsed.data.yearsExperience,
    specialties: parsed.data.specialties,
    bio: parsed.data.bio,
  });
  if (error) return FAIL(error.message);

  revalidatePath("/admin/reviewers");
  return OK("Mühendis kadroya eklendi.");
}

/** Retiring or bringing back a reviewer -- never a delete, orders still reference them. */
export async function setReviewerActive(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const reviewerId = String(formData.get("reviewerId") ?? "");
  const active = formData.get("active") === "true";
  if (!reviewerId) return FAIL("Mühendis eksik.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("qa_reviewers")
    .update({ active })
    .eq("id", reviewerId);
  if (error) return FAIL(error.message);

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
  await requireRole("ADMIN");

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

  revalidatePath("/admin/reviewers");
  return OK("Mühendis ücreti güncellendi.");
}

/**
 * Manually marking a QA tier order paid -- the fallback for a fee settled
 * outside LemonSqueezy (bank transfer, etc). Only a PENDING order can be
 * marked this way; PAID/WAIVED/FAILED are not admin-editable states here.
 */
export async function markQaOrderPaid(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

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
  await requireRole("ADMIN");

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
  await requireRole("ADMIN");

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

  revalidatePath("/admin/invoices");
  return OK(status.data === "PAID" ? "Fatura ödendi olarak işaretlendi." : "Fatura iptal edildi.");
}
