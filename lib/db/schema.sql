-- ============================================================================
-- SciFlow Database Schema: Proof of Research System
-- Optimized for Supabase (PostgreSQL)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE lab_verification_tier AS ENUM (
  'unverified',
  'basic',        -- Email verified, basic KYC
  'verified',     -- Full KYC, credentials verified
  'trusted',      -- Track record, multiple successful bounties
  'institutional' -- University/company with verified entity
);

CREATE TYPE payment_method AS ENUM (
  'stripe',
  'solana_usdc',
  'base_usdc'
);

CREATE TYPE bounty_state AS ENUM (
  'drafting',
  'protocol_review',
  'ready_for_funding',
  'funding_escrow',
  'bidding',
  'active_research',
  'milestone_review',
  'dispute_resolution',
  'external_arbitration',
  'partial_settlement',
  'completed_payout',
  'completed',
  'refunding',
  'cancelled'
);

CREATE TYPE milestone_status AS ENUM (
  'pending',
  'in_progress',
  'submitted',
  'verified',
  'rejected'
);

CREATE TYPE dispute_reason AS ENUM (
  'data_falsification',
  'protocol_deviation',
  'sample_tampering',
  'timeline_breach',
  'quality_failure',
  'communication_failure'
);

CREATE TYPE dispute_resolution AS ENUM (
  'funder_wins',
  'lab_wins',
  'partial_refund',
  'arbitration'
);

CREATE TYPE custody_event_type AS ENUM (
  'received',
  'transferred',
  'processed',
  'stored',
  'disposed',
  'shipped',
  'split'
);

-- ============================================================================
-- TABLE: Users (Funders & Labs)
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('funder', 'lab', 'admin', 'arbitrator')),
  
  -- Wallet addresses
  solana_wallet TEXT,
  evm_wallet TEXT,
  
  -- Stripe Connect
  stripe_customer_id TEXT,
  stripe_connect_account_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_solana_wallet ON users(solana_wallet);
CREATE INDEX idx_users_evm_wallet ON users(evm_wallet);

-- ============================================================================
-- TABLE: Labs (Lab Profiles)
-- ============================================================================

CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  location_country TEXT,

  -- Verification
  verification_tier lab_verification_tier DEFAULT 'unverified',
  verification_documents JSONB,

  -- Reputation
  reputation_score DECIMAL(5,2) DEFAULT 0,
  total_bounties_completed INTEGER DEFAULT 0,
  total_earnings DECIMAL(20,6) DEFAULT 0,

  -- Staking
  staking_balance DECIMAL(20,6) DEFAULT 0,
  locked_stake DECIMAL(20,6) DEFAULT 0,

  -- Team & Capabilities
  specializations TEXT[] DEFAULT '{}',
  equipment JSONB DEFAULT '[]',
  publications JSONB DEFAULT '[]',
  team_size INTEGER,
  institution_affiliation TEXT,

  -- Expertise areas (searchable)
  expertise_areas TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labs_user ON labs(user_id);
CREATE INDEX idx_labs_tier ON labs(verification_tier);
CREATE INDEX idx_labs_reputation ON labs(reputation_score DESC);
CREATE INDEX idx_labs_specializations ON labs USING GIN(specializations);

-- ============================================================================
-- TABLE: Lab Verification (Tiered Status)
-- ============================================================================

CREATE TABLE lab_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Organization info
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL, -- 'university', 'company', 'independent', 'nonprofit'
  organization_country TEXT NOT NULL,
  organization_website TEXT,
  
  -- Verification status
  tier lab_verification_tier DEFAULT 'unverified',
  tier_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- KYC/KYB documents
  kyc_verified BOOLEAN DEFAULT FALSE,
  kyc_document_hash TEXT,
  kyc_verified_at TIMESTAMPTZ,
  
  -- Credentials
  credentials JSONB DEFAULT '[]', -- Array of {type, institution, year, verified}
  publications JSONB DEFAULT '[]', -- Array of {doi, title, journal, year}
  
  -- Reputation
  total_bounties_completed INTEGER DEFAULT 0,
  total_bounties_disputed INTEGER DEFAULT 0,
  total_bounties_won_dispute INTEGER DEFAULT 0,
  reputation_score DECIMAL(5,2) DEFAULT 0, -- 0-100
  
  -- Warnings and violations
  warning_count INTEGER DEFAULT 0,
  violation_count INTEGER DEFAULT 0,
  last_violation_at TIMESTAMPTZ,
  
  -- Staking
  total_staked_amount DECIMAL(20,6) DEFAULT 0,
  total_slashed_amount DECIMAL(20,6) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_lab_verification_tier ON lab_verification(tier);
