import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGradeFromScore } from "@/lib/security/types";

export const dynamic = "force-dynamic";

/**
 * Returns an embeddable SVG security verification badge for a target website.
 * Usage: <img src="https://lancerix.com/api/badge/{targetId}" alt="Lancerix Security Grade" />
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  const { targetId } = await params;
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("security_targets")
    .select("id, name, target_url, is_verified")
    .eq("id", targetId)
    .maybeSingle();

  if (!target || !target.is_verified) {
    const svg = generateBadgeSvg("Lancerix", "Unverified", "#71717a");
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  // Fetch latest completed scan
  const { data: scan } = await admin
    .from("security_scans")
    .select("health_score, status, completed_at")
    .eq("target_id", target.id)
    .eq("status", "COMPLETED")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const score = scan?.health_score ?? 100;
  const { grade } = getGradeFromScore(score);

  let badgeColor = "#10b981"; // Emerald
  if (score < 60) badgeColor = "#ef4444"; // Red
  else if (score < 80) badgeColor = "#f59e0b"; // Amber

  const rightText = `Secured ${grade} (%${score})`;
  const svg = generateBadgeSvg("Lancerix Security", rightText, badgeColor);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function generateBadgeSvg(leftText: string, rightText: string, rightColor: string): string {
  const leftWidth = leftText.length * 6.5 + 24;
  const rightWidth = rightText.length * 6.5 + 24;
  const totalWidth = leftWidth + rightWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" viewBox="0 0 ${totalWidth} 24" role="img" aria-label="${leftText}: ${rightText}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="24" rx="4" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="24" fill="#18181b"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="24" fill="${rightColor}"/>
    <rect width="${totalWidth}" height="24" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" text-rendering="geometricPrecision" font-size="11" font-weight="600">
    <!-- Shield Icon on Left -->
    <path d="M7 6l4-2 4 2v4c0 2.5-1.8 4.7-4 5.3-2.2-.6-4-2.8-4-5.3V6z" fill="none" stroke="#a1a1aa" stroke-width="1.2" transform="translate(4, 2) scale(0.8)"/>
    <text x="${(leftWidth + 14) / 2}" y="16" fill="#e4e4e7">${leftText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="16">${rightText}</text>
  </g>
</svg>`;
}
