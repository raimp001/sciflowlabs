# LabBounty - Scientific Research Funding Platform

*Revolutionizing the way labs fundraise and researchers fund breakthrough science*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/manoj-rs-projects-36521afd/v0-stock-market-dashboard)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/teQXwnqoIk2)

## Overview

LabBounty is a platform that transforms how scientific research is funded. It enables individuals and organizations to create research bounties - funding opportunities for specific scientific problems they want solved - and connects them with world-class research labs capable of executing the work.

### Key Features

- **Create Research Bounties**: Define your research idea, set funding amounts (e.g., $50M), establish deadlines, and specify deliverables
- **Browse Available Bounties**: Labs can explore open research opportunities across various fields (oncology, neuroscience, genetics, etc.)
- **Lab Directory**: Discover verified research labs with proven track records, specialized capabilities, and success metrics
- **Milestone-Based Funding**: Structure bounties with multiple milestones for controlled fund releases
- **Advanced Filtering**: Search bounties by research area, funding amount, urgency, and status

### Use Cases

**Example Bounty:**
> "I want to identify actionable mutations in colorectal cancer through comprehensive tumor sequencing. I'm offering $50M with a 2-year deadline for a lab to sequence 10,000+ tumors, identify novel therapeutic targets, and create a mutation database for clinical use."

This platform makes it possible for anyone to fund critical research, from rare disease treatments to cancer genomics, by connecting funders directly with labs that can deliver results.

## Tech Stack

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Date Handling**: date-fns, react-day-picker
- **Forms**: React Hook Form with Zod validation
- **Data Tables**: TanStack React Table
- **Charts**: Recharts
- **Deployment**: Vercel

## Features

### For Funders
- Create detailed research bounties with funding amounts, deadlines, and specific deliverables
- Set research objectives and expected outcomes
- Structure funding with milestone-based releases
- Track bounty applications and lab performance
- Browse qualified labs with verified credentials

### For Research Labs
- Discover funding opportunities across multiple research areas
- Apply to bounties matching lab capabilities
- Showcase specializations, equipment, and past successes
- Build reputation through success rate metrics
- Access milestone-based funding

### Platform Features
- Advanced filtering and search across bounties and labs
- Real-time bounty status tracking (open, in progress, completed)
- Urgency levels (low, medium, high, critical)
- Multi-category research areas (oncology, neuroscience, genetics, etc.)
- Comprehensive lab profiles with success metrics
- Verified lab badges for trusted institutions

## Project Structure

```
/home/user/123/
├── app/                      # Next.js app directory
│   ├── bounties/            # Bounty listing and creation
│   ├── labs/                # Lab directory
│   ├── dashboard/           # Dashboard overview
│   └── page.tsx             # Landing page
├── components/              # React components
│   └── ui/                  # Shadcn/ui components
├── lib/                     # Utilities and mock data
│   ├── bounty-data.ts       # Mock bounties and labs
│   └── utils.ts             # Helper functions
├── types/                   # TypeScript definitions
│   ├── bounty.ts            # Bounty and Lab types
│   └── asset.ts             # Legacy asset types
└── styles/                  # Global styles
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Deployment

Your project is live at:

**[https://vercel.com/manoj-rs-projects-36521afd/v0-stock-market-dashboard](https://vercel.com/manoj-rs-projects-36521afd/v0-stock-market-dashboard)**

## Contributing

This platform is designed to democratize scientific research funding. Future enhancements could include:

- Real payment integration (Stripe, crypto payments)
- Smart contract integration for automated milestone releases
- Lab verification system with institutional partnerships
- Research progress tracking and reporting tools
- Peer review integration for deliverables
- Community voting on high-impact bounties
- Grant matching algorithms

## License

MIT License - Feel free to use this platform to advance scientific research!