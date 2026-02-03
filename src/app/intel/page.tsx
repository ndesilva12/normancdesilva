"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import Link from "next/link";
import { Sparkles, TrendingUp, Search, Lock } from "lucide-react";

const INTEL_TOOLS = [
  { 
    id: "curate", 
    name: "Curate", 
    icon: Sparkles, 
    href: "/tools/curate", 
    color: "#8b5cf6",
    description: "Curated content for your worldview"
  },
  { 
    id: "l3d", 
    name: "L3D", 
    icon: TrendingUp, 
    href: "/tools/last30days", 
    color: "#10b981",
    description: "Last 30 days research"
  },
  { 
    id: "deep-search", 
    name: "Deep Search", 
    icon: Search, 
    href: "/tools/deep-search", 
    color: "#3b82f6",
    description: "Multi-source deep research"
  },
  { 
    id: "dark-search", 
    name: "Dark Search", 
    icon: Lock, 
    href: "/tools/dark-search", 
    color: "#ef4444",
    description: "Hidden content discovery"
  },
];

export default function IntelPage() {
  return (
    <>
      <TopNav />
      <BottomNav />

      <div
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          paddingBottom: "24px",
          padding: "64px 24px 24px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "8px",
              }}
            >
              Intelligence Tools
            </h1>
            <p style={{ fontSize: "16px", color: "var(--muted)" }}>
              Deep research and content curation powered by AI
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            {INTEL_TOOLS.map((tool) => (
              <IntelToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function IntelToolCard({ tool }: { tool: typeof INTEL_TOOLS[0] }) {
  const Icon = tool.icon;

  return (
    <Link href={tool.href} style={{ textDecoration: "none" }}>
      <div
        className="card"
        style={{
          padding: "24px",
          cursor: "pointer",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.borderColor = tool.color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "var(--glass-border)";
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: `${tool.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon style={{ width: "24px", height: "24px", color: tool.color }} />
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              {tool.name}
            </h3>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            {tool.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
