-- ============================================================================
-- SCIFLOW SEED DATA
-- Run this in Supabase SQL Editor after running the migration
-- ============================================================================

-- Temporarily disable foreign key checks for seeding
SET session_replication_role = 'replica';

-- Create demo user entries (these would normally come from auth.users)
-- We're creating them directly for demo purposes
INSERT INTO users (id, email, full_name, role, email_verified, onboarding_completed)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'demo-funder@sciflow.io', 'Alex Chen', 'funder', true, true),
  ('00000000-0000-0000-0000-000000000002', 'demo-lab1@sciflow.io', 'Dr. Sarah Martinez', 'lab', true, true),
  ('00000000-0000-0000-0000-000000000003', 'demo-lab2@sciflow.io', 'Dr. James Wilson', 'lab', true, true),
  ('00000000-0000-0000-0000-000000000004', 'demo-lab3@sciflow.io', 'Dr. Emily Chen', 'lab', true, true),
  ('00000000-0000-0000-0000-000000000005', 'demo-lab4@sciflow.io', 'Dr. Michael Brown', 'lab', true, true),
  ('00000000-0000-0000-0000-000000000006', 'demo-lab5@sciflow.io', 'Dr. Lisa Park', 'lab', true, true)
ON CONFLICT (id) DO NOTHING;

-- Create labs
INSERT INTO labs (id, user_id, name, description, website, verification_tier, reputation_score, total_bounties_completed, total_earnings, specializations, team_size, institution_affiliation, location_country)
VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'NeuroLab AI',
    'Cutting-edge neuroscience research combining AI and brain imaging technologies. Specializing in computational neuroscience and neural network modeling.',
    'https://neurolab.mit.edu',
    'institutional',
    985,
    12,
    450000.00,
    ARRAY['neuroscience', 'machine-learning', 'brain-imaging'],
    15,
    'MIT',
    'USA'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'GenomeX Labs',
    'Pioneering genomics research with focus on CRISPR applications and personalized medicine.',
    'https://genomex.stanford.edu',
    'trusted',
    952,
    8,
    320000.00,
    ARRAY['genomics', 'crispr', 'personalized-medicine'],
    10,
    'Stanford University',
    'USA'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    'BioCompute Institute',
    'Computational biology focused on protein structure prediction and drug discovery.',
    NULL,
    'verified',
    920,
    5,
    180000.00,
    ARRAY['protein-folding', 'drug-discovery', 'bioinformatics'],
    8,
    'ETH Zurich',
    'Switzerland'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    'ClimateData Analytics',
    'Environmental research utilizing satellite data and machine learning for climate modeling.',
    NULL,
    'verified',
    887,
    4,
    95000.00,
    ARRAY['climate-science', 'data-analytics', 'remote-sensing'],
    6,
    'Oxford University',
    'UK'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000006',
    'NanoMaterials Lab',
    'Materials science research specializing in nanomaterials and energy storage solutions.',
    NULL,
    'basic',
    750,
    2,
    45000.00,
    ARRAY['materials-science', 'nanotechnology', 'energy-storage'],
    4,
    'Caltech',
    'USA'
  )
ON CONFLICT (id) DO NOTHING;

-- Create bounties
INSERT INTO bounties (id, funder_id, title, description, methodology, total_budget, currency, state, visibility, min_lab_tier, tags, deadline)
VALUES 
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Novel Protein Folding Prediction Algorithm',
    'Develop an improved algorithm for predicting protein tertiary structures using transformer-based architectures. The algorithm should achieve at least 85% accuracy on the CASP15 benchmark dataset.',
    'Use transformer architecture with attention mechanisms. Train on PDB database. Validate against CASP15 targets.',
    75000.00,
    'USDC',
    'bidding',
    'public',
    'verified',
    ARRAY['protein-folding', 'machine-learning', 'bioinformatics'],
    NOW() + INTERVAL '60 days'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Climate Model Validation with Satellite Data',
    'Validate existing climate models using 10 years of satellite observation data. Identify discrepancies and propose model improvements.',
    'Collect satellite data from NASA and ESA. Compare with IPCC model predictions. Statistical analysis of variance.',
    45000.00,
    'USDC',
    'bidding',
    'public',
    'basic',
    ARRAY['climate-science', 'satellite-data', 'modeling'],
    NOW() + INTERVAL '45 days'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Neural Interface Signal Processing',
    'Develop real-time signal processing algorithms for next-generation neural interfaces. Target latency under 10ms for 64-channel arrays.',
    'Implement on FPGA platform. Test with simulated and real neural data. Benchmark against existing solutions.',
    200000.00,
    'USDC',
    'drafting',
    'public',
    'institutional',
    ARRAY['neuroscience', 'signal-processing', 'bci'],
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Create bounty with assigned lab (active research)
INSERT INTO bounties (id, funder_id, selected_lab_id, title, description, methodology, total_budget, currency, state, visibility, min_lab_tier, tags, deadline, started_at)
VALUES 
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'CRISPR Gene Editing Efficiency Study',
    'Comprehensive study to improve CRISPR-Cas9 editing efficiency in human cell lines. Focus on reducing off-target effects while maintaining high on-target efficiency.',
    'Use modified guide RNAs and compare editing efficiency across multiple cell lines. Employ next-gen sequencing for off-target analysis.',
    120000.00,
    'USD',
    'active_research',
    'public',
    'trusted',
    ARRAY['crispr', 'gene-editing', 'genomics'],
    NOW() + INTERVAL '90 days',
    NOW() - INTERVAL '14 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create completed bounty
