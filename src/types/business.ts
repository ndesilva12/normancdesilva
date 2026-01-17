// Business Info types for local business searches

export interface BusinessOwner {
  name: string;
  title?: string;
  ownership?: string; // e.g., "51% owner", "Managing Partner"
}

export interface BusinessFiling {
  type: string; // e.g., "Articles of Incorporation", "Annual Report", "DBA"
  date: string;
  agency: string; // e.g., "Secretary of State", "Town Clerk"
  status?: string; // e.g., "Active", "Expired"
  documentNumber?: string;
}

export interface BusinessLicense {
  type: string;
  issuedBy: string;
  issueDate?: string;
  expirationDate?: string;
  status: string;
}

export interface NewsArticle {
  title: string;
  source: string;
  date: string;
  summary: string;
  url?: string;
}

export interface BusinessSearchResult {
  name: string;
  address: string;
  city: string;
  state: string;
  type?: string; // e.g., "Restaurant", "Retail", "Professional Services"
  confidence: number; // 0-100 match confidence
}

export interface BusinessAnalysis {
  businessName: string;
  tradeName?: string; // DBA / "Doing Business As"
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  email?: string;

  // Business details
  businessType: string; // e.g., "LLC", "Corporation", "Sole Proprietorship"
  industry: string;
  yearEstablished?: string;
  employeeCount?: string;
  annualRevenue?: string;

  // Ownership and leadership
  owners: BusinessOwner[];
  registeredAgent?: string;

  // Public records
  filings: BusinessFiling[];
  licenses: BusinessLicense[];

  // News and media
  newsArticles: NewsArticle[];

  // Summary
  summary: string;

  // Metadata
  searchedAt: Date;
  dataSource: string;
}
