"use server";

import { createHash } from "node:crypto";

import { z } from "zod";

import { FAIL, OK, firstIssue, type FormState } from "@/lib/forms";
import { createAdminClient } from "@/lib/supabase/admin";

export type { FormState };

const reportSchema = z.object({
  token: z.string().trim().min(1),
  status: z.enum(["PASS", "FAIL", "PARTIAL"]),
  findings: z.string().trim().min(10, "Bulguları en az on karakterle yaz."),
});

/**
 * A reviewer's own report submission, via their single-use email link --
 * 2026-09-06 four-role audit, Finding 1's replacement for admin
 * transcription. No session exists here at all (this route needs no login),
 * so the token itself is the sole authorization: submit_reviewer_report()
 * is granted to service_role only, and this is the one place in the app
 * that calls it -- never the admin client for anything else, and never a
 * normal session client, which auth.role() would reveal is not
 * 'service_role' and the RPC would reject outright.
 *
 * The digest is computed the same way submitQaReport's is (delivery-scoped
 * hash of status:findings), except here the delivery id is not known to the
 * caller -- the RPC resolves it from the token, so the hash covers
 * token:status:findings instead. Both are just a fixed-length fingerprint of
 * what a client is asked to trust; nothing downstream compares the two
 * hash shapes to each other.
 */
export async function submitReviewerReport(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = reportSchema.safeParse({
    token: formData.get("token"),
    status: formData.get("status"),
    findings: formData.get("findings"),
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const { token, status, findings } = parsed.data;
  const digest = createHash("sha256").update(`${token}:${status}:${findings}`).digest("hex");

  const admin = createAdminClient();
  const { error } = await admin.rpc("submit_reviewer_report", {
    p_token: token,
    p_status: status,
    p_findings: findings,
    p_document_sha256: digest,
  });

  if (error) {
    if (error.message.includes("already used")) {
      return FAIL("Bu rapor zaten gönderilmiş.");
    }
    if (error.message.includes("expired")) {
      return FAIL("Bu linkin süresi dolmuş.");
    }
    if (error.message.includes("not found")) {
      return FAIL("Bu link geçersiz.");
    }
    console.error("[submitReviewerReport]", error.message);
    return FAIL("Rapor kaydedilemedi. Tekrar dene.");
  }

  return OK("Rapor kaydedildi. Teşekkürler.");
}
