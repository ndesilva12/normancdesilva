import {
  Building2,
  Users,
  Newspaper,
  Music,
  Search,
} from "lucide-react";
import { Tool } from "@/types/tool";

export const tools: Tool[] = [
  {
    id: "contact-finder",
    name: "Contact Finder",
    description: "Find publicly available contact information for individuals or organizations using AI-powered OSINT research.",
    icon: Search,
    href: "/tools/contact-finder",
    category: "ai",
    status: "available",
    aiPowered: true,
  },
  {
    id: "company-politics",
    name: "Company Info",
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
  {
    id: "news",
    name: "News",
    description: "Browse the latest news articles from ZeroHedge, covering markets, politics, and current events.",
    icon: Newspaper,
    href: "/tools/news",
    category: "news",
    status: "available",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Control Spotify playback, browse playlists, and search for music right from your dashboard.",
    icon: Music,
    href: "/tools/spotify",
    category: "media",
    status: "available",
  },
];

export const categories = [
  { id: "all", label: "All Tools" },
  { id: "ai", label: "AI Tools" },
  { id: "sports", label: "Sports" },
  { id: "news", label: "News" },
  { id: "media", label: "Media" },
] as const;
