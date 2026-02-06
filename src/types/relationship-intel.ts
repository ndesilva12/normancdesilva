// Relationship Intel Data Types

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  keywords: string[];
  tags: string[];
  contactCount: number;
}

export interface Contact {
  email: string;
  name: string;
  company?: string;
  tags: string[];
  lastContact: Date;
  firstContact: Date;
  interactionCount: number;
}

export interface Interaction {
  id: string;
  type: "email" | "event";
  date: Date;
  subject: string;
  summary: string;
  content?: string;
  emailId?: string;
  eventId?: string;
  threadId?: string;
  from?: string;
  to?: string[];
  cc?: string[];
  attendees?: string[];
}

export interface ProjectMetadata {
  name: string;
  createdAt: Date;
  updatedAt: Date;
  keywords: string[];
  tags: string[];
}

export interface SyncStatus {
  isSync ing: boolean;
  lastSync: Date | null;
  progress: number;
  status: string;
  error?: string;
}

export type SortBy = "name" | "lastContact" | "interactionCount";
export type SortOrder = "asc" | "desc";