CREATE INDEX idx_lab_verification_reputation ON lab_verification(reputation_score DESC);

-- ============================================================================
-- TABLE: Bounties
-- ============================================================================

CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funder_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Protocol definition
  protocol JSONB NOT NULL DEFAULT '{
    "methodology": "",
    "dataRequirements": [],
    "qualityStandards": [],
    "ethicsApproval": null
  }',
  
  -- Financial
  total_budget DECIMAL(20,6) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'USDC')),
  payment_method payment_method,
  
  -- State machine
  current_state bounty_state DEFAULT 'drafting',
  state_history JSONB DEFAULT '[]', -- Array of {state, timestamp, actor, reason}
  
  -- Assignment
  selected_lab_id UUID REFERENCES users(id),
  selected_proposal_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  funded_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Search optimization
  search_vector TSVECTOR
);

CREATE INDEX idx_bounties_state ON bounties(current_state);
CREATE INDEX idx_bounties_funder ON bounties(funder_id);
CREATE INDEX idx_bounties_lab ON bounties(selected_lab_id);
CREATE INDEX idx_bounties_search ON bounties USING GIN(search_vector);

-- Update search vector on insert/update
CREATE OR REPLACE FUNCTION update_bounty_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.protocol->>'methodology', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bounty_search_vector_update
  BEFORE INSERT OR UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION update_bounty_search_vector();

-- ============================================================================
-- TABLE: Escrow
-- ============================================================================

CREATE TABLE escrow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE RESTRICT UNIQUE,
  
  -- Payment method
  method payment_method NOT NULL,
  
  -- Amounts
  total_amount DECIMAL(20,6) NOT NULL,
  released_amount DECIMAL(20,6) DEFAULT 0,
  refunded_amount DECIMAL(20,6) DEFAULT 0,
  slashed_amount DECIMAL(20,6) DEFAULT 0,
  
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'USDC')),
  
  -- Stripe (Fiat)
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Solana
  solana_escrow_pda TEXT,
  solana_escrow_bump INTEGER,
  solana_tx_signature TEXT,
  
  -- Base L2
  base_contract_address TEXT,
  base_deposit_tx_hash TEXT,
  
  -- State
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escrow_bounty ON escrow(bounty_id);
CREATE INDEX idx_escrow_locked ON escrow(is_locked);

-- ============================================================================
-- TABLE: Milestones
-- ============================================================================

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  
  -- Definition
  sequence_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverables JSONB DEFAULT '[]', -- Array of strings
  
  -- Financials
  payout_percentage DECIMAL(5,2) NOT NULL CHECK (payout_percentage > 0 AND payout_percentage <= 100),
  payout_amount DECIMAL(20,6) NOT NULL,
  
  -- Timeline
  due_date TIMESTAMPTZ,
  
  -- Status
  status milestone_status DEFAULT 'pending',
  
  -- Verification
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Payout tracking
  payout_tx_hash TEXT,
  payout_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(bounty_id, sequence_number)
);

CREATE INDEX idx_milestones_bounty ON milestones(bounty_id);
CREATE INDEX idx_milestones_status ON milestones(status);

-- ============================================================================
-- TABLE: Milestone Evidence (with on-chain hash)
-- ============================================================================

CREATE TABLE milestone_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Evidence description
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_type TEXT NOT NULL, -- 'raw_data', 'analysis', 'report', 'images', 'protocol_log'
  
  -- File storage
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  
  -- Integrity verification
  file_hash_sha256 TEXT NOT NULL, -- SHA256 hash of file contents
  file_hash_blake3 TEXT, -- Optional BLAKE3 for speed
  
  -- On-chain anchoring
  onchain_hash TEXT, -- Hash submitted to blockchain
  onchain_tx_signature TEXT, -- Solana tx or EVM tx hash
  onchain_block_number BIGINT,
  onchain_timestamp TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional structured data
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_milestone ON milestone_evidence(milestone_id);
CREATE INDEX idx_evidence_bounty ON milestone_evidence(bounty_id);
CREATE INDEX idx_evidence_hash ON milestone_evidence(file_hash_sha256);
CREATE INDEX idx_evidence_onchain ON milestone_evidence(onchain_tx_signature);

-- ============================================================================
-- TABLE: Chain of Custody (Sample Tracking)
-- ============================================================================

CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  
  -- Sample identification
  sample_id_external TEXT NOT NULL, -- Lab's internal sample ID
  sample_type TEXT NOT NULL, -- 'biological', 'chemical', 'digital', 'physical'
  description TEXT NOT NULL,
  
  -- Physical properties
  quantity DECIMAL(20,6),
  quantity_unit TEXT, -- 'mg', 'ml', 'units', etc.
  
  -- Storage requirements
  storage_conditions JSONB DEFAULT '{}', -- {temperature, humidity, light, etc.}
  hazard_classification TEXT,
  
  -- Current status
  current_location TEXT NOT NULL,
  current_custodian_id UUID REFERENCES users(id),
  
  -- Chain integrity
  chain_hash TEXT, -- Rolling hash of all custody events
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_samples_bounty ON samples(bounty_id);
CREATE INDEX idx_samples_external_id ON samples(sample_id_external);

CREATE TABLE chain_of_custody (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  
  -- Event details
  event_type custody_event_type NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Custody transfer
  from_custodian_id UUID REFERENCES users(id),
  to_custodian_id UUID REFERENCES users(id),
  from_location TEXT,
  to_location TEXT,
  
  -- Verification
  notes TEXT,
  evidence_photo_url TEXT,
  evidence_photo_hash TEXT,
  
  -- Digital signature
  signature_hash TEXT, -- Hash of (previous_event_hash + current_event_data)
  signed_by UUID REFERENCES users(id),
  signed_at TIMESTAMPTZ,
  
  -- On-chain anchoring (optional, for high-value samples)
  onchain_tx_signature TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custody_sample ON chain_of_custody(sample_id);
CREATE INDEX idx_custody_bounty ON chain_of_custody(bounty_id);
CREATE INDEX idx_custody_timestamp ON chain_of_custody(event_timestamp);

-- ============================================================================
-- TABLE: Proposals (Lab Bids)
-- ============================================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Proposal content
  methodology TEXT NOT NULL,
  approach_summary TEXT NOT NULL,
  timeline_days INTEGER NOT NULL,
  
  -- Financials
  bid_amount DECIMAL(20,6) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'USDC')),
  
  -- Staking (required to bid)
  staked_amount DECIMAL(20,6) NOT NULL,
  staking_tx_signature TEXT,
  stake_locked_at TIMESTAMPTZ,
  stake_released_at TIMESTAMPTZ,
  stake_slashed_at TIMESTAMPTZ,
  
  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of {name, url, hash}
  
  -- Status
  is_selected BOOLEAN DEFAULT FALSE,
  is_rejected BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_bounty ON proposals(bounty_id);
CREATE INDEX idx_proposals_lab ON proposals(lab_id);
CREATE INDEX idx_proposals_selected ON proposals(is_selected) WHERE is_selected = TRUE;

-- ============================================================================
-- TABLE: Staking Pool
-- ============================================================================

CREATE TABLE staking_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID REFERENCES users(id) ON DELETE RESTRICT UNIQUE,
  
  -- Balances
  total_staked DECIMAL(20,6) DEFAULT 0,
  available_balance DECIMAL(20,6) DEFAULT 0,
  locked_balance DECIMAL(20,6) DEFAULT 0, -- Locked in active proposals
  slashed_total DECIMAL(20,6) DEFAULT 0,
  
  -- Token info
  token_mint TEXT NOT NULL, -- Solana SPL token or EVM contract
  token_symbol TEXT DEFAULT 'USDC',
  
  -- Wallet addresses
  solana_stake_account TEXT,
  evm_stake_address TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staking_lab ON staking_pool(lab_id);

