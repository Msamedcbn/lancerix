import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ReviewerReportTokenInfo = {
  valid: boolean;
  reason: "used" | "expired" | null;
  contractTitle: string;
  reviewerLevel: string;
};

/**
 * What the no-login reviewer-report page needs to decide what to show,
 * before the reviewer types anything. Reads through
 * reviewer_report_token_info(), a security-definer function with a
 * hand-picked column list -- same shape as getPublicQaReport() -- so this
 * unauthenticated route needs no service-role key and cannot widen to
 * contract money or party identities by accident.
 */
export async function getReviewerReportTokenInfo(
  token: string,
): Promise<ReviewerReportTokenInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("reviewer_report_token_info", { p_token: token })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    valid: data.valid ?? false,
    reason: (data.reason as ReviewerReportTokenInfo["reason"]) ?? null,
    contractTitle: data.contract_title,
    reviewerLevel: data.reviewer_level,
  };
}
