-- ============================================================================
-- SCIFLOW DATABASE SCHEMA
-- Version: 1.0.0
-- Description: Complete schema with RLS policies for the SciFlow DeSci platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('funder', 'lab', 'admin', 'arbitrator');
CREATE TYPE verification_tier AS ENUM ('unverified', 'basic', 'verified', 'trusted', 'institutional');
CREATE TYPE payment_method AS ENUM ('stripe', 'solana_usdc', 'base_usdc');
CREATE TYPE currency_type AS ENUM ('USD', 'USDC');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'submitted', 'verified', 'rejected');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE escrow_status AS ENUM ('pending', 'locked', 'partially_released', 'fully_released', 'refunded');
CREATE TYPE dispute_reason AS ENUM ('data_falsification', 'protocol_deviation', 'sample_tampering', 'timeline_breach', 'quality_failure', 'communication_failure');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'arbitration', 'resolved');
CREATE TYPE dispute_resolution AS ENUM ('funder_wins', 'lab_wins', 'partial_refund');
CREATE TYPE staking_tx_type AS ENUM ('deposit', 'withdrawal', 'lock', 'unlock', 'slash');
CREATE TYPE notification_type AS ENUM ('bounty_update', 'proposal_received', 'proposal_accepted', 'milestone_submitted', 'milestone_approved', 'milestone_rejected', 'dispute_opened', 'dispute_resolved', 'payment_received', 'system');
CREATE TYPE visibility_type AS ENUM ('public', 'private', 'invite_only');

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'funder',
  wallet_address_solana TEXT,
  wallet_address_evm TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LABS TABLE
-- ============================================================================

CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  verification_tier verification_tier NOT NULL DEFAULT 'unverified',
  verification_documents JSONB,
  verification_submitted_at TIMESTAMPTZ,
  verification_approved_at TIMESTAMPTZ,
  reputation_score INTEGER DEFAULT 0 CHECK (reputation_score >= 0 AND reputation_score <= 1000),
  total_bounties_completed INTEGER DEFAULT 0,
  total_earnings NUMERIC(18,2) DEFAULT 0,
  staking_balance NUMERIC(18,6) DEFAULT 0,
  locked_stake NUMERIC(18,6) DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  team_size INTEGER,
  institution_affiliation TEXT,
  location_country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BOUNTIES TABLE
-- ============================================================================

CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selected_lab_id UUID REFERENCES labs(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  methodology TEXT NOT NULL,
  data_requirements TEXT[] DEFAULT '{}',
  quality_standards TEXT[] DEFAULT '{}',
  ethics_approval TEXT,
  total_budget NUMERIC(18,2) NOT NULL CHECK (total_budget > 0),
  currency currency_type NOT NULL DEFAULT 'USD',
  payment_method payment_method,
  state TEXT NOT NULL DEFAULT 'drafting',
  state_history JSONB DEFAULT '[]'::JSONB,
  deadline TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  visibility visibility_type DEFAULT 'public',
  min_lab_tier verification_tier DEFAULT 'basic',
  proposal_deadline TIMESTAMPTZ,
  max_proposals INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  funded_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full-text search index
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(methodology, '')), 'C')
  ) STORED
);

CREATE INDEX bounties_search_idx ON bounties USING GIN(search_vector);
CREATE INDEX bounties_state_idx ON bounties(state);
CREATE INDEX bounties_funder_idx ON bounties(funder_id);
CREATE INDEX bounties_lab_idx ON bounties(selected_lab_id);
CREATE INDEX bounties_tags_idx ON bounties USING GIN(tags);

-- ============================================================================
-- MILESTONES TABLE
-- ============================================================================

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverables TEXT[] DEFAULT '{}',
  payout_percentage NUMERIC(5,2) NOT NULL CHECK (payout_percentage > 0 AND payout_percentage <= 100),
  due_date TIMESTAMPTZ,
  status milestone_status DEFAULT 'pending',
  evidence_hash TEXT,
  evidence_links TEXT[] DEFAULT '{}',
  submission_notes TEXT,
  review_feedback TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(bounty_id, sequence)
);

CREATE INDEX milestones_bounty_idx ON milestones(bounty_id);
CREATE INDEX milestones_status_idx ON milestones(status);

-- ============================================================================
-- PROPOSALS TABLE
-- ============================================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  methodology TEXT NOT NULL,
  timeline_days INTEGER NOT NULL CHECK (timeline_days > 0),
  bid_amount NUMERIC(18,2) NOT NULL CHECK (bid_amount > 0),
  staked_amount NUMERIC(18,6) NOT NULL DEFAULT 0,
  status proposal_status DEFAULT 'pending',
  attachments TEXT[] DEFAULT '{}',
  team_members JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(bounty_id, lab_id)
);

