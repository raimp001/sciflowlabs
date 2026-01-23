export type BountyStatus = "open" | "in_progress" | "completed" | "cancelled";
export type ResearchArea =
  | "oncology"
  | "neuroscience"
  | "immunology"
  | "genetics"
  | "cardiology"
  | "infectious_disease"
  | "rare_disease"
  | "drug_discovery"
  | "diagnostics"
  | "other";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  researchArea: ResearchArea;
  fundingAmount: number; // in USD
  deadline: Date;
  createdAt: Date;
  status: BountyStatus;
  createdBy: string; // User/organization name
  objectives: string[];
  deliverables: string[];
  acceptedLabId?: string;
  acceptedLabName?: string;
  applicantsCount: number;
  tags: string[];
  urgency: "low" | "medium" | "high" | "critical";
  estimatedDuration?: string; // e.g., "12 months"
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  fundingAmount: number;
  deadline: Date;
  status: "pending" | "in_progress" | "completed";
}

export interface Lab {
  id: string;
  name: string;
  description: string;
  specializations: ResearchArea[];
  location: string;
  website?: string;
  logoUrl?: string;
  established: number;
  teamSize: number;
  completedBounties: number;
  activeBounties: number;
  successRate: number; // percentage
  rating: number; // 0-5
  totalFundingReceived: number;
  publications?: number;
  verified: boolean;
  capabilities: string[];
  equipment: string[];
}
