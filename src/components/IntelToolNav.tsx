"use client";

import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Search,
  Lock,
  Image,
  UserSearch,
  Network,
  Target,
  TrendingDown,
  Building2,
  Briefcase,
} from "lucide-react";

interface IntelToolNavProps {
  current:
    | "curate"
    | "l3d"
    | "deep"
    | "dark"
    | "image-lookup"
    | "contact-finder"
    | "relationship-intel"
    | "mission"
    | "investors"
    | "business-info"
    | "corporate-info";
}

const TOOLS = [
  {
    id: "curate",
    name: "Curate",
    href: "/tools/curate",
    icon: Sparkles,
    color: "#8b5cf6",
  },
  {
    id: "l3d",
    name: "L3D",
    href: "/tools/l3d",
    icon: TrendingUp,
    color: "#10b981",
  },
  {
    id: "deep",
    name: "Deep Search",
    href: "/tools/deep-search",
    icon: Search,
    color: "#6366f1",
  },
  {
    id: "dark",
    name: "Dark Search",
    href: "/tools/dark-search",
    icon: Lock,
    color: "#dc2626",
  },
  {
    id: "image-lookup",
    name: "Image Lookup",
    href: "/tools/image-lookup",
    icon: Image,
    color: "#a78bfa",
  },
  {
    id: "contact-finder",
    name: "Contact Finder",
    href: "/tools/contact-finder",
    icon: UserSearch,
    color: "#6366f1",
  },
  {
    id: "relationship-intel",
    name: "Relationships",
    href: "/tools/relationship-intel",
    icon: Network,
    color: "#14b8a6",
  },
  {
    id: "mission",
    name: "Mission",
    href: "/tools/mission",
    icon: Target,
    color: "#f59e0b",
  },
  {
    id: "investors",
    name: "Investors",
    href: "/tools/investors",
    icon: TrendingDown,
    color: "#3b82f6",
  },
  {
    id: "business-info",
    name: "Business Info",
    href: "/tools/business-info",
    icon: Building2,
    color: "#8b5cf6",
  },
  {
    id: "corporate-info",
    name: "Corporate",
    href: "/tools/company-politics",
    icon: Briefcase,
    color: "#10b981",
  },
];

export function IntelToolNav({ current }: IntelToolNavProps) {
  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Intel Tools Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "0px",
          flexWrap: "wrap",
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
                minWidth: "140px",
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
