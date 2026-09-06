"use server";

import { revalidatePath } from "next/cache";

import { requireRole, requireSession } from "@/lib/auth/session";
import { FAIL, firstIssue, OK, toUserMessage, type FormState } from "@/lib/forms";
import { notifyProjectRequest } from "@/lib/notify/email";
import { createClient } from "@/lib/supabase/server";
import { projectRequestSchema } from "@/lib/validations/project-request";

export type { FormState };

/**
 * A client asking one named freelancer to start a project.
 *
 * Every rule that matters -- the caller is a CLIENT, the target is a
 * FREELANCER, exactly one address, five per day -- is enforced by
 * create_project_request() in Postgres, not here. This validates shape and
 * turns lira into kurus so the RPC never sees a string that means money.
 */
export async function createProjectRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireRole("CLIENT");

  const parsed = projectRequestSchema.safeParse({
    freelancerPublicId: formData.get("freelancerPublicId") ?? "",
    freelancerEmail: formData.get("freelancerEmail") ?? "",
    title: formData.get("title"),
    brief: formData.get("brief"),
    budgetMin: formData.get("budgetMin") ?? "",
    budgetMax: formData.get("budgetMax") ?? "",
  });
  if (!parsed.success) return FAIL(firstIssue(parsed.error));

  const supabase = await createClient();
  // Both address arguments are always sent, one of them empty: the schema's
  // xor refine guarantees exactly one is filled, and create_project_request()
  // treats an empty string as "not given" the same way. Spreading them
  // conditionally instead collapses the generated RPC arg union and loses the
  // return type.
  // No .single(): the function returns one composite row, not a set, so
  // supabase-js hands back the object directly.
  const { data: request, error } = await supabase.rpc("create_project_request", {
    p_freelancer_public_id: parsed.data.freelancerPublicId,
    p_freelancer_email: parsed.data.freelancerEmail,
    p_title: parsed.data.title,
    p_brief: parsed.data.brief,
    p_budget_min_kurus: parsed.data.budgetMin ?? undefined,
    p_budget_max_kurus: parsed.data.budgetMax ?? undefined,
  });

  if (error) return FAIL(toUserMessage(error, "Talep oluşturulamadı."));
  if (!request) return FAIL("Talep oluşturulamadı.");

  // Best-effort, same rule as every other notification in this app: the
  // request is recorded whether or not the mail went out, but the caller is
  // told, because a request nobody is told about is a request that does not
  // happen.
  const sent = await notifyProjectRequest({
    toUserId: request.freelancer_id,
    fallbackEmail: request.freelancer_email,
    requestId: request.id,
    title: request.title,
    clientName: session.fullName,
  });

  revalidatePath("/client/requests");

  return sent.ok
    ? OK("Talep gönderildi.")
    : OK("Talep kaydedildi, ama bildirim e-postası iletilemedi. Linki kendin paylaşabilirsin.");
}

/**
 * The freelancer's "no". Required to carry a reason: a decline the client
 * cannot read is indistinguishable from being ignored, which is the thing
 * this whole product exists to stop.
 */
export async function declineProjectRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession();

  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return FAIL("Talep bulunamadı.");

  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) return FAIL("Kısa da olsa bir gerekçe yaz.");
  if (reason.length > 1000) return FAIL("Gerekçe en fazla 1000 karakter olabilir.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_project_request", {
    p_request_id: requestId,
    p_reason: reason,
  });

  if (error) return FAIL(toUserMessage(error, "Talep reddedilemedi."));

  revalidatePath("/freelancer");
  return OK("Talep reddedildi.");
}
