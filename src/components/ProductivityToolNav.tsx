"use client";

import Link from "next/link";
import {
  Mail,
  Calendar,
  Users,
  User,
  Handshake,
  Newspaper,
  BookOpen,
  Droplets,
  DollarSign,
  StickyNote,
  FolderOpen,
  Music,
  Globe,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface ProductivityToolNavProps {
  current:
    | "emails"
    | "calendar"
    | "contacts"
    | "people"
    | "recommendations"
    | "news"
    | "inoreader"
    | "raindrop"
    | "market"
    | "notes"
    | "files"
    | "spotify"
    | "accounts"
    | "trending"
    | "visual-rosters";
}

const TOOLS = [
  {
    id: "emails",
    name: "Emails",
    href: "/tools/emails",
    icon: Mail,
    color: "#3b82f6",
  },
  {
    id: "calendar",
    name: "Calendar",
    href: "/tools/calendar",
    icon: Calendar,
    color: "#10b981",
  },
  {
    id: "contacts",
    name: "Contacts",
    href: "/tools/contacts",
    icon: Users,
    color: "#8b5cf6",
  },
  {
    id: "people",
    name: "People",
    href: "/tools/people",
    icon: User,
    color: "#06b6d4",
  },
  {
    id: "recommendations",
    name: "Recommendations",
    href: "/tools/recommendations",
    icon: Handshake,
    color: "#ec4899",
  },
  {
    id: "news",
    name: "News",
    href: "/tools/news",
    icon: Newspaper,
    color: "#64748b",
  },
  {
    id: "inoreader",
    name: "RSS",
    href: "/tools/inoreader",
    icon: BookOpen,
    color: "#10b981",
  },
  {
    id: "raindrop",
    name: "Bookmarks",
    href: "/tools/raindrop",
    icon: Droplets,
    color: "#06b6d4",
  },
  {
    id: "market",
    name: "Market",
    href: "/tools/market",
    icon: DollarSign,
    color: "#3b82f6",
  },
  {
    id: "notes",
    name: "Notes",
    href: "/tools/notes",
    icon: StickyNote,
    color: "#a78bfa",
  },
  {
    id: "files",
    name: "Files",
    href: "/tools/files",
    icon: FolderOpen,
    color: "#6366f1",
  },
  {
    id: "spotify",
    name: "Spotify",
    href: "/tools/spotify",
    icon: Music,
    color: "#1DB954",
  },
  {
    id: "accounts",
    name: "Accounts",
    href: "/tools/accounts",
    icon: Globe,
    color: "#64748b",
  },
  {
    id: "trending",
    name: "Trending",
    href: "/tools/trending",
    icon: TrendingUp,
    color: "#14b8a6",
  },
  {
    id: "visual-rosters",
    name: "Rosters",
    href: "/tools/visual-rosters",
    icon: BarChart3,
    color: "#3b82f6",
  },
];

export function ProductivityToolNav({ current }: ProductivityToolNavProps) {
  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Productivity Tools Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "0px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = tool.id === current;

          return (
            <Link
              key={tool.id}
              href={tool.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 16px",
                minWidth: "160px",
                borderRadius: "10px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                background: isActive
                  ? `linear-gradient(135deg, ${tool.color}20 0%, ${tool.color}10 100%)`
                  : "rgba(255, 255, 255, 0.02)",
                border: isActive
                  ? `2px solid ${tool.color}`
                  : "1px solid rgba(255, 255, 255, 0.06)",
                color: isActive ? tool.color : "#94a3b8",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "#f0f0f5";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.color = "#94a3b8";
                }
              }}
            >
              <Icon style={{ width: "16px", height: "16px" }} />
              {tool.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
