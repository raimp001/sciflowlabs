/**
 * SciFlow Database Types
 * Auto-generated types for Supabase - update after running migrations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'funder' | 'lab' | 'admin' | 'arbitrator'
          wallet_address_solana: string | null
          wallet_address_evm: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'funder' | 'lab' | 'admin' | 'arbitrator'
          wallet_address_solana?: string | null
          wallet_address_evm?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'funder' | 'lab' | 'admin' | 'arbitrator'
          wallet_address_solana?: string | null
          wallet_address_evm?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      labs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          website: string | null
          location_country: string | null
          verification_tier: 'unverified' | 'basic' | 'verified' | 'trusted' | 'institutional'
          verification_documents: Json | null
          reputation_score: number
          total_bounties_completed: number
          total_earnings: number
          staking_balance: number
          locked_stake: number
          specializations: string[]
          team_size: number | null
          institution_affiliation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          website?: string | null
          verification_tier?: 'unverified' | 'basic' | 'verified' | 'trusted' | 'institutional'
          verification_documents?: Json | null
          reputation_score?: number
          total_bounties_completed?: number
          total_earnings?: number
          staking_balance?: number
          locked_stake?: number
          specializations?: string[]
          team_size?: number | null
          institution_affiliation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          website?: string | null
          verification_tier?: 'unverified' | 'basic' | 'verified' | 'trusted' | 'institutional'
          verification_documents?: Json | null
          reputation_score?: number
          total_bounties_completed?: number
          total_earnings?: number
          staking_balance?: number
          locked_stake?: number
          specializations?: string[]
          team_size?: number | null
          institution_affiliation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bounties: {
        Row: {
          id: string
          funder_id: string
          selected_lab_id: string | null
          title: string
          description: string
          methodology: string
          data_requirements: string[]
          quality_standards: string[]
          ethics_approval: string | null
          total_budget: number
          currency: 'USD' | 'USDC'
          payment_method: 'stripe' | 'solana_usdc' | 'base_usdc' | null
          state: string
          state_history: Json
          deadline: string | null
          tags: string[]
          visibility: 'public' | 'private' | 'invite_only'
          min_lab_tier: 'unverified' | 'basic' | 'verified' | 'trusted' | 'institutional'
          created_at: string
          funded_at: string | null
          started_at: string | null
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          funder_id: string
          selected_lab_id?: string | null
          title: string
          description: string
          methodology: string
          data_requirements?: string[]
          quality_standards?: string[]
          ethics_approval?: string | null
          total_budget: number
          currency?: 'USD' | 'USDC'
          payment_method?: 'stripe' | 'solana_usdc' | 'base_usdc' | null
          state?: string
          state_history?: Json
          deadline?: string | null
          tags?: string[]
          visibility?: 'public' | 'private' | 'invite_only'
          min_lab_tier?: 'unverified' | 'basic' | 'verified' | 'trusted' | 'institutional'
          created_at?: string
          funded_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          funder_id?: string
          selected_lab_id?: string | null
          title?: string
          description?: string
          methodology?: string
          data_requirements?: string[]
          quality_standards?: string[]
          ethics_approval?: string | null
          total_budget?: number
          currency?: 'USD' | 'USDC'
          payment_method?: 'stripe' | 'solana_usdc' | 'base_usdc' | null
          state?: string
          state_history?: Json
          deadline?: string | null
          tags?: string[]
          visibility?: 'public' | 'private' | 'invite_only'
          min_lab_tier?: 'unverified' | 'basic' | 'verified' | 'trusted' | 'institutional'
          created_at?: string
          funded_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          bounty_id: string
          sequence: number
          title: string
          description: string
          deliverables: string[]
          payout_percentage: number
          due_date: string | null
          status: 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected'
          evidence_hash: string | null
          evidence_links: string[]
          submission_notes: string | null
          review_feedback: string | null
          submitted_at: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bounty_id: string
          sequence: number
          title: string
          description: string
          deliverables?: string[]
          payout_percentage: number
          due_date?: string | null
          status?: 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected'
          evidence_hash?: string | null
          evidence_links?: string[]
          submission_notes?: string | null
          review_feedback?: string | null
          submitted_at?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bounty_id?: string
          sequence?: number
          title?: string
          description?: string
          deliverables?: string[]
          payout_percentage?: number
          due_date?: string | null
          status?: 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected'
          evidence_hash?: string | null
          evidence_links?: string[]
          submission_notes?: string | null
          review_feedback?: string | null
          submitted_at?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          bounty_id: string
          lab_id: string
          methodology: string
          timeline_days: number
          bid_amount: number
          staked_amount: number
          status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          attachments: string[]
          team_members: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bounty_id: string
          lab_id: string
          methodology: string
          timeline_days: number
          bid_amount: number
          staked_amount: number
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          attachments?: string[]
          team_members?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bounty_id?: string
          lab_id?: string
          methodology?: string
          timeline_days?: number
          bid_amount?: number
          staked_amount?: number
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          attachments?: string[]
          team_members?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      escrows: {
        Row: {
          id: string
          bounty_id: string
          payment_method: 'stripe' | 'solana_usdc' | 'base_usdc'
          total_amount: number
          currency: 'USD' | 'USDC'
          status: 'pending' | 'locked' | 'partially_released' | 'fully_released' | 'refunded'
          stripe_payment_intent_id: string | null
          solana_escrow_pda: string | null
          solana_transaction_signature: string | null
          base_contract_address: string | null
          base_transaction_hash: string | null
          locked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bounty_id: string
          payment_method: 'stripe' | 'solana_usdc' | 'base_usdc'
          total_amount: number
          currency?: 'USD' | 'USDC'
          status?: 'pending' | 'locked' | 'partially_released' | 'fully_released' | 'refunded'
          stripe_payment_intent_id?: string | null
          solana_escrow_pda?: string | null
          solana_transaction_signature?: string | null
          base_contract_address?: string | null
          base_transaction_hash?: string | null
          locked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bounty_id?: string
          payment_method?: 'stripe' | 'solana_usdc' | 'base_usdc'
          total_amount?: number
          currency?: 'USD' | 'USDC'
          status?: 'pending' | 'locked' | 'partially_released' | 'fully_released' | 'refunded'
          stripe_payment_intent_id?: string | null
          solana_escrow_pda?: string | null
          solana_transaction_signature?: string | null
          base_contract_address?: string | null
          base_transaction_hash?: string | null
          locked_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      escrow_releases: {
        Row: {
          id: string
          escrow_id: string
          milestone_id: string
          amount: number
          transaction_hash: string | null
          released_at: string
          created_at: string
        }
        Insert: {
          id?: string
          escrow_id: string
          milestone_id: string
          amount: number
          transaction_hash?: string | null
          released_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          escrow_id?: string
          milestone_id?: string
          amount?: number
          transaction_hash?: string | null
          released_at?: string
          created_at?: string
        }
      }
      disputes: {
        Row: {
          id: string
          bounty_id: string
          initiated_by: string
          reason: 'data_falsification' | 'protocol_deviation' | 'sample_tampering' | 'timeline_breach' | 'quality_failure' | 'communication_failure'
          description: string
          evidence_links: string[]
          status: 'open' | 'under_review' | 'arbitration' | 'resolved'
          resolution: 'funder_wins' | 'lab_wins' | 'partial_refund' | null
          slash_amount: number | null
          arbitrator_id: string | null
          arbitrator_notes: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bounty_id: string
          initiated_by: string
          reason: 'data_falsification' | 'protocol_deviation' | 'sample_tampering' | 'timeline_breach' | 'quality_failure' | 'communication_failure'
          description: string
          evidence_links?: string[]
          status?: 'open' | 'under_review' | 'arbitration' | 'resolved'
          resolution?: 'funder_wins' | 'lab_wins' | 'partial_refund' | null
          slash_amount?: number | null
          arbitrator_id?: string | null
          arbitrator_notes?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bounty_id?: string
          initiated_by?: string
          reason?: 'data_falsification' | 'protocol_deviation' | 'sample_tampering' | 'timeline_breach' | 'quality_failure' | 'communication_failure'
          description?: string
          evidence_links?: string[]
          status?: 'open' | 'under_review' | 'arbitration' | 'resolved'
          resolution?: 'funder_wins' | 'lab_wins' | 'partial_refund' | null
          slash_amount?: number | null
          arbitrator_id?: string | null
          arbitrator_notes?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      staking_transactions: {
        Row: {
          id: string
          lab_id: string
          bounty_id: string | null
          type: 'deposit' | 'withdrawal' | 'lock' | 'unlock' | 'slash'
          amount: number
          balance_after: number
          transaction_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          bounty_id?: string | null
          type: 'deposit' | 'withdrawal' | 'lock' | 'unlock' | 'slash'
          amount: number
          balance_after: number
          transaction_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          bounty_id?: string | null
          type?: 'deposit' | 'withdrawal' | 'lock' | 'unlock' | 'slash'
          amount?: number
          balance_after?: number
          transaction_hash?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'bounty_update' | 'proposal_received' | 'proposal_accepted' | 'milestone_submitted' | 'milestone_approved' | 'milestone_rejected' | 'dispute_opened' | 'dispute_resolved' | 'payment_received' | 'system'
          title: string
          message: string
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'bounty_update' | 'proposal_received' | 'proposal_accepted' | 'milestone_submitted' | 'milestone_approved' | 'milestone_rejected' | 'dispute_opened' | 'dispute_resolved' | 'payment_received' | 'system'
          title: string
          message: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'bounty_update' | 'proposal_received' | 'proposal_accepted' | 'milestone_submitted' | 'milestone_approved' | 'milestone_rejected' | 'dispute_opened' | 'dispute_resolved' | 'payment_received' | 'system'
          title?: string
          message?: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          bounty_id: string | null
          action: string
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          bounty_id?: string | null
          action: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          bounty_id?: string | null
          action?: string
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_lab_reputation: {
        Args: { lab_id: string }
        Returns: number
      }
      get_bounty_statistics: {
        Args: { user_id: string }
        Returns: {
          total_funded: number
          active_bounties: number
          completed_bounties: number
          total_labs_engaged: number
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Lab = Database['public']['Tables']['labs']['Row']
export type Bounty = Database['public']['Tables']['bounties']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type Proposal = Database['public']['Tables']['proposals']['Row']
export type Escrow = Database['public']['Tables']['escrows']['Row']
export type Dispute = Database['public']['Tables']['disputes']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type StakingTransaction = Database['public']['Tables']['staking_transactions']['Row']

export type UserInsert = Database['public']['Tables']['users']['Insert']
export type LabInsert = Database['public']['Tables']['labs']['Insert']
export type BountyInsert = Database['public']['Tables']['bounties']['Insert']
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert']
export type ProposalInsert = Database['public']['Tables']['proposals']['Insert']