CREATE TABLE staking_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staking_pool_id UUID REFERENCES staking_pool(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdraw', 'lock', 'unlock', 'slash', 'reward')),
  amount DECIMAL(20,6) NOT NULL,
  
  -- Reference
  bounty_id UUID REFERENCES bounties(id),
  proposal_id UUID REFERENCES proposals(id),
  dispute_id UUID,
  
  -- On-chain
  tx_signature TEXT,
  block_number BIGINT,
  
  -- Balances after transaction
  balance_after DECIMAL(20,6) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staking_tx_pool ON staking_transactions(staking_pool_id);
CREATE INDEX idx_staking_tx_type ON staking_transactions(transaction_type);

-- ============================================================================
-- TABLE: Disputes
-- ============================================================================

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE RESTRICT,
  
  -- Parties
  initiated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  initiated_by_role TEXT NOT NULL CHECK (initiated_by_role IN ('funder', 'lab')),
  against_party UUID REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Reason
  reason dispute_reason NOT NULL,
  description TEXT NOT NULL,
  
  -- Evidence
  evidence_links JSONB DEFAULT '[]', -- Array of {url, hash, description}
  
  -- Resolution
  resolution dispute_resolution,
  resolution_notes TEXT,
  arbitrator_id UUID REFERENCES users(id),
  
  -- Slashing
  slash_amount DECIMAL(20,6) DEFAULT 0,
  slash_executed BOOLEAN DEFAULT FALSE,
  slash_tx_signature TEXT,
  
  -- Timeline
  created_at TIMESTAMPTZ DEFAULT NOW(),
  escalated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Status
  is_resolved BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_disputes_bounty ON disputes(bounty_id);
CREATE INDEX idx_disputes_initiator ON disputes(initiated_by);
CREATE INDEX idx_disputes_resolved ON disputes(is_resolved);

-- ============================================================================
-- TABLE: State Transitions (Audit Log)
-- ============================================================================

CREATE TABLE state_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  
  from_state bounty_state,
  to_state bounty_state NOT NULL,
  
  event_type TEXT NOT NULL,
  event_payload JSONB DEFAULT '{}',
  
  triggered_by UUID REFERENCES users(id),
  triggered_by_system BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transitions_bounty ON state_transitions(bounty_id);
CREATE INDEX idx_transitions_timestamp ON state_transitions(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Funders can view their bounties
CREATE POLICY "Funders can view own bounties" ON bounties
  FOR SELECT USING (auth.uid() = funder_id);

-- Labs can view bounties they're assigned to or are bidding
CREATE POLICY "Labs can view assigned bounties" ON bounties
  FOR SELECT USING (
    auth.uid() = selected_lab_id OR
    current_state = 'bidding'
  );

-- Labs can view/edit their own proposals
CREATE POLICY "Labs can manage own proposals" ON proposals
  FOR ALL USING (auth.uid() = lab_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to record state transition
CREATE OR REPLACE FUNCTION record_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_state IS DISTINCT FROM NEW.current_state THEN
    INSERT INTO state_transitions (bounty_id, from_state, to_state, event_type, triggered_by_system)
    VALUES (NEW.id, OLD.current_state, NEW.current_state, 'STATE_CHANGE', TRUE);
    
    -- Update state history in bounty
    NEW.state_history := COALESCE(OLD.state_history, '[]'::jsonb) || 
      jsonb_build_array(jsonb_build_object(
        'from', OLD.current_state,
        'to', NEW.current_state,
        'timestamp', NOW()
      ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bounty_state_transition
  BEFORE UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION record_state_transition();

-- Function to calculate lab reputation
CREATE OR REPLACE FUNCTION calculate_lab_reputation(lab_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  completed INT;
  disputed INT;
  won_disputes INT;
  score DECIMAL;
BEGIN
  SELECT 
    total_bounties_completed,
    total_bounties_disputed,
    total_bounties_won_dispute
  INTO completed, disputed, won_disputes
  FROM lab_verification
  WHERE user_id = lab_user_id;
  
  -- Base score from completions
  score := LEAST(completed * 5, 50);
  
  -- Penalty for disputes
  score := score - (disputed * 10);
  
  -- Bonus for winning disputes
  score := score + (won_disputes * 5);
  
  -- Clamp between 0 and 100
  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active bounties with escrow status
CREATE VIEW v_active_bounties AS
SELECT 
  b.id,
  b.title,
  b.current_state,
  b.total_budget,
  b.currency,
  b.created_at,
  e.total_amount as escrow_amount,
  e.released_amount,
  e.is_locked,
  u.full_name as funder_name,
  l.full_name as lab_name,
  lv.tier as lab_tier
FROM bounties b
LEFT JOIN escrow e ON e.bounty_id = b.id
LEFT JOIN users u ON u.id = b.funder_id
LEFT JOIN users l ON l.id = b.selected_lab_id
LEFT JOIN lab_verification lv ON lv.user_id = b.selected_lab_id
WHERE b.current_state NOT IN ('completed', 'cancelled');

-- Lab leaderboard
CREATE VIEW v_lab_leaderboard AS
SELECT 
  u.id,
  u.full_name,
  lv.organization_name,
  lv.tier,
  lv.total_bounties_completed,
  lv.reputation_score,
  lv.total_staked_amount,
  sp.available_balance as current_stake
FROM users u
JOIN lab_verification lv ON lv.user_id = u.id
LEFT JOIN staking_pool sp ON sp.lab_id = u.id
WHERE u.role = 'lab'
ORDER BY lv.reputation_score DESC;
