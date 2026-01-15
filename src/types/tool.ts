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
  | "developer";

export const categoryLabels: Record<ToolCategory, string> = {
  productivity: "Productivity",
  ai: "AI Tools",
  utilities: "Utilities",
  finance: "Finance",
  creative: "Creative",
  developer: "Developer",
};

export const categoryColors: Record<ToolCategory, string> = {
  productivity: "text-emerald-400",
  ai: "text-cyan-400",
  utilities: "text-amber-400",
  finance: "text-violet-400",
  creative: "text-pink-400",
  developer: "text-blue-400",
};