CREATE INDEX proposals_bounty_idx ON proposals(bounty_id);
CREATE INDEX proposals_lab_idx ON proposals(lab_id);
CREATE INDEX proposals_status_idx ON proposals(status);

-- ============================================================================
-- ESCROWS TABLE
-- ============================================================================

CREATE TABLE escrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE UNIQUE,
  payment_method payment_method NOT NULL,
  total_amount NUMERIC(18,6) NOT NULL CHECK (total_amount > 0),
  released_amount NUMERIC(18,6) DEFAULT 0,
  currency currency_type NOT NULL DEFAULT 'USD',
  status escrow_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  solana_escrow_pda TEXT,
  solana_transaction_signature TEXT,
  base_contract_address TEXT,
  base_transaction_hash TEXT,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX escrows_bounty_idx ON escrows(bounty_id);
CREATE INDEX escrows_status_idx ON escrows(status);

-- ============================================================================
-- ESCROW RELEASES TABLE
-- ============================================================================

CREATE TABLE escrow_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  amount NUMERIC(18,6) NOT NULL,
  transaction_hash TEXT,
  recipient_address TEXT,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX escrow_releases_escrow_idx ON escrow_releases(escrow_id);

-- ============================================================================
-- DISPUTES TABLE
-- ============================================================================

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES users(id),
  reason dispute_reason NOT NULL,
  description TEXT NOT NULL,
  evidence_links TEXT[] DEFAULT '{}',
  status dispute_status DEFAULT 'open',
  resolution dispute_resolution,
  slash_amount NUMERIC(18,6),
  arbitrator_id UUID REFERENCES users(id),
  arbitrator_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX disputes_bounty_idx ON disputes(bounty_id);
CREATE INDEX disputes_status_idx ON disputes(status);

-- ============================================================================
-- STAKING TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE staking_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  bounty_id UUID REFERENCES bounties(id),
  type staking_tx_type NOT NULL,
  amount NUMERIC(18,6) NOT NULL,
  balance_after NUMERIC(18,6) NOT NULL,
  transaction_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX staking_tx_lab_idx ON staking_transactions(lab_id);
CREATE INDEX staking_tx_bounty_idx ON staking_transactions(bounty_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications(user_id);
CREATE INDEX notifications_unread_idx ON notifications(user_id, read) WHERE NOT read;

-- ============================================================================
-- ACTIVITY LOGS TABLE
-- ============================================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  bounty_id UUID REFERENCES bounties(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX activity_logs_user_idx ON activity_logs(user_id);
CREATE INDEX activity_logs_bounty_idx ON activity_logs(bounty_id);
CREATE INDEX activity_logs_created_idx ON activity_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public user profiles visible" ON users FOR SELECT USING (true);

-- Labs policies
CREATE POLICY "Anyone can view verified labs" ON labs FOR SELECT USING (verification_tier != 'unverified' OR user_id = auth.uid());
CREATE POLICY "Lab owners can update their lab" ON labs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can create their lab" ON labs FOR INSERT WITH CHECK (user_id = auth.uid());

-- Bounties policies
CREATE POLICY "Public bounties visible to all" ON bounties FOR SELECT USING (visibility = 'public' OR funder_id = auth.uid() OR selected_lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid()));
CREATE POLICY "Funders can create bounties" ON bounties FOR INSERT WITH CHECK (funder_id = auth.uid());
CREATE POLICY "Funders can update their bounties" ON bounties FOR UPDATE USING (funder_id = auth.uid());

-- Milestones policies
CREATE POLICY "Milestone visibility follows bounty" ON milestones FOR SELECT USING (
  bounty_id IN (SELECT id FROM bounties WHERE visibility = 'public' OR funder_id = auth.uid() OR selected_lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid()))
);
CREATE POLICY "Funders can manage milestones" ON milestones FOR ALL USING (
  bounty_id IN (SELECT id FROM bounties WHERE funder_id = auth.uid())
);
CREATE POLICY "Labs can update assigned milestones" ON milestones FOR UPDATE USING (
  bounty_id IN (SELECT id FROM bounties WHERE selected_lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid()))
);

-- Proposals policies
CREATE POLICY "Funders see proposals for their bounties" ON proposals FOR SELECT USING (
  bounty_id IN (SELECT id FROM bounties WHERE funder_id = auth.uid()) OR 
  lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid())
);
CREATE POLICY "Labs can create proposals" ON proposals FOR INSERT WITH CHECK (
  lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid())
);
CREATE POLICY "Labs can update own proposals" ON proposals FOR UPDATE USING (
  lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid())
);

