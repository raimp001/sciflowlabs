# SciFlow - Decentralized Science Research Bounty Platform

SciFlow is a platform that connects research funders with verified labs to fund scientific research through bounties. Built with Next.js and deployed on Vercel.

## Overview

SciFlow enables:
- **Funders** to create research bounties with clear protocols, milestones, and budgets
- **Labs** to submit proposals and conduct research
- **Secure escrow** payments via Stripe, Solana (USDC), or Base (USDC)
- **Milestone-based** payouts to ensure research quality
- **Dispute resolution** for conflict management

## Key Features

- **Bounty Management**: Create, fund, and manage research bounties with structured milestones
- **Lab Verification**: Tiered verification system (unverified, basic, verified, trusted, institutional)
- **Multi-Payment Support**: Stripe for fiat, Solana and Base for crypto payments
- **State Machine**: Robust bounty lifecycle management (drafting → funding → bidding → active research → completion)
- **Real-time Updates**: Live notifications and bounty status tracking
- **Escrow System**: Secure fund holding with milestone-based release

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe, Solana Web3.js, Coinbase CDP SDK
- **State Management**: XState for bounty lifecycle

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Stripe account (for fiat payments)

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### Installation

```bash
pnpm install
pnpm dev
```

### Database Setup

Run the migration in your Supabase SQL editor:

```bash
# Copy the contents of lib/db/migrations/001_initial_schema.sql
```

## Project Structure

```
├── app/                    # Next.js app router pages and API routes
│   ├── api/               # API endpoints
│   │   ├── bounties/      # Bounty CRUD and transitions
│   │   ├── proposals/     # Proposal management
│   │   └── payments/      # Payment processing
│   ├── dashboard/         # User dashboard pages
│   └── bounties/          # Public bounty pages
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── db/               # Database schema and migrations
│   ├── machines/         # XState state machines
│   ├── payments/         # Payment provider integrations
│   └── supabase/         # Supabase client configuration
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## Bounty Lifecycle States

1. **Drafting** - Funder creates bounty with protocols and milestones
2. **Ready for Funding** - Protocol validated, awaiting escrow deposit
3. **Funding Escrow** - Funds being secured
4. **Bidding** - Labs submit proposals
5. **Active Research** - Selected lab conducts research
6. **Milestone Review** - Funder reviews submitted deliverables
7. **Completed** - All milestones verified, funds released

## License

MIT
