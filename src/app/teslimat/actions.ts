"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { probeStagingTarget, calculateDeliveryDocumentSha256 } from "@/lib/delivery/seal";
import type { SealDeliveryActionResult } from "@/lib/delivery/types";
import type { Json } from "@/lib/supabase/database.types";

const SealDeliveryInputSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, "Proje adı en az 3 karakter olmalıdır.")
    .max(100, "Proje adı en fazla 100 karakter olabilir."),
  targetUrl: z
    .string()
    .trim()
    .url("Geçerli bir URL giriniz (örn: https://staging.projeniz.com)"),
  criteria: z
    .array(z.string().trim().min(3, "Kriter metni çok kısa.").max(300))
    .min(1, "En az 1 adet teslimat kabul kriteri belirtilmelidir.")
    .max(10, "En fazla 10 adet kriter girilebilir."),
  gitCommit: z.string().trim().max(100).optional().nullable(),
});

export async function sealDeliveryAction(rawInput: unknown): Promise<SealDeliveryActionResult> {
  const parsed = SealDeliveryInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Geçersiz form verisi.";
    return { success: false, error: firstError };
  }

  const { projectName, targetUrl, criteria, gitCommit } = parsed.data;

  // 1. Optional user session
  let userId: string | null = null;
  try {
    const supabaseUser = await createClient();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    userId = user?.id || null;
  } catch {
    userId = null;
  }

  // 2. Probe target URL with timeout and SSRF guard
  let proberResult;
  try {
    proberResult = await probeStagingTarget(targetUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Hedef site taranamadı.";
    return { success: false, error: message };
  }

  // 3. Calculate canonical cryptographic SHA-256 seal
  const timestamp = new Date().toISOString();
  const documentSha256 = calculateDeliveryDocumentSha256({
    projectName,
    targetUrl,
    criteria,
    gitCommit: gitCommit || null,
    proberResult,
    timestamp,
  });

  // 4. Save to delivery_seals table
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("delivery_seals")
      .insert({
        user_id: userId,
        project_name: projectName,
        target_url: targetUrl,
        criteria,
        git_commit: gitCommit || null,
        document_sha256: documentSha256,
        prober_summary: proberResult as unknown as Json,
        status: "SEALED",
      })
      .select("id, access_token")
      .single();

    if (error || !data) {
      console.error("[sealDeliveryAction] database insert error:", error);
      return {
        success: false,
        error: "Teslimat kaydı oluşturulurken bir veritabanı hatası meydana geldi.",
      };
    }

    return {
      success: true,
      accessToken: data.access_token,
      sealId: data.id,
    };
  } catch (err: unknown) {
    console.error("[sealDeliveryAction] unexpected error:", err);
    return {
      success: false,
      error: "Beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.",
    };
  }
}
