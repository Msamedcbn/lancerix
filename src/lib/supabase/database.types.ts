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
      acceptance_criteria: {
        Row: {
          check_config: Json
          check_type: string
          contract_id: string
          created_at: string
          description: string
          id: string
          milestone_id: string | null
          sequence_no: number
        }
        Insert: {
          check_config?: Json
          check_type?: string
          contract_id: string
          created_at?: string
          description: string
          id?: string
          milestone_id?: string | null
          sequence_no: number
        }
        Update: {
          check_config?: Json
          check_type?: string
          contract_id?: string
          created_at?: string
          description?: string
          id?: string
          milestone_id?: string | null
          sequence_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "acceptance_criteria_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acceptance_criteria_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          id: string
          legal_name: string
          owner_id: string
          public_id: string
          tax_office: string | null
          vkn: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          legal_name: string
          owner_id: string
          public_id: string
          tax_office?: string | null
          vkn?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          legal_name?: string
          owner_id?: string
          public_id?: string
          tax_office?: string | null
          vkn?: string | null
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
      contract_messages: {
        Row: {
          body: string
          contract_id: string
          created_at: string
          id: string
          phase_id: string | null
          sender_id: string
        }
        Insert: {
          body: string
          contract_id: string
          created_at?: string
          id?: string
          phase_id?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          contract_id?: string
          created_at?: string
          id?: string
          phase_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_messages_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_messages_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "workflow_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_messages_sender_id_fkey"
            columns: ["sender_id"]
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
          terms_version: string | null
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
          terms_version?: string | null
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
          terms_version?: string | null
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
          client_email: string
          client_id: string | null
          client_start_confirmed: boolean
          company_id: string | null
          coupon_id: string | null
          created_at: string
          document_sha256: string | null
          freelancer_id: string
          freelancer_start_confirmed: boolean
          id: string
          objection_window_days: number
          planned_start_date: string | null
          platform_fee_bps: number
          product_type: string
          project_amount_kurus: number
          project_category: Database["public"]["Enums"]["project_category"]
          reference: string
          rejection_reason: string | null
          revision_note: string | null
          scope_of_work: string
          status: Database["public"]["Enums"]["contract_status"]
          stopaj_bps: number
          title: string
          updated_at: string
          work_started_at: string | null
        }
        Insert: {
          client_email: string
          client_id?: string | null
          client_start_confirmed?: boolean
          company_id?: string | null
          coupon_id?: string | null
          created_at?: string
          document_sha256?: string | null
          freelancer_id: string
          freelancer_start_confirmed?: boolean
          id?: string
          objection_window_days?: number
          planned_start_date?: string | null
          platform_fee_bps?: number
          product_type?: string
          project_amount_kurus?: number
          project_category?: Database["public"]["Enums"]["project_category"]
          reference: string
          rejection_reason?: string | null
          revision_note?: string | null
          scope_of_work: string
          status?: Database["public"]["Enums"]["contract_status"]
          stopaj_bps?: number
          title: string
          updated_at?: string
          work_started_at?: string | null
        }
        Update: {
          client_email?: string
          client_id?: string | null
          client_start_confirmed?: boolean
          company_id?: string | null
          coupon_id?: string | null
          created_at?: string
          document_sha256?: string | null
          freelancer_id?: string
          freelancer_start_confirmed?: boolean
          id?: string
          objection_window_days?: number
          planned_start_date?: string | null
          platform_fee_bps?: number
          product_type?: string
          project_amount_kurus?: number
          project_category?: Database["public"]["Enums"]["project_category"]
          reference?: string
          rejection_reason?: string | null
          revision_note?: string | null
          scope_of_work?: string
          status?: Database["public"]["Enums"]["contract_status"]
          stopaj_bps?: number
          title?: string
          updated_at?: string
          work_started_at?: string | null
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
      deliveries: {
        Row: {
          client_note: string | null
          client_review_deadline: string | null
          contract_id: string
          decided_at: string | null
          id: string
          milestone_id: string | null
          notes: string | null
          pr_url: string | null
          staging_url: string
          status: Database["public"]["Enums"]["delivery_status"]
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          client_note?: string | null
          client_review_deadline?: string | null
          contract_id: string
          decided_at?: string | null
          id?: string
          milestone_id?: string | null
          notes?: string | null
          pr_url?: string | null
          staging_url: string
          status?: Database["public"]["Enums"]["delivery_status"]
          submitted_at?: string
          submitted_by: string
        }
        Update: {
          client_note?: string | null
          client_review_deadline?: string | null
          contract_id?: string
          decided_at?: string | null
          id?: string
          milestone_id?: string | null
          notes?: string | null
          pr_url?: string | null
          staging_url?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_events: {
        Row: {
          actor_id: string | null
          actor_kind: string
          created_at: string
          delivery_id: string
          from_status: Database["public"]["Enums"]["delivery_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["delivery_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_kind: string
          created_at?: string
          delivery_id: string
          from_status?: Database["public"]["Enums"]["delivery_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["delivery_status"]
        }
        Update: {
          actor_id?: string | null
          actor_kind?: string
          created_at?: string
          delivery_id?: string
          from_status?: Database["public"]["Enums"]["delivery_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "delivery_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_events_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_status_transitions: {
        Row: {
          from_status: Database["public"]["Enums"]["delivery_status"]
          to_status: Database["public"]["Enums"]["delivery_status"]
        }
        Insert: {
          from_status: Database["public"]["Enums"]["delivery_status"]
          to_status: Database["public"]["Enums"]["delivery_status"]
        }
        Update: {
          from_status?: Database["public"]["Enums"]["delivery_status"]
          to_status?: Database["public"]["Enums"]["delivery_status"]
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
          auto_accept_at: string | null
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
          auto_accept_at?: string | null
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
          auto_accept_at?: string | null
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
      platform_invoices: {
        Row: {
          amount_kurus: number
          client_id: string
          contract_id: string
          created_at: string
          description: string | null
          id: string
          invoice_type: string
          issued_at: string
          jobtogo_reference: string | null
          paid_at: string | null
          status: string
        }
        Insert: {
          amount_kurus?: number
          client_id: string
          contract_id: string
          created_at?: string
          description?: string | null
          id?: string
          invoice_type: string
          issued_at?: string
          jobtogo_reference?: string | null
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount_kurus?: number
          client_id?: string
          contract_id?: string
          created_at?: string
          description?: string | null
          id?: string
          invoice_type?: string
          issued_at?: string
          jobtogo_reference?: string | null
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          full_name: string
          headline: string | null
          iban: string | null
          id: string
          location: string | null
          public_id: string
          role: Database["public"]["Enums"]["user_role"]
          services: string[]
          skills: string[]
          tckn: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          headline?: string | null
          iban?: string | null
          id: string
          location?: string | null
          public_id: string
          role?: Database["public"]["Enums"]["user_role"]
          services?: string[]
          skills?: string[]
          tckn?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          headline?: string | null
          iban?: string | null
          id?: string
          location?: string | null
          public_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          services?: string[]
          skills?: string[]
          tckn?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      qa_reports: {
        Row: {
          client_review_deadline: string
          delivery_id: string
          document_sha256: string
          generated_at: string
          id: string
          pdf_storage_path: string | null
          results: Json
          status: string
          tier_order_id: string
        }
        Insert: {
          client_review_deadline: string
          delivery_id: string
          document_sha256: string
          generated_at?: string
          id?: string
          pdf_storage_path?: string | null
          results: Json
          status: string
          tier_order_id: string
        }
        Update: {
          client_review_deadline?: string
          delivery_id?: string
          document_sha256?: string
          generated_at?: string
          id?: string
          pdf_storage_path?: string | null
          results?: Json
          status?: string
          tier_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_reports_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_reports_tier_order_id_fkey"
            columns: ["tier_order_id"]
            isOneToOne: false
            referencedRelation: "qa_tier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_reviewers: {
        Row: {
          active: boolean
          avatar_storage_path: string | null
          bio: string | null
          created_at: string
          id: string
          level: string
          profile_id: string
          rate_kurus: number | null
          specialties: string[]
          years_experience: number
        }
        Insert: {
          active?: boolean
          avatar_storage_path?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          level: string
          profile_id: string
          rate_kurus?: number | null
          specialties?: string[]
          years_experience: number
        }
        Update: {
          active?: boolean
          avatar_storage_path?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          level?: string
          profile_id?: string
          rate_kurus?: number | null
          specialties?: string[]
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "qa_reviewers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_tier_orders: {
        Row: {
          created_at: string
          delivery_id: string
          fee_kurus: number
          id: string
          paid_at: string | null
          payment_status: string
          provider_reference: string | null
          reviewer_id: string | null
          tier: string
        }
        Insert: {
          created_at?: string
          delivery_id: string
          fee_kurus?: number
          id?: string
          paid_at?: string | null
          payment_status?: string
          provider_reference?: string | null
          reviewer_id?: string | null
          tier: string
        }
        Update: {
          created_at?: string
          delivery_id?: string
          fee_kurus?: number
          id?: string
          paid_at?: string | null
          payment_status?: string
          provider_reference?: string | null
          reviewer_id?: string | null
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_tier_orders_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_tier_orders_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "qa_reviewers"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_phases: {
        Row: {
          completed_at: string | null
          contract_id: string
          created_at: string
          description: string | null
          estimated_days: number | null
          id: string
          is_completed: boolean
          notes: string | null
          sequence_no: number
          title: string
        }
        Insert: {
          completed_at?: string | null
          contract_id: string
          created_at?: string
          description?: string | null
          estimated_days?: number | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          sequence_no: number
          title: string
        }
        Update: {
          completed_at?: string | null
          contract_id?: string
          created_at?: string
          description?: string | null
          estimated_days?: number | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          sequence_no?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_phases_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
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
      can_actor_transition_delivery: {
        Args: {
          p_from_status: Database["public"]["Enums"]["delivery_status"]
          p_is_admin: boolean
          p_is_client: boolean
          p_is_freelancer: boolean
          p_is_system: boolean
          p_to_status: Database["public"]["Enums"]["delivery_status"]
        }
        Returns: boolean
      }
      choose_qa_tier: {
        Args: { p_delivery_id: string; p_reviewer_id?: string; p_tier: string }
        Returns: {
          client_note: string | null
          client_review_deadline: string | null
          contract_id: string
          decided_at: string | null
          id: string
          milestone_id: string | null
          notes: string | null
          pr_url: string | null
          staging_url: string
          status: Database["public"]["Enums"]["delivery_status"]
          submitted_at: string
          submitted_by: string
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_phase: {
        Args: { p_phase_id: string }
        Returns: {
          completed_at: string | null
          contract_id: string
          created_at: string
          description: string | null
          estimated_days: number | null
          id: string
          is_completed: boolean
          notes: string | null
          sequence_no: number
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "workflow_phases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_start_date: {
        Args: { p_contract_id: string }
        Returns: {
          client_email: string
          client_id: string | null
          client_start_confirmed: boolean
          company_id: string | null
          coupon_id: string | null
          created_at: string
          document_sha256: string | null
          freelancer_id: string
          freelancer_start_confirmed: boolean
          id: string
          objection_window_days: number
          planned_start_date: string | null
          platform_fee_bps: number
          product_type: string
          project_category: Database["public"]["Enums"]["project_category"]
          reference: string
          rejection_reason: string | null
          revision_note: string | null
          scope_of_work: string
          status: Database["public"]["Enums"]["contract_status"]
          stopaj_bps: number
          title: string
          updated_at: string
          work_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
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
      contract_parties_differ: {
        Args: {
          p_client_email: string
          p_client_id: string
          p_freelancer_id: string
        }
        Returns: boolean
      }
      criterion_config_valid: {
        Args: { p_check_type: string; p_config: Json }
        Returns: boolean
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      find_by_public_id: {
        Args: { p_public_id: string }
        Returns: {
          companies: Json
          full_name: string
          id: string
          public_id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
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
      generate_public_id: { Args: never; Returns: string }
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
          public_id: string
        }[]
      }
      process_expired_deliveries: { Args: never; Returns: number }
      public_profile: {
        Args: { p_public_id: string }
        Returns: {
          bio: string
          companies: Json
          completed_contracts: number
          created_at: string
          full_name: string
          headline: string
          location: string
          public_id: string
          role: Database["public"]["Enums"]["user_role"]
          services: string[]
          skills: string[]
          website_url: string
        }[]
      }
      reject_contract: {
        Args: { p_contract_id: string; p_reason: string }
        Returns: {
          client_email: string
          client_id: string | null
          client_start_confirmed: boolean
          company_id: string | null
          coupon_id: string | null
          created_at: string
          document_sha256: string | null
          freelancer_id: string
          freelancer_start_confirmed: boolean
          id: string
          objection_window_days: number
          planned_start_date: string | null
          platform_fee_bps: number
          product_type: string
          project_category: Database["public"]["Enums"]["project_category"]
          reference: string
          rejection_reason: string | null
          revision_note: string | null
          scope_of_work: string
          status: Database["public"]["Enums"]["contract_status"]
          stopaj_bps: number
          title: string
          updated_at: string
          work_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_revision: {
        Args: { p_contract_id: string; p_note: string }
        Returns: {
          client_email: string
          client_id: string | null
          client_start_confirmed: boolean
          company_id: string | null
          coupon_id: string | null
          created_at: string
          document_sha256: string | null
          freelancer_id: string
          freelancer_start_confirmed: boolean
          id: string
          objection_window_days: number
          planned_start_date: string | null
          platform_fee_bps: number
          product_type: string
          project_category: Database["public"]["Enums"]["project_category"]
          reference: string
          rejection_reason: string | null
          revision_note: string | null
          scope_of_work: string
          status: Database["public"]["Enums"]["contract_status"]
          stopaj_bps: number
          title: string
          updated_at: string
          work_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resubmit_contract: {
        Args: { p_contract_id: string }
        Returns: {
          client_email: string
          client_id: string | null
          client_start_confirmed: boolean
          company_id: string | null
          coupon_id: string | null
          created_at: string
          document_sha256: string | null
          freelancer_id: string
          freelancer_start_confirmed: boolean
          id: string
          objection_window_days: number
          planned_start_date: string | null
          platform_fee_bps: number
          product_type: string
          project_category: Database["public"]["Enums"]["project_category"]
          reference: string
          rejection_reason: string | null
          revision_note: string | null
          scope_of_work: string
          status: Database["public"]["Enums"]["contract_status"]
          stopaj_bps: number
          title: string
          updated_at: string
          work_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sign_contract: {
        Args: {
          p_contract_id: string
          p_document_sha256: string
          p_ip: unknown
          p_terms_version?: string
          p_user_agent: string
        }
        Returns: {
          client_email: string
          client_id: string | null
          client_start_confirmed: boolean
          company_id: string | null
          coupon_id: string | null
          created_at: string
          document_sha256: string | null
          freelancer_id: string
          freelancer_start_confirmed: boolean
          id: string
          objection_window_days: number
          planned_start_date: string | null
          platform_fee_bps: number
          product_type: string
          project_category: Database["public"]["Enums"]["project_category"]
          reference: string
          rejection_reason: string | null
          revision_note: string | null
          scope_of_work: string
          status: Database["public"]["Enums"]["contract_status"]
          stopaj_bps: number
          title: string
          updated_at: string
          work_started_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "contracts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_qa_report: {
        Args: {
          p_contract_id: string
          p_delivery_id: string
          p_document_sha256: string
          p_findings: string
          p_status: string
        }
        Returns: {
          client_note: string | null
          client_review_deadline: string | null
          contract_id: string
          decided_at: string | null
          id: string
          milestone_id: string | null
          notes: string | null
          pr_url: string | null
          staging_url: string
          status: Database["public"]["Enums"]["delivery_status"]
          submitted_at: string
          submitted_by: string
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transition_delivery: {
        Args: {
          p_delivery_id: string
          p_reason?: string
          p_to_status: Database["public"]["Enums"]["delivery_status"]
        }
        Returns: {
          client_note: string | null
          client_review_deadline: string | null
          contract_id: string
          decided_at: string | null
          id: string
          milestone_id: string | null
          notes: string | null
          pr_url: string | null
          staging_url: string
          status: Database["public"]["Enums"]["delivery_status"]
          submitted_at: string
          submitted_by: string
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
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
          auto_accept_at: string | null
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
        | "PENDING_REVIEW"
        | "REVISION_REQUESTED"
        | "REJECTED"
        | "PENDING_SIGNATURES"
        | "ACTIVE"
        | "TERMINATED"
        | "FULFILLED"
      delivery_status:
        | "SUBMITTED"
        | "QA_QUEUED"
        | "QA_DONE"
        | "AWAITING_CLIENT"
        | "ACCEPTED"
        | "REJECTED"
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
      project_category:
        | "SOFTWARE"
        | "DESIGN"
        | "VIDEO"
        | "CONTENT"
        | "MARKETING"
        | "OTHER"
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
        "PENDING_REVIEW",
        "REVISION_REQUESTED",
        "REJECTED",
        "PENDING_SIGNATURES",
        "ACTIVE",
        "TERMINATED",
        "FULFILLED",
      ],
      delivery_status: [
        "SUBMITTED",
        "QA_QUEUED",
        "QA_DONE",
        "AWAITING_CLIENT",
        "ACCEPTED",
        "REJECTED",
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
      project_category: [
        "SOFTWARE",
        "DESIGN",
        "VIDEO",
        "CONTENT",
        "MARKETING",
        "OTHER",
      ],
      user_role: ["FREELANCER", "CLIENT", "ADMIN"],
    },
  },
} as const