INSERT INTO bounties (id, funder_id, selected_lab_id, title, description, methodology, total_budget, currency, state, visibility, min_lab_tier, tags, completed_at)
VALUES 
  (
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Biodegradable Battery Materials Research',
    'Research and develop biodegradable materials for battery electrodes. Target capacity of at least 150 mAh/g with complete biodegradation within 2 years.',
    'Screen organic polymer candidates. Synthesize and characterize. Test electrochemical performance and biodegradation rates.',
    85000.00,
    'USD',
    'completed',
    'public',
    'verified',
    ARRAY['materials-science', 'sustainability', 'energy-storage'],
    NOW() - INTERVAL '7 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Create milestones for active bounty
INSERT INTO milestones (bounty_id, sequence, title, description, deliverables, payout_percentage, status)
VALUES
  ('20000000-0000-0000-0000-000000000002', 1, 'Literature Review & Protocol Design', 'Comprehensive review of current CRISPR efficiency methods and design of experimental protocol.', ARRAY['Literature review document', 'Experimental protocol'], 15.00, 'verified'),
  ('20000000-0000-0000-0000-000000000002', 2, 'Cell Line Preparation', 'Prepare and validate human cell lines for CRISPR experiments.', ARRAY['Cell line validation report', 'Stock preparation logs'], 20.00, 'verified'),
  ('20000000-0000-0000-0000-000000000002', 3, 'CRISPR Experiments', 'Conduct CRISPR editing experiments with modified guide RNAs.', ARRAY['Raw sequencing data', 'Editing efficiency metrics'], 35.00, 'in_progress'),
  ('20000000-0000-0000-0000-000000000002', 4, 'Analysis & Final Report', 'Analyze results and prepare comprehensive final report.', ARRAY['Statistical analysis', 'Final report', 'Recommendations'], 30.00, 'pending')
ON CONFLICT (bounty_id, sequence) DO NOTHING;

-- Create milestones for bidding bounty
INSERT INTO milestones (bounty_id, sequence, title, description, deliverables, payout_percentage, status)
VALUES
  ('20000000-0000-0000-0000-000000000001', 1, 'Architecture Design', 'Design transformer-based architecture for protein folding prediction.', ARRAY['Architecture document', 'Technical specifications'], 20.00, 'pending'),
  ('20000000-0000-0000-0000-000000000001', 2, 'Model Implementation', 'Implement and train the model on PDB database.', ARRAY['Trained model', 'Training logs'], 35.00, 'pending'),
  ('20000000-0000-0000-0000-000000000001', 3, 'Validation & Benchmarking', 'Validate against CASP15 targets and benchmark.', ARRAY['Benchmark results', 'Accuracy metrics'], 25.00, 'pending'),
  ('20000000-0000-0000-0000-000000000001', 4, 'Documentation', 'Complete documentation and code handover.', ARRAY['Technical documentation', 'Code repository'], 20.00, 'pending')
ON CONFLICT (bounty_id, sequence) DO NOTHING;

-- Create proposals for bidding bounties
INSERT INTO proposals (bounty_id, lab_id, methodology, timeline_days, bid_amount, status)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Our team at NeuroLab AI proposes leveraging our expertise in neural network architectures to develop a novel transformer-based approach. We will utilize our existing infrastructure for high-performance computing and extensive experience with protein structure datasets.', 120, 72000.00, 'pending'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'BioCompute Institute specializes in protein structure prediction. We propose using our proven AlphaFold-derived methods combined with new transformer innovations.', 100, 70000.00, 'pending'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'ClimateData Analytics has extensive experience with satellite data processing and climate modeling. We propose a comprehensive validation study.', 90, 42000.00, 'pending')
ON CONFLICT (bounty_id, lab_id) DO NOTHING;

-- Create escrow for active bounty
INSERT INTO escrows (bounty_id, payment_method, total_amount, released_amount, currency, status, locked_at)
VALUES
  ('20000000-0000-0000-0000-000000000002', 'stripe', 120000.00, 42000.00, 'USD', 'partially_released', NOW() - INTERVAL '14 days')
ON CONFLICT (bounty_id) DO NOTHING;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify the seed worked
SELECT 'Users created:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Labs created:', COUNT(*) FROM labs
UNION ALL
SELECT 'Bounties created:', COUNT(*) FROM bounties
UNION ALL
SELECT 'Milestones created:', COUNT(*) FROM milestones
UNION ALL
SELECT 'Proposals created:', COUNT(*) FROM proposals
UNION ALL
SELECT 'Escrows created:', COUNT(*) FROM escrows;
