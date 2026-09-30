"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateHealthScore, getGradeFromScore, type ScanType, type VerificationMethod } from "@/lib/security/types";
import { verifyTargetOwnership } from "@/lib/security/verifier";
import { runSecurityAudit } from "@/lib/security/vuln-engine";
import { enrichFindingsWithRemediation } from "@/lib/security/remediation-agent";
import { dispatchSecurityWebhook } from "@/lib/notify/webhook";
import { notifySecurityVulnerabilityAlert } from "@/lib/notify/email";

export type SecurityActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

/**
 * Lists all registered security targets for the signed-in user.
 */
export async function getTargetsAction() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: targets, error } = await supabase
    .from("security_targets")
    .select(`
      id,
      name,
      target_url,
      verification_method,
      verification_token,
      is_verified,
      verified_at,
      created_at,
      security_scans (
        id,
        status,
        health_score,
        created_at,
        summary
      )
    `)
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getTargetsAction] error:", error);
    return [];
  }

  return targets;
}

/**
 * Registers a new web app / domain target to monitor and audit.
 */
export async function createTargetAction(formData: FormData): Promise<SecurityActionResult<{ targetId: string }>> {
  const session = await requireSession();
  const name = String(formData.get("name") || "").trim();
  let targetUrl = String(formData.get("targetUrl") || "").trim();
  const method = (String(formData.get("verificationMethod") || "DNS_TXT") as VerificationMethod) || "DNS_TXT";

  if (!name || !targetUrl) {
    return { success: false, error: "Hedef adı ve web adresi zorunludur." };
  }

  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    new URL(targetUrl);
  } catch {
    return { success: false, error: "Geçersiz web adresi formatı." };
  }

  const supabase = await createClient();
  const verificationToken = crypto.randomBytes(16).toString("hex");

  const { data, error } = await supabase
    .from("security_targets")
    .insert({
      user_id: session.userId,
      name,
      target_url: targetUrl,
      verification_method: method,
      verification_token: verificationToken,
      is_verified: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Hedef kaydedilemedi." };
  }

  revalidatePath("/targets");
  revalidatePath("/dashboard");
  return { success: true, data: { targetId: data.id }, message: "Hedef başarıyla eklendi." };
}

/**
 * Verifies domain ownership using DNS TXT or Meta tag.
 */
export async function verifyTargetAction(targetId: string): Promise<SecurityActionResult> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: target, error } = await supabase
    .from("security_targets")
    .select("id, target_url, verification_token, verification_method, is_verified")
    .eq("id", targetId)
    .eq("user_id", session.userId)
    .single();

  if (error || !target) {
    return { success: false, error: "Hedef bulunamadı." };
  }

  if (target.is_verified) {
    return { success: true, data: null, message: "Hedef zaten doğrulanmış." };
  }

  const result = await verifyTargetOwnership(
    target.target_url,
    target.verification_token,
    target.verification_method as VerificationMethod
  );

  if (!result.verified) {
    return { success: false, error: result.message };
  }

  await supabase
    .from("security_targets")
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
    })
    .eq("id", targetId);

  revalidatePath("/targets");
  revalidatePath(`/targets/${targetId}`);
  return { success: true, data: null, message: result.message };
}

/**
 * Starts an autonomous security scan & audit on a verified target.
 */
export async function startSecurityScanAction(
  targetId: string,
  scanType: ScanType = "FULL_AUDIT"
): Promise<SecurityActionResult<{ scanId: string }>> {
  const session = await requireSession();
  const admin = createAdminClient();

  // 1. Verify target exists and belongs to user
  const { data: target, error: targetError } = await admin
    .from("security_targets")
    .select("id, target_url, is_verified, name")
    .eq("id", targetId)
    .eq("user_id", session.userId)
    .single();

  if (targetError || !target) {
    return { success: false, error: "Hedef bulunamadı." };
  }

  if (!target.is_verified) {
    return {
      success: false,
      error: "Bu hedef henüz doğrulanmadı. Tarama başlatmadan önce sahiplik doğrulamasını tamamla.",
    };
  }

  // 2. Insert scan row
  const { data: scan, error: scanError } = await admin
    .from("security_scans")
    .insert({
      target_id: target.id,
      user_id: session.userId,
      scan_type: scanType,
      status: "RUNNING",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (scanError || !scan) {
    return { success: false, error: "Tarama başlatılamadı." };
  }

  // 3. Execute audit engine
  try {
    const outcome = await runSecurityAudit(target.target_url);

    if (!outcome) {
      await admin
        .from("security_scans")
        .update({
          status: "FAILED",
          completed_at: new Date().toISOString(),
        })
        .eq("id", scan.id);

      return { success: false, error: "Tarama motoru hedefe bağlanamadı veya hedef engellendi." };
    }

    // Insert logs
    if (outcome.logs.length > 0) {
      const logRows = outcome.logs.map((l) => ({
        scan_id: scan.id,
        step_name: l.stepName,
        message: l.message,
        level: l.level,
      }));
      await admin.from("security_scan_logs").insert(logRows);
    }

    // Insert vulnerabilities -- remediationPatch is replaced with an
    // LLM-tailored patch per finding (falls back to the engine's static
    // text on any generation failure, so this never blocks the scan).
    if (outcome.vulnerabilities.length > 0) {
      const enrichedVulnerabilities = await enrichFindingsWithRemediation(
        outcome.vulnerabilities,
        target.target_url,
      );
      const vulnRows = enrichedVulnerabilities.map((v) => ({
        scan_id: scan.id,
        target_id: target.id,
        title: v.title,
        description: v.description,
        severity: v.severity,
        category: v.category,
        cvss_score: v.cvssScore,
        affected_url: target.target_url,
        evidence: v.evidence,
        remediation_patch: v.remediationPatch,
        status: "OPEN",
      }));
      await admin.from("security_vulnerabilities").insert(vulnRows);
    }

    // Calculate score
    const healthScore = calculateHealthScore(outcome.vulnerabilities);
    const criticalCount = outcome.vulnerabilities.filter((v) => v.severity === "CRITICAL").length;
    const highCount = outcome.vulnerabilities.filter((v) => v.severity === "HIGH").length;
    const mediumCount = outcome.vulnerabilities.filter((v) => v.severity === "MEDIUM").length;
    const lowCount = outcome.vulnerabilities.filter((v) => v.severity === "LOW").length;
    const infoCount = outcome.vulnerabilities.filter((v) => v.severity === "INFO").length;

    const summary = {
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      totalFindings: outcome.vulnerabilities.length,
      targetDetails: outcome.targetDetails,
    };

    const documentSha256 = crypto
      .createHash("sha256")
      .update(JSON.stringify({ scanId: scan.id, summary, healthScore }))
      .digest("hex");

    await admin
      .from("security_scans")
      .update({
        status: "COMPLETED",
        health_score: healthScore,
        summary,
        document_sha256: documentSha256,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scan.id);

    // Asynchronously dispatch notifications (Slack / Discord / Custom Webhook & Email)
    const { grade } = getGradeFromScore(healthScore);
    const reportUrl = `${process.env.APP_URL || "https://lancerix.com"}/audit/${scan.id}`;

    dispatchSecurityWebhook({
      userId: session.userId,
      targetName: target.name,
      targetUrl: target.target_url,
      scanId: scan.id,
      healthScore,
      grade,
      criticalCount,
      highCount,
      reportUrl,
    }).catch((err) => console.error("[Webhook Error]:", err));

    if (criticalCount > 0 || highCount > 0) {
      notifySecurityVulnerabilityAlert({
        toUserId: session.userId,
        targetName: target.name,
        targetUrl: target.target_url,
        healthScore,
        criticalCount,
        highCount,
        findings: outcome.vulnerabilities.map((v) => ({ title: v.title, severity: v.severity })),
        reportUrl,
      }).catch((err) => console.error("[Email Alert Error]:", err));
    }

    revalidatePath("/dashboard");
    revalidatePath("/targets");
    revalidatePath(`/scans/${scan.id}`);
    return { success: true, data: { scanId: scan.id }, message: "Güvenlik taraması başarıyla tamamlandı." };
  } catch (err) {
    console.error("[startSecurityScanAction] Execution error:", err);
    await admin
      .from("security_scans")
      .update({
        status: "FAILED",
        completed_at: new Date().toISOString(),
      })
      .eq("id", scan.id);

    return { success: false, error: "Tarama sırasında beklenmeyen bir hata oluştu." };
  }
}

/**
 * Fetches single scan details along with logs and vulnerabilities.
 */
export async function getScanDetailsAction(scanId: string) {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: scan, error } = await supabase
    .from("security_scans")
    .select(`
      id,
      scan_type,
      status,
      health_score,
      summary,
      document_sha256,
      started_at,
      completed_at,
      created_at,
      security_targets (
        id,
        name,
        target_url,
        is_verified
      ),
      security_vulnerabilities (
        id,
        title,
        description,
        severity,
        category,
        cvss_score,
        affected_url,
        evidence,
        remediation_patch,
        status,
        created_at
      ),
      security_scan_logs (
        id,
        step_name,
        message,
        level,
        created_at
      )
    `)
    .eq("id", scanId)
    .eq("user_id", session.userId)
    .single();

  if (error || !scan) {
    return null;
  }

  return scan;
}

/**
 * Returns overall security stats for the dashboard header.
 */
export async function getSecurityOverviewAction() {
  const session = await requireSession();
  const supabase = await createClient();

  const [targetsRes, scansRes, vulnsRes] = await Promise.all([
    supabase.from("security_targets").select("id, is_verified").eq("user_id", session.userId),
    supabase
      .from("security_scans")
      .select("id, health_score, status, created_at")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("security_vulnerabilities")
      .select("id, severity, status")
      .eq("status", "OPEN")
      .order("created_at", { ascending: false }),
  ]);

  const targets = targetsRes.data || [];
  const scans = scansRes.data || [];
  const vulns = vulnsRes.data || [];

  const criticalCount = vulns.filter((v) => v.severity === "CRITICAL").length;
  const highCount = vulns.filter((v) => v.severity === "HIGH").length;
  const mediumCount = vulns.filter((v) => v.severity === "MEDIUM").length;
  const lowCount = vulns.filter((v) => v.severity === "LOW").length;

  const latestScan = scans[0];
  const overallScore = latestScan ? latestScan.health_score ?? 100 : 100;

  return {
    targetCount: targets.length,
    verifiedTargetCount: targets.filter((t) => t.is_verified).length,
    totalScansCount: scans.length,
    overallScore,
    vulnerabilities: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      total: vulns.length,
    },
    recentScans: scans,
  };
}

/**
 * Runs a fast, non-destructive instant security audit for homepage visitors.
 * Does not require a signed-in session; protected against SSRF.
 */
export async function runInstantAuditAction(rawUrl: string): Promise<
  SecurityActionResult<{
    url: string;
    healthScore: number;
    grade: string;
    vulnerabilitiesCount: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    findingsPreview: { title: string; severity: string }[];
    logs: { stepName: string; message: string; level: string }[];
  }>
> {
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    new URL(targetUrl);
  } catch {
    return { success: false, error: "Lütfen geçerli bir web sitesi adresi girin (örn: https://example.com)." };
  }

  try {
    const outcome = await runSecurityAudit(targetUrl);
    if (!outcome) {
      return { success: false, error: "Hedefe bağlanılamadı veya bu adres taranamıyor." };
    }

    const healthScore = calculateHealthScore(outcome.vulnerabilities);
    const criticalCount = outcome.vulnerabilities.filter((v) => v.severity === "CRITICAL").length;
    const highCount = outcome.vulnerabilities.filter((v) => v.severity === "HIGH").length;
    const mediumCount = outcome.vulnerabilities.filter((v) => v.severity === "MEDIUM").length;

    const findingsPreview = outcome.vulnerabilities.map((v) => ({
      title: v.title,
      severity: v.severity,
    }));

    return {
      success: true,
      data: {
        url: targetUrl,
        healthScore,
        grade: healthScore >= 80 ? "A" : healthScore >= 60 ? "B" : "C",
        vulnerabilitiesCount: outcome.vulnerabilities.length,
        criticalCount,
        highCount,
        mediumCount,
        findingsPreview,
        logs: outcome.logs,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: `Tarama sırasında hata oluştu: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

