/**
 * Placeholder for the generated schema types.
 * `npm run db:types` overwrites this file from the live Supabase project --
 * do not hand-edit it once the migrations have been applied.
 *
 * The enums below are kept in sync with supabase/migrations by hand until then,
 * because the escrow state machine is typed against them.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      user_role: "FREELANCER" | "CLIENT" | "ADMIN";
      escrow_status:
        | "DRAFT"
        | "AWAITING_PAYMENT"
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "COMPLETED"
        | "RELEASED"
        | "DISPUTED"
        | "CANCELLED";
      contract_status:
        | "DRAFT"
        | "PENDING_SIGNATURES"
        | "ACTIVE"
        | "TERMINATED"
        | "FULFILLED";
      contract_party: "FREELANCER" | "CLIENT" | "PLATFORM";
      payout_status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
      dispute_status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
    };
    CompositeTypes: Record<never, never>;
  };
};

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
