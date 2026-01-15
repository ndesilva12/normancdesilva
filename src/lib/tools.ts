import {
  Building2,
  Users,
} from "lucide-react";
import { Tool } from "@/types/tool";

export const tools: Tool[] = [
  {
    id: "company-politics",
    name: "Company Politics Search",
    description: "Analyze corporate political leanings, donations, lobbying activities, and public statements.",
    icon: Building2,
    href: "/tools/company-politics",
    category: "ai",
    status: "available",
    aiPowered: true,
  },
  {
    id: "visual-rosters",
    name: "Visual Rosters",
    description: "View sports team rosters with player details and hometown mapping across NBA, NFL, NCAA, and more.",
    icon: Users,
    href: "/tools/visual-rosters",
    category: "sports",
    status: "available",
    aiPowered: true,
  },
];

export const categories = [
  { id: "all", label: "All Tools" },
  { id: "ai", label: "AI Tools" },
  { id: "sports", label: "Sports" },
] as const;
