import { LucideIcon } from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  category: ToolCategory;
  status: "available" | "coming-soon" | "beta";
  aiPowered?: boolean;
}

export type ToolCategory =
  | "productivity"
  | "ai"
  | "utilities"
  | "finance"
  | "creative"
  | "developer"
  | "sports"
  | "news"
  | "media";

export const categoryLabels: Record<ToolCategory, string> = {
  productivity: "Productivity",
  ai: "AI Tools",
  utilities: "Utilities",
  finance: "Finance",
  creative: "Creative",
  developer: "Developer",
  sports: "Sports",
  news: "News",
  media: "Media",
};

// All categories use cyan color (single accent color)
export const categoryColors: Record<ToolCategory, string> = {
  productivity: "text-accent",
  ai: "text-accent",
  utilities: "text-accent",
  finance: "text-accent",
  creative: "text-accent",
  developer: "text-accent",
  sports: "text-accent",
  news: "text-accent",
  media: "text-accent",
};
