import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { authenticateApiKey } from "@/app/(dashboard)/api-key-actions";
import { runSecurityAudit } from "@/lib/security/vuln-engine";
import { enrichFindingsWithRemediation } from "@/lib/security/remediation-agent";
import { calculateHealthScore, getGradeFromScore } from "@/lib/security/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySecurityVulnerabilityAlert } from "@/lib/notify/email";
import { dispatchSecurityWebhook } from "@/lib/notify/webhook";

export const dynamic = "force-dynamic";

/**
 * Public Developer REST API: Trigger an autonomous security scan via CI/CD.
 *
 * Headers:
 *   Authorization: Bearer lx_sec_...
 *   Content-Type: application/json
 *
 * Body:
 *   { "targetUrl": "https://example.com" }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid Authorization header. Provide 'Bearer lx_sec_...'" },
      { status: 401 }
    );
  }

  const rawKey = authHeader.slice(7).trim();
  const authResult = await authenticateApiKey(rawKey);
  if (!authResult) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or revoked API key." },
      { status: 401 }
    );
  }

  const userId = authResult.userId;
  let body: { targetUrl?: string; scanType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body." },
      { status: 400 }
    );
  }

  const rawUrl = body.targetUrl?.trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: "Bad Request: 'targetUrl' field is required." },
      { status: 400 }
    );
  }

  let targetUrl = rawUrl;
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    new URL(targetUrl);
  } catch {
    return NextResponse.json(
      { error: "Bad Request: 'targetUrl' is not a valid URL format." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // An API key proves who is calling, not that they control targetUrl -- so
  // this only ever scans a target the same user already verified through the
  // dashboard's DNS_TXT/META_TAG flow (verifyTargetAction). It never creates
  // or auto-verifies one; that would let any API key holder scan any URL with
  // no ownership check at all, same class of bug a stolen/leaked key could
  // exploit at scale.
  const { data: target } = await admin
    .from("security_targets")
    .select("id, name, target_url, is_verified")
    .eq("user_id", userId)
    .eq("target_url", targetUrl)
    .maybeSingle();

  if (!target) {
    return NextResponse.json(
      {
        error:
          "Target not found. Add and verify this URL from the dashboard (/targets) before scanning it via the API.",
      },
      { status: 404 }
    );
  }

  if (!target.is_verified) {
    return NextResponse.json(
      {
        error:
          "Target is not verified yet. Complete DNS TXT or meta-tag ownership verification from the dashboard before scanning it via the API.",
        targetId: target.id,
      },
      { status: 403 }
    );
  }

  // Open scan row
  const { data: scan, error: scanErr } = await admin
    .from("security_scans")
    .insert({
      target_id: target.id,
      user_id: userId,
      scan_type: "FULL_AUDIT",
      status: "RUNNING",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (scanErr || !scan) {
    return NextResponse.json({ error: "Failed to schedule scan." }, { status: 500 });
  }

  // Execute security audit engine
  const outcome = await runSecurityAudit(targetUrl);
  if (!outcome) {
    await admin.from("security_scans").update({ status: "FAILED" }).eq("id", scan.id);
    return NextResponse.json(
      { error: "Scan Failed: Could not connect to target or address is blocked (SSRF guard)." },
      { status: 422 }
    );
  }

  // Insert vulnerabilities -- remediationPatch is replaced with an
  // LLM-tailored patch per finding (falls back to the engine's static text
  // on any generation failure, so this never blocks the scan).
  if (outcome.vulnerabilities.length > 0) {
    outcome.vulnerabilities = await enrichFindingsWithRemediation(outcome.vulnerabilities, targetUrl);
    const rows = outcome.vulnerabilities.map((v) => ({
      scan_id: scan.id,
      target_id: target!.id,
      title: v.title,
      description: v.description,
      severity: v.severity,
      category: v.category,
      cvss_score: v.cvssScore,
      affected_url: targetUrl,
      evidence: v.evidence,
      remediation_patch: v.remediationPatch,
      status: "OPEN",
    }));
    await admin.from("security_vulnerabilities").insert(rows);
  }

  const healthScore = calculateHealthScore(outcome.vulnerabilities);
  const { grade } = getGradeFromScore(healthScore);
  const criticalCount = outcome.vulnerabilities.filter((v) => v.severity === "CRITICAL").length;
  const highCount = outcome.vulnerabilities.filter((v) => v.severity === "HIGH").length;
  const mediumCount = outcome.vulnerabilities.filter((v) => v.severity === "MEDIUM").length;
  const lowCount = outcome.vulnerabilities.filter((v) => v.severity === "LOW").length;

  const summary = {
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    totalFindings: outcome.vulnerabilities.length,
    targetDetails: outcome.targetDetails,
  };

  const documentSha256 = crypto
    .createHash("sha256")
    .update(JSON.stringify({ scanId: scan.id, summary, healthScore }))
    .digest("hex");

  const completedAt = new Date().toISOString();
  await admin
    .from("security_scans")
    .update({
      status: "COMPLETED",
      health_score: healthScore,
      summary,
      document_sha256: documentSha256,
      completed_at: completedAt,
    })
    .eq("id", scan.id);

  const baseUrl = request.nextUrl.origin;
  const reportUrl = `${baseUrl}/audit/${scan.id}`;
  const badgeUrl = `${baseUrl}/api/badge/${target.id}`;

  // Dispatch webhook alerts (Slack, Discord, Custom Webhooks)
  dispatchSecurityWebhook({
    userId,
    targetName: target.name,
    targetUrl,
    scanId: scan.id,
    healthScore,
    grade,
    criticalCount,
    highCount,
    reportUrl,
  }).catch((e) => console.error("[dispatchSecurityWebhook] webhook failed:", e));

  // If severe flaws found, trigger email alert
  if (criticalCount > 0 || highCount > 0) {
    notifySecurityVulnerabilityAlert({
      toUserId: userId,
      targetName: target.name,
      targetUrl,
      healthScore,
      criticalCount,
      highCount,
      findings: outcome.vulnerabilities.map((v) => ({ title: v.title, severity: v.severity })),
      reportUrl,
    }).catch((e) => console.error("[notifySecurityVulnerabilityAlert] email failed:", e));
  }

  return NextResponse.json({
    scanId: scan.id,
    targetId: target.id,
    targetUrl,
    status: "COMPLETED",
    healthScore,
    grade,
    summary: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      total: outcome.vulnerabilities.length,
    },
    documentSha256,
    vulnerabilities: outcome.vulnerabilities.map((v) => ({
      title: v.title,
      severity: v.severity,
      category: v.category,
      cvssScore: v.cvssScore,
      remediationPatch: v.remediationPatch,
    })),
    reportUrl,
    badgeUrl,
    completedAt,
  });
}
