"use client";

import Link from "next/link";
import { Sparkles, Calendar, Search, Moon, ArrowLeft } from "lucide-react";

interface IntelToolNavProps {
  current: "curate" | "l3d" | "deep" | "dark";
}

const TOOLS = [
  { id: "curate", name: "Curate", href: "/tools/curate", icon: Sparkles, color: "#a78bfa" },
  { id: "l3d", name: "Last 30 Days", href: "/tools/last30days", icon: Calendar, color: "#10b981" },
  { id: "deep", name: "Deep Search", href: "/tools/deep-search", icon: Search, color: "#3b82f6" },
  { id: "dark", name: "Dark Search", href: "/tools/dark-search", icon: Moon, color: "#ef4444" },
];

export function IntelToolNav({ current }: IntelToolNavProps) {
  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Back to Dashboard */}
      <Link
        href="/"
        style={{
          color: "#94a3b8",
          textDecoration: "none",
          fontSize: "14px",
          marginBottom: "16px",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <ArrowLeft style={{ width: "16px", height: "16px" }} />
        Dashboard
      </Link>

      {/* Intel Tools Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "16px",
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
                gap: "8px",
                padding: "10px 16px",
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
