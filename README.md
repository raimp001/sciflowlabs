# LabBounty - Scientific Research Funding Platform

*Revolutionizing the way labs fundraise and researchers fund breakthrough science*

[![Live on GitHub Pages](https://img.shields.io/badge/Live%20on-GitHub%20Pages-black?style=for-the-badge&logo=github)](https://raimp001.github.io/123/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

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
- **Deployment**: GitHub Pages (with GitHub Actions)

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

### GitHub Pages (Current)

Your project is configured for automatic deployment to GitHub Pages:

**Live Site**: [https://raimp001.github.io/123/](https://raimp001.github.io/123/)

#### Setup GitHub Pages:
1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment", set **Source** to: **GitHub Actions**
3. Push any change to trigger automatic deployment
4. Monitor deployment in the **Actions** tab

The GitHub Actions workflow automatically:
- Builds the static export on every push
- Deploys to GitHub Pages
- Updates the live site within minutes

### Vercel (Alternative)

For server-side rendering and advanced features:

```bash
npm install -g vercel
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment options.

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