export interface CompanyAnalysis {
  companyName: string;
  ticker: string | null;
  industry: string;
  description: string;
  overallLeaning: "Far Left" | "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Far Right";
  confidenceScore: number;
  positions: CompanyPosition[];
  affiliates: CompanyAffiliate[];
  newsItems: NewsItem[];
  donations: Donation[];
  publicStatements: PublicStatement[];
  revenueAllocation: RevenueAllocation[];
  lobbyingActivities: LobbyingActivity[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanyPosition {
  topic: string;
  stance: string;
  description: string;
}

export interface CompanyAffiliate {
  name: string;
  relationship: string;
  description: string;
}

export interface NewsItem {
  headline: string;
  source: string;
  date: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface Donation {
  recipient: string;
  amount: string;
  date: string;
  party: "Democrat" | "Republican" | "Other" | "PAC";
}

export interface PublicStatement {
  speaker: string;
  role: string;
  statement: string;
  date: string;
  topic: string;
}

export interface RevenueAllocation {
  category: string;
  percentage: number;
  description: string;
}

export interface LobbyingActivity {
  issue: string;
  amount: string;
  year: string;
  description: string;
}

export interface CompanySearchResult {
  name: string;
  ticker: string | null;
  industry: string;
  description: string;
}
