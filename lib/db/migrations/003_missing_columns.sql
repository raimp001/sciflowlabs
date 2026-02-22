-- ============================================================================
-- Migration 003: Missing Columns & Tables
-- Adds columns referenced by API routes but missing from initial schema
-- Run this against your Supabase project SQL editor
-- ============================================================================

-- ── milestones: columns used by API routes ──────────────────────────
ALTER TABLE milestones
  ADD COLUMN IF NOT EXISTS submission_notes TEXT,
  ADD COLUMN IF NOT EXISTS evidence_links JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS evidence_hash TEXT,
  ADD COLUMN IF NOT EXISTS evidence_ipfs_url TEXT,
  ADD COLUMN IF NOT EXISTS submission_url TEXT,
  ADD COLUMN IF NOT EXISTS review_feedback TEXT,
  ADD COLUMN IF NOT EXISTS overdue_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_percentage DECIMAL(5,2) DEFAULT 0;

-- Add 'overdue' to milestone_status enum
-- (Run ONLY if the enum doesn't already have 'overdue')
DO $$ BEGIN
  ALTER TYPE milestone_status ADD VALUE IF NOT EXISTS 'overdue';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── bounties: columns used by API routes ────────────────────────────
ALTER TABLE bounties
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'
    CHECK (visibility IN ('public', 'private', 'invite_only')),
  ADD COLUMN IF NOT EXISTS min_lab_tier TEXT DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS openclaw_trace_id TEXT,
  ADD COLUMN IF NOT EXISTS openclaw_score INTEGER,
  ADD COLUMN IF NOT EXISTS openclaw_decision TEXT,
  ADD COLUMN IF NOT EXISTS requires_ethics_review BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_irb BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS state_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS peer_review_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS peer_review_threshold INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS irb_document_url TEXT,
  ADD COLUMN IF NOT EXISTS irb_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS proposal_deadline TIMESTAMPTZ;

-- ── proposals: columns used by API routes ──────────────────────────
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS openclaw_score INTEGER,
  ADD COLUMN IF NOT EXISTS openclaw_decision TEXT,
  ADD COLUMN IF NOT EXISTS openclaw_signals JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS peer_review_status TEXT DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS peer_review_approvals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS peer_review_rejections INTEGER DEFAULT 0;

-- ── escrow_releases table (referenced by milestone PATCH route) ──────────
CREATE TABLE IF NOT EXISTS escrow_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES escrow(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  amount DECIMAL(20,6) NOT NULL,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  tx_signature TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_escrow_releases_escrow ON escrow_releases(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_releases_milestone ON escrow_releases(milestone_id);

-- ── activity_logs table (referenced by many routes) ────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  bounty_id UUID REFERENCES bounties(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_bounty ON activity_logs(bounty_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ── notifications table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read)
  WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_releases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can mark own notifications read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Service role can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY IF NOT EXISTS "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ── Update bounty state enum to include admin_review ────────────────────
-- The API uses 'admin_review' but schema might call it 'protocol_review'
-- Add if missing
DO $$ BEGIN
  ALTER TYPE bounty_state ADD VALUE IF NOT EXISTS 'admin_review' AFTER 'drafting';
  ALTER TYPE bounty_state ADD VALUE IF NOT EXISTS 'overdue' AFTER 'active_research';
  ALTER TYPE bounty_state ADD VALUE IF NOT EXISTS 'refunding' AFTER 'completed';
  ALTER TYPE bounty_state ADD VALUE IF NOT EXISTS 'lab_selected' AFTER 'bidding';
  ALTER TYPE bounty_state ADD VALUE IF NOT EXISTS 'proposal_review' AFTER 'bidding';
  ALTER TYPE bounty_state ADD VALUE IF NOT EXISTS 'milestone_review' AFTER 'active_research';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Backfill: migrate 'state' column to 'current_state' alias if needed ──────
-- The schema uses current_state but some code references 'state'
-- Add a generated column alias so both work
ALTER TABLE bounties
  ADD COLUMN IF NOT EXISTS state TEXT
  GENERATED ALWAYS AS (current_state::text) STORED;
-- Note: If the above fails (current_state is the column, state is alias),
-- swap them: rename current_state to state, then add current_state as alias.
-- Check which column actually exists first.

-- ── proposal_reviews table (peer review gate) ─────────────────────────
CREATE TABLE IF NOT EXISTS proposal_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_blind BOOLEAN DEFAULT TRUE,
  score_scientific_merit INTEGER CHECK (score_scientific_merit BETWEEN 1 AND 5),
  score_feasibility INTEGER CHECK (score_feasibility BETWEEN 1 AND 5),
  score_innovation INTEGER CHECK (score_innovation BETWEEN 1 AND 5),
  score_team_qualifications INTEGER CHECK (score_team_qualifications BETWEEN 1 AND 5),
  score_ethics_compliance INTEGER CHECK (score_ethics_compliance BETWEEN 1 AND 5),
  overall_score DECIMAL(4,2),
  strengths TEXT,
  weaknesses TEXT,
  requested_revisions TEXT,
  decision TEXT CHECK (decision IN ('approve', 'revise', 'reject')),
  conflict_of_interest BOOLEAN DEFAULT FALSE,
  conflict_details TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_reviews_proposal ON proposal_reviews(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_reviews_reviewer ON proposal_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_proposal_reviews_bounty ON proposal_reviews(bounty_id);

ALTER TABLE proposal_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Reviewers can view own reviews"
  ON proposal_reviews FOR SELECT
  USING (auth.uid() = reviewer_id);

CREATE POLICY IF NOT EXISTS "Service role manages proposal reviews"
  ON proposal_reviews FOR ALL
  USING (TRUE);
