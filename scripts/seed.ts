/**
 * SciFlow Database Seed Script
 *
 * WARNING: This script populates the database with sample/demo data.
 * DO NOT run in production environments!
 *
 * Run with: pnpm seed
 *
 * Environment:
 * - NODE_ENV must NOT be 'production'
 * - Set SEED_ALLOW_PRODUCTION=true to override (at your own risk)
 */

import { createClient } from '@supabase/supabase-js'

// Production safety check
const isProduction = process.env.NODE_ENV === 'production'
const forceAllow = process.env.SEED_ALLOW_PRODUCTION === 'true'

if (isProduction && !forceAllow) {
  console.error('❌ ERROR: Cannot run seed script in production!')
  console.error('')
  console.error('This script creates demo accounts with weak passwords.')
  console.error('It should ONLY be used for development and testing.')
  console.error('')
  console.error('If you really need to seed production data, set:')
  console.error('  SEED_ALLOW_PRODUCTION=true')
  console.error('')
  console.error('But consider creating a separate production seed script instead.')
  process.exit(1)
}

if (forceAllow) {
  console.warn('⚠️  WARNING: Running seed script with SEED_ALLOW_PRODUCTION=true')
  console.warn('⚠️  Demo accounts will be created with weak passwords!')
  console.warn('')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Sample data
const sampleUsers = [
  {
    email: 'funder@sciflow.demo',
    password: 'demo123456',
    full_name: 'Alex Chen',
    role: 'funder',
  },
  {
    email: 'lab@sciflow.demo',
    password: 'demo123456',
    full_name: 'Dr. Sarah Martinez',
    role: 'lab',
  },
  {
    email: 'admin@sciflow.demo',
    password: 'demo123456',
    full_name: 'Admin User',
    role: 'admin',
  },
]

const sampleLabs = [
  {
    name: 'NeuroLab AI',
    institution: 'MIT',
    bio: 'Cutting-edge neuroscience research combining AI and brain imaging technologies. Specializing in computational neuroscience and neural network modeling.',
    verification_tier: 'institutional',
    reputation_score: 98.5,
    expertise_areas: ['neuroscience', 'machine-learning', 'brain-imaging'],
    country: 'USA',
    website: 'https://neurolab.mit.edu',
    is_active: true,
  },
  {
    name: 'GenomeX Labs',
    institution: 'Stanford University',
    bio: 'Pioneering genomics research with focus on CRISPR applications and personalized medicine.',
    verification_tier: 'trusted',
    reputation_score: 95.2,
    expertise_areas: ['genomics', 'crispr', 'personalized-medicine'],
    country: 'USA',
    website: 'https://genomex.stanford.edu',
    is_active: true,
  },
  {
    name: 'BioCompute Institute',
    institution: 'ETH Zurich',
    bio: 'Computational biology focused on protein structure prediction and drug discovery.',
    verification_tier: 'verified',
    reputation_score: 92.0,
    expertise_areas: ['protein-folding', 'drug-discovery', 'bioinformatics'],
    country: 'Switzerland',
    is_active: true,
  },
  {
    name: 'ClimateData Analytics',
    institution: 'Oxford University',
    bio: 'Environmental research utilizing satellite data and machine learning for climate modeling.',
    verification_tier: 'verified',
    reputation_score: 88.7,
    expertise_areas: ['climate-science', 'data-analytics', 'remote-sensing'],
    country: 'UK',
    is_active: true,
  },
  {
    name: 'NanoMaterials Lab',
    institution: 'Caltech',
    bio: 'Materials science research specializing in nanomaterials and energy storage solutions.',
    verification_tier: 'basic',
    reputation_score: 75.0,
    expertise_areas: ['materials-science', 'nanotechnology', 'energy-storage'],
    country: 'USA',
    is_active: true,
  },
]

const sampleBounties = [
  {
    title: 'Novel Protein Folding Prediction Algorithm',
    description: 'Develop an improved algorithm for predicting protein tertiary structures using transformer-based architectures. The algorithm should achieve at least 85% accuracy on the CASP15 benchmark dataset.',
    methodology: 'Use transformer architecture with attention mechanisms. Train on PDB database. Validate against CASP15 targets.',
    total_budget: 75000,
    currency: 'USDC',
    state: 'bidding',
    visibility: 'public',
    min_lab_tier: 'verified',
    tags: ['protein-folding', 'machine-learning', 'bioinformatics'],
  },
  {
    title: 'CRISPR Gene Editing Efficiency Study',
    description: 'Comprehensive study to improve CRISPR-Cas9 editing efficiency in human cell lines. Focus on reducing off-target effects while maintaining high on-target efficiency.',
    methodology: 'Use modified guide RNAs and compare editing efficiency across multiple cell lines. Employ next-gen sequencing for off-target analysis.',
    total_budget: 120000,
    currency: 'USD',
    state: 'active_research',
    visibility: 'public',
    min_lab_tier: 'trusted',
    tags: ['crispr', 'gene-editing', 'genomics'],
  },
  {
    title: 'Climate Model Validation with Satellite Data',
    description: 'Validate existing climate models using 10 years of satellite observation data. Identify discrepancies and propose model improvements.',
    methodology: 'Collect satellite data from NASA and ESA. Compare with IPCC model predictions. Statistical analysis of variance.',
    total_budget: 45000,
    currency: 'USDC',
    state: 'bidding',
    visibility: 'public',
    min_lab_tier: 'basic',
    tags: ['climate-science', 'satellite-data', 'modeling'],
  },
  {
    title: 'Neural Interface Signal Processing',
    description: 'Develop real-time signal processing algorithms for next-generation neural interfaces. Target latency under 10ms for 64-channel arrays.',
    methodology: 'Implement on FPGA platform. Test with simulated and real neural data. Benchmark against existing solutions.',
    total_budget: 200000,
    currency: 'USDC',
    state: 'drafting',
    visibility: 'private',
    min_lab_tier: 'institutional',
    tags: ['neuroscience', 'signal-processing', 'bci'],
  },
  {
    title: 'Biodegradable Battery Materials',
    description: 'Research and develop biodegradable materials for battery electrodes. Target capacity of at least 150 mAh/g with complete biodegradation within 2 years.',
    methodology: 'Screen organic polymer candidates. Synthesize and characterize. Test electrochemical performance and biodegradation rates.',
    total_budget: 85000,
    currency: 'USD',
    state: 'completed',
    visibility: 'public',
    min_lab_tier: 'verified',
    tags: ['materials-science', 'sustainability', 'energy-storage'],
  },
]

async function seed() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Create users
    console.log('Creating users...')
    const createdUsers: { id: string; email: string; role: string }[] = []
    
    for (const userData of sampleUsers) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      })

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`  ⚠️  User ${userData.email} already exists, skipping...`)
          // Get existing user
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', userData.email)
            .single()
          if (existing) {
            createdUsers.push({ id: existing.id, email: userData.email, role: userData.role })
          }
          continue
        }
        throw authError
      }

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authUser.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
      })

      if (profileError && !profileError.message.includes('duplicate')) {
        throw profileError
      }

      createdUsers.push({ id: authUser.user.id, email: userData.email, role: userData.role })
      console.log(`  ✅ Created user: ${userData.email}`)
    }

    // Get the lab user
    const labUser = createdUsers.find(u => u.role === 'lab')
    const funderUser = createdUsers.find(u => u.role === 'funder')

    // Create labs
    console.log('\nCreating labs...')
    const createdLabs: { id: string; name: string }[] = []
    
    for (let i = 0; i < sampleLabs.length; i++) {
      const labData = sampleLabs[i]
      
      // Create a user for each lab (except the first one which uses labUser)
      let userId = i === 0 && labUser ? labUser.id : null

      if (!userId) {
        const labEmail = `lab${i + 1}@sciflow.demo`
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: labEmail,
          password: 'demo123456',
          email_confirm: true,
        })

        if (authError && !authError.message.includes('already exists')) {
          throw authError
        }

        if (authUser?.user) {
          userId = authUser.user.id
          await supabase.from('users').insert({
            id: userId,
            email: labEmail,
            full_name: labData.name,
            role: 'lab',
          })
        }
      }

      if (userId) {
        const { data: lab, error: labError } = await supabase
          .from('labs')
          .insert({ ...labData, user_id: userId })
          .select()
          .single()

        if (labError && !labError.message.includes('duplicate')) {
          throw labError
        }

        if (lab) {
          createdLabs.push({ id: lab.id, name: lab.name })
          console.log(`  ✅ Created lab: ${labData.name}`)
        }
      }
    }

    // Create bounties
    console.log('\nCreating bounties...')
    
    if (funderUser) {
      for (const bountyData of sampleBounties) {
        const { data: bounty, error: bountyError } = await supabase
          .from('bounties')
          .insert({
            ...bountyData,
            funder_id: funderUser.id,
            state_history: [{ state: bountyData.state, timestamp: new Date().toISOString(), by: funderUser.id }],
          })
          .select()
          .single()

        if (bountyError && !bountyError.message.includes('duplicate')) {
          console.error(`  ❌ Error creating bounty: ${bountyError.message}`)
          continue
        }

        if (bounty) {
          // Create milestones for this bounty
          const milestones = [
            { sequence: 1, title: 'Literature Review', payout_percentage: 15, status: 'pending' },
            { sequence: 2, title: 'Initial Implementation', payout_percentage: 30, status: 'pending' },
            { sequence: 3, title: 'Testing & Validation', payout_percentage: 30, status: 'pending' },
            { sequence: 4, title: 'Final Report', payout_percentage: 25, status: 'pending' },
          ]

          for (const milestone of milestones) {
            await supabase.from('milestones').insert({
              bounty_id: bounty.id,
              ...milestone,
              description: `${milestone.title} deliverable for the research project`,
              deliverables: [`${milestone.title} document`, 'Supporting data'],
            })
          }

          console.log(`  ✅ Created bounty: ${bountyData.title}`)
        }
      }
    }

    // Create some sample proposals
    console.log('\nCreating proposals...')
    
    const { data: biddingBounties } = await supabase
      .from('bounties')
      .select('id')
      .eq('state', 'bidding')
      .limit(2)

    if (biddingBounties && createdLabs.length > 0) {
      for (const bounty of biddingBounties) {
        for (let i = 0; i < Math.min(2, createdLabs.length); i++) {
          const { error: proposalError } = await supabase.from('proposals').insert({
            bounty_id: bounty.id,
            lab_id: createdLabs[i].id,
            methodology: 'Our team proposes a comprehensive approach utilizing state-of-the-art techniques...',
            timeline: 'Phase 1: 4 weeks, Phase 2: 6 weeks, Phase 3: 4 weeks',
            status: 'submitted',
          })

          if (proposalError && !proposalError.message.includes('duplicate')) {
            console.error(`  ❌ Error creating proposal: ${proposalError.message}`)
          }
        }
      }
      console.log(`  ✅ Created sample proposals`)
    }

    console.log('\n✨ Database seeding complete!')
    console.log('\n📋 Demo Accounts (DEVELOPMENT ONLY):')
    console.log('   Funder: funder@sciflow.demo / demo123456')
    console.log('   Lab: lab@sciflow.demo / demo123456')
    console.log('   Admin: admin@sciflow.demo / demo123456')
    console.log('')
    console.log('⚠️  SECURITY WARNING: These accounts use weak passwords.')
    console.log('   Never use these credentials in production!')
    console.log('   Delete these accounts or change passwords before going live.')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
