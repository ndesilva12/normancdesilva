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
    name: "Investor Pipeline",
    icon: TrendingUp,
    href: "/investors",
    color: "#3b82f6",
    description: "Track fundraising progress",
  },
  {
    id: "relationship-intel",
    name: "Relationship Intel",
    icon: Users,
    href: "/relationship-intel",
    color: "#6366f1",
    description: "Contact insights & history",
  },
  {
    id: "mission",
    name: "Mission Control",
    icon: Target,
    href: "/mission",
    color: "#8b5cf6",
    description: "Kanban task board",
  },
  {
    id: "people",
    name: "People Database",
    icon: UserSquare2,
    href: "/people",
    color: "#10b981",
    description: "Sync & manage contacts",
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
        {/* Global Search Button */}
        <div
          className="card"
          style={{
            padding: "16px 20px",
            cursor: "pointer",
            transition: "all 0.2s",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
          onClick={openSearch}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(139, 92, 246, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search style={{ width: "18px", height: "18px", color: "#fff" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  marginBottom: "2px",
                }}
              >
                Global Search
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Command size={12} />
                <span>+ K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
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
