"use client";

import { useRouter } from "next/navigation";
import {
  Users,
  Target,
  UserSquare2,
  Lightbulb,
  Search,
  Command,
  TrendingUp,
} from "lucide-react";
import { useGlobalSearch } from "../GlobalSearchProvider";

const QUICK_LINKS = [
  {
    id: "investors",
    name: "Investors",
    icon: TrendingUp,
    href: "/investors",
    color: "#3b82f6",
    description: "Track fundraising pipeline",
  },
  {
    id: "relationship-intel",
    name: "Relationships",
    icon: Users,
    href: "/relationship-intel",
    color: "#6366f1",
    description: "Contact insights & history",
  },
  {
    id: "mission",
    name: "Mission",
    icon: Target,
    href: "/mission",
    color: "#8b5cf6",
    description: "Kanban task board",
  },
  {
    id: "people",
    name: "People",
    icon: UserSquare2,
    href: "/people",
    color: "#10b981",
    description: "Manage contacts",
  },
  {
    id: "recommendations",
    name: "Recommendations",
    icon: Lightbulb,
    href: "/recommendations",
    color: "#a78bfa",
    description: "Track suggestions",
  },
];

export function DashboardQuickLinks() {
  const router = useRouter();
  const { openSearch } = useGlobalSearch();

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ marginBottom: "12px" }}>
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted)",
          }}
        >
          SYSTEMS
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <div
              key={link.id}
              className="card"
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                overflow: "hidden",
              }}
              onClick={() => router.push(link.href)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = link.color;
                const overlay = e.currentTarget.querySelector(".link-overlay") as HTMLElement;
                if (overlay) overlay.style.opacity = "0.08";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "var(--glass-border)";
                const overlay = e.currentTarget.querySelector(".link-overlay") as HTMLElement;
                if (overlay) overlay.style.opacity = "0";
              }}
            >
              {/* Background overlay */}
              <div
                className="link-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: link.color,
                  opacity: 0,
                  transition: "opacity 0.2s",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: `${link.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon style={{ width: "18px", height: "18px", color: link.color }} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--foreground)",
                        marginBottom: "2px",
                      }}
                    >
                      {link.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {link.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
