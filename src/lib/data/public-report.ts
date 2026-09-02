import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PublicQaReport = {
  contractTitle: string;
  projectCategory: string;
  criteria: string[];
  status: string;
  documentSha256: string;
  generatedAt: string;
};

/**
 * A freelancer-shared QA report as a stranger sees it (Faz E #1). Reads
 * through public_qa_report(), a security-definer function returning a
 * hand-picked column list, so this unauthenticated route needs no
 * service-role key and cannot widen to contract money, party identities, or
 * anything else by accident -- same shape as getPublicProfile().
 */
export async function getPublicQaReport(token: string): Promise<PublicQaReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("public_qa_report", { p_token: token })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    contractTitle: data.contract_title,
    projectCategory: data.project_category,
    criteria: data.criteria ?? [],
    status: data.status,
    documentSha256: data.document_sha256,
    generatedAt: data.generated_at,
  };
}
