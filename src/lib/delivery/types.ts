import type { DeliveryProberResult } from "./seal";

export interface DeliverySealRecord {
  id: string;
  user_id: string | null;
  access_token: string;
  project_name: string;
  target_url: string;
  criteria: string[];
  git_commit: string | null;
  document_sha256: string;
  prober_summary: DeliveryProberResult;
  status: "SEALED" | "DISPUTED" | "TACITLY_ACCEPTED";
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type SealDeliveryInput = {
  projectName: string;
  targetUrl: string;
  criteria: string[];
  gitCommit?: string | null;
};

export type SealDeliveryActionResult =
  | { success: true; accessToken: string; sealId: string }
  | { success: false; error: string };