-- Escrows policies
CREATE POLICY "Bounty participants see escrow" ON escrows FOR SELECT USING (
  bounty_id IN (
    SELECT id FROM bounties 
    WHERE funder_id = auth.uid() OR selected_lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid())
  )
);

-- Notifications policies
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Staking policies
CREATE POLICY "Labs see own staking" ON staking_transactions FOR SELECT USING (
  lab_id IN (SELECT id FROM labs WHERE user_id = auth.uid())
);

-- Activity logs policies
CREATE POLICY "Users see own activity" ON activity_logs FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_labs_updated_at BEFORE UPDATE ON labs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bounties_updated_at BEFORE UPDATE ON bounties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escrows_updated_at BEFORE UPDATE ON escrows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate lab reputation score
CREATE OR REPLACE FUNCTION calculate_lab_reputation(p_lab_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_completed INTEGER;
  v_total_value NUMERIC;
  v_disputes_lost INTEGER;
  v_avg_rating NUMERIC;
BEGIN
  -- Base score from completed bounties (max 400 points)
  SELECT COUNT(*), COALESCE(SUM(b.total_budget), 0)
  INTO v_completed, v_total_value
  FROM bounties b
  WHERE b.selected_lab_id = p_lab_id AND b.state = 'completed';
  
  v_score := LEAST(v_completed * 20, 400);
  
  -- Volume bonus (max 200 points)
  v_score := v_score + LEAST(FLOOR(v_total_value / 10000), 200);
  
  -- Penalty for lost disputes (up to -200 points)
  SELECT COUNT(*) INTO v_disputes_lost
  FROM disputes d
  JOIN bounties b ON d.bounty_id = b.id
  WHERE b.selected_lab_id = p_lab_id AND d.resolution = 'funder_wins';
  
  v_score := v_score - (v_disputes_lost * 50);
  
  -- Verification tier bonus
  SELECT CASE verification_tier
    WHEN 'basic' THEN 50
    WHEN 'verified' THEN 100
    WHEN 'trusted' THEN 150
    WHEN 'institutional' THEN 200
    ELSE 0
  END INTO v_score
  FROM labs WHERE id = p_lab_id;
  
  RETURN GREATEST(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Record state transition
CREATE OR REPLACE FUNCTION record_bounty_state_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.state IS DISTINCT FROM NEW.state THEN
    NEW.state_history := NEW.state_history || jsonb_build_object(
      'from_state', OLD.state,
      'to_state', NEW.state,
      'timestamp', NOW(),
      'changed_by', auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bounty_state_change
  BEFORE UPDATE ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION record_bounty_state_change();

-- Create notification helper
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Get bounty statistics for a user
CREATE OR REPLACE FUNCTION get_bounty_statistics(p_user_id UUID)
RETURNS TABLE (
  total_funded NUMERIC,
  active_bounties BIGINT,
  completed_bounties BIGINT,
  total_labs_engaged BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN state != 'drafting' THEN total_budget ELSE 0 END), 0) as total_funded,
    COUNT(*) FILTER (WHERE state IN ('bidding', 'active_research', 'milestone_review')) as active_bounties,
    COUNT(*) FILTER (WHERE state = 'completed') as completed_bounties,
    COUNT(DISTINCT selected_lab_id) FILTER (WHERE selected_lab_id IS NOT NULL) as total_labs_engaged
  FROM bounties
  WHERE funder_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- ============================================================================
-- ADDITIONAL RPC FUNCTIONS
-- ============================================================================

-- Increment released amount in escrow (atomic operation)
CREATE OR REPLACE FUNCTION increment_escrow_released(
  p_escrow_id UUID,
  p_amount NUMERIC(18,6)
)
RETURNS NUMERIC(18,6) AS $$
DECLARE
  v_new_released NUMERIC(18,6);
BEGIN
  UPDATE escrows
  SET released_amount = released_amount + p_amount,
      updated_at = NOW()
  WHERE id = p_escrow_id
  RETURNING released_amount INTO v_new_released;

  RETURN v_new_released;
END;
$$ LANGUAGE plpgsql;

-- Append item to JSON array (for state_history)
CREATE OR REPLACE FUNCTION append_state_history(
  p_bounty_id UUID,
  p_from_state TEXT,
  p_to_state TEXT,
  p_changed_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_new_history JSONB;
BEGIN
  UPDATE bounties
  SET state_history = state_history || jsonb_build_object(
    'from_state', p_from_state,
    'to_state', p_to_state,
    'timestamp', NOW(),
    'changed_by', p_changed_by
  ),
  updated_at = NOW()
  WHERE id = p_bounty_id
  RETURNING state_history INTO v_new_history;

  RETURN v_new_history;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE bounties;
ALTER PUBLICATION supabase_realtime ADD TABLE milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE disputes;
