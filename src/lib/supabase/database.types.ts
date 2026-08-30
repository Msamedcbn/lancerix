export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string
          created_at: string
          id: string
          legal_name: string
          owner_id: string
          tax_office: string
          vkn: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          legal_name: string
          owner_id: string
          tax_office: string
          vkn: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          legal_name?: string
          owner_id?: string
          tax_office?: string
          vkn?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          contract_id: string
          document_sha256: string
          id: string
          ip_address: unknown
          party: Database["public"]["Enums"]["contract_party"]
          signed_at: string
          signer_id: string | null
          user_agent: string
        }
        Insert: {
          contract_id: string
          document_sha256: string
          id?: string
          ip_address: unknown
          party: Database["public"]["Enums"]["contract_party"]
          signed_at?: string
          signer_id?: string | null
          user_agent: string
        }
        Update: {
          contract_id?: string
          document_sha256?: string
          id?: string
          ip_address?: unknown
          party?: Database["public"]["Enums"]["contract_party"]
          signed_at?: string
          signer_id?: string | null
          user_agent?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signatures_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          company_id: string
          coupon_id: string | null
          created_at: string
          document_sha256: string | null
          freelancer_id: string
          id: string
          platform_fee_bps: number
          reference: string
          scope_of_work: string
          status: Database["public"]["Enums"]["contract_status"]
          stopaj_bps: number
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          company_id: string
          coupon_id?: string | null
          created_at?: string
          document_sha256?: string | null
          freelancer_id: string
          id?: string
          platform_fee_bps?: number
          reference: string
          scope_of_work: string
          status?: Database["public"]["Enums"]["contract_status"]
          stopaj_bps?: number
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          company_id?: string
          coupon_id?: string | null
          created_at?: string
          document_sha256?: string | null
          freelancer_id?: string
          id?: string
          platform_fee_bps?: number
          reference?: string
          scope_of_work?: string
          status?: Database["public"]["Enums"]["contract_status"]
          stopaj_bps?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          id: string
          max_redemptions: number | null
          platform_fee_bps: number
          redemption_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          max_redemptions?: number | null
          platform_fee_bps: number
          redemption_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          max_redemptions?: number | null
          platform_fee_bps?: number
          redemption_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string
          id: string
          milestone_id: string
          raised_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          milestone_id: string
          raised_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          created_at?: string
          id?: string
          milestone_id?: string
          raised_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_status_transitions: {
        Row: {
          from_status: Database["public"]["Enums"]["escrow_status"]
          to_status: Database["public"]["Enums"]["escrow_status"]
        }
        Insert: {
          from_status: Database["public"]["Enums"]["escrow_status"]
          to_status: Database["public"]["Enums"]["escrow_status"]
        }
        Update: {
          from_status?: Database["public"]["Enums"]["escrow_status"]
          to_status?: Database["public"]["Enums"]["escrow_status"]
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          actor_id: string | null
          actor_kind: string
          client_charge_kurus: number
          created_at: string
          freelancer_net_kurus: number
          from_status: Database["public"]["Enums"]["escrow_status"] | null
          gross_amount_kurus: number
          id: string
          metadata: Json
          milestone_id: string
          platform_fee_kurus: number
          provider_reference: string | null
          reason: string | null
          tax_withholding_kurus: number
          to_status: Database["public"]["Enums"]["escrow_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_kind: string
          client_charge_kurus: number
          created_at?: string
          freelancer_net_kurus: number
          from_status?: Database["public"]["Enums"]["escrow_status"] | null
          gross_amount_kurus: number
          id?: string
          metadata?: Json
          milestone_id: string
          platform_fee_kurus: number
          provider_reference?: string | null
          reason?: string | null
          tax_withholding_kurus: number
          to_status: Database["public"]["Enums"]["escrow_status"]
        }
        Update: {
          actor_id?: string | null
          actor_kind?: string
          client_charge_kurus?: number
          created_at?: string
          freelancer_net_kurus?: number
          from_status?: Database["public"]["Enums"]["escrow_status"] | null
          gross_amount_kurus?: number
          id?: string
          metadata?: Json
          milestone_id?: string
          platform_fee_kurus?: number
          provider_reference?: string | null
          reason?: string | null
          tax_withholding_kurus?: number
          to_status?: Database["public"]["Enums"]["escrow_status"]
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          client_charge_kurus: number | null
          completed_at: string | null
          contract_id: string
          created_at: string
          due_date: string | null
          freelancer_net_kurus: number | null
          funded_at: string | null
          gross_amount_kurus: number
          id: string
          platform_fee_bps: number
          platform_fee_kurus: number | null
          released_at: string | null
          sequence_no: number
          status: Database["public"]["Enums"]["escrow_status"]
          stopaj_bps: number
          submitted_at: string | null
          tax_withholding_kurus: number | null
          title: string
          updated_at: string
        }
        Insert: {
          client_charge_kurus?: number | null
          completed_at?: string | null
          contract_id: string
          created_at?: string
          due_date?: string | null
          freelancer_net_kurus?: number | null
          funded_at?: string | null
          gross_amount_kurus: number
          id?: string
          platform_fee_bps: number
          platform_fee_kurus?: number | null
          released_at?: string | null
          sequence_no: number
          status?: Database["public"]["Enums"]["escrow_status"]
          stopaj_bps: number
          submitted_at?: string | null
          tax_withholding_kurus?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          client_charge_kurus?: number | null
          completed_at?: string | null
          contract_id?: string
          created_at?: string
          due_date?: string | null
          freelancer_net_kurus?: number | null
          funded_at?: string | null
          gross_amount_kurus?: number
          id?: string
          platform_fee_bps?: number
          platform_fee_kurus?: number | null
          released_at?: string | null
          sequence_no?: number
          status?: Database["public"]["Enums"]["escrow_status"]
          stopaj_bps?: number
          submitted_at?: string | null
          tax_withholding_kurus?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_kurus: number
          created_at: string
          failure_reason: string | null
          freelancer_id: string
          id: string
          milestone_id: string
          paid_at: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          amount_kurus: number
          created_at?: string
          failure_reason?: string | null
          freelancer_id: string
          id?: string
          milestone_id: string
          paid_at?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          amount_kurus?: number
          created_at?: string
          failure_reason?: string | null
          freelancer_id?: string
          id?: string
          milestone_id?: string
          paid_at?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payouts_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: true
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          iban: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          tckn: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          iban?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          tckn?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          iban?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          tckn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_bps: { Args: { amount: number; bps: number }; Returns: number }
      can_actor_transition: {
        Args: {
          p_from_status: Database["public"]["Enums"]["escrow_status"]
          p_is_admin: boolean
          p_is_client: boolean
          p_is_freelancer: boolean
          p_is_system: boolean
          p_to_status: Database["public"]["Enums"]["escrow_status"]
        }
        Returns: boolean
      }
      contract_company: {
        Args: { p_contract_id: string }
        Returns: {
          address: string
          id: string
          legal_name: string
          tax_office: string
          vkn: string
        }[]
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      find_counterparty: {
        Args: { p_email: string }
        Returns: {
          companies: Json
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_contract_party: { Args: { p_contract_id: string }; Returns: boolean }
      is_milestone_party: { Args: { p_milestone_id: string }; Returns: boolean }
      is_valid_tckn: { Args: { value: string }; Returns: boolean }
      is_valid_vkn: { Args: { value: string }; Returns: boolean }
      party_display_names: {
        Args: { p_ids: string[] }
        Returns: {
          full_name: string
          id: string
        }[]
      }
      transition_milestone: {
        Args: {
          p_metadata?: Json
          p_milestone_id: string
          p_provider_reference?: string
          p_reason?: string
          p_to_status: Database["public"]["Enums"]["escrow_status"]
        }
        Returns: {
          client_charge_kurus: number | null
          completed_at: string | null
          contract_id: string
          created_at: string
          due_date: string | null
          freelancer_net_kurus: number | null
          funded_at: string | null
          gross_amount_kurus: number
          id: string
          platform_fee_bps: number
          platform_fee_kurus: number | null
          released_at: string | null
          sequence_no: number
          status: Database["public"]["Enums"]["escrow_status"]
          stopaj_bps: number
          submitted_at: string | null
          tax_withholding_kurus: number | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "milestones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      contract_party: "FREELANCER" | "CLIENT" | "PLATFORM"
      contract_status:
        | "DRAFT"
        | "PENDING_SIGNATURES"
        | "ACTIVE"
        | "TERMINATED"
        | "FULFILLED"
      dispute_status: "OPEN" | "UNDER_REVIEW" | "RESOLVED"
      escrow_status:
        | "DRAFT"
        | "AWAITING_PAYMENT"
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "COMPLETED"
        | "RELEASED"
        | "DISPUTED"
        | "CANCELLED"
      payout_status: "PENDING" | "PROCESSING" | "PAID" | "FAILED"
      user_role: "FREELANCER" | "CLIENT" | "ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contract_party: ["FREELANCER", "CLIENT", "PLATFORM"],
      contract_status: [
        "DRAFT",
        "PENDING_SIGNATURES",
        "ACTIVE",
        "TERMINATED",
        "FULFILLED",
      ],
      dispute_status: ["OPEN", "UNDER_REVIEW", "RESOLVED"],
      escrow_status: [
        "DRAFT",
        "AWAITING_PAYMENT",
        "IN_PROGRESS",
        "SUBMITTED",
        "COMPLETED",
        "RELEASED",
        "DISPUTED",
        "CANCELLED",
      ],
      payout_status: ["PENDING", "PROCESSING", "PAID", "FAILED"],
      user_role: ["FREELANCER", "CLIENT", "ADMIN"],
    },
  },
} as const
