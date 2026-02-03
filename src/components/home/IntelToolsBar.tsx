"use client";

import Link from "next/link";
import { Sparkles, TrendingUp, Search, Lock } from "lucide-react";

const INTEL_TOOLS = [
  {
    id: "curate",
    name: "Curate",
    icon: Sparkles,
    href: "/tools/curate",
    color: "#8b5cf6",
    description: "Curated content for your worldview",
  },
  {
    id: "l3d",
    name: "L3D",
    icon: TrendingUp,
    href: "/tools/last30days",
    color: "#10b981",
    description: "Last 30 days research",
  },
  {
    id: "deep",
    name: "Deep Search",
    icon: Search,
    href: "/tools/deep-search",
    color: "#3b82f6",
    description: "Multi-source deep research",
  },
  {
    id: "dark",
    name: "Dark Search",
    icon: Lock,
    href: "/tools/dark-search",
    color: "#ef4444",
    description: "Hidden content discovery",
  },
];

export function IntelToolsBar() {
  return (
    <div
      style={{
        marginBottom: "32px",
      }}
    >
      <div
        style={{
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted)",
          }}
        >
          Tools
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {INTEL_TOOLS.map((tool) => (
          <IntelToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

function IntelToolCard({ tool }: { tool: typeof INTEL_TOOLS[0] }) {
  const Icon = tool.icon;

  return (
    <Link
      href={tool.href}
      style={{
        textDecoration: "none",
      }}
    >
      <div
        className="card"
        style={{
          padding: "20px",
          cursor: "pointer",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.borderColor = tool.color;
          const overlay = e.currentTarget.querySelector(".tool-overlay") as HTMLElement;
          if (overlay) overlay.style.opacity = "0.1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "var(--glass-border)";
          const overlay = e.currentTarget.querySelector(".tool-overlay") as HTMLElement;
          if (overlay) overlay.style.opacity = "0";
        }}
      >
        {/* Background overlay */}
        <div
          className="tool-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: tool.color,
            opacity: 0,
            transition: "opacity 0.2s",
            pointerEvents: "none",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: `${tool.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon style={{ width: "20px", height: "20px", color: tool.color }} />
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              {tool.name}
            </h3>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--muted)",
              lineHeight: 1.4,
            }}
          >
            {tool.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
