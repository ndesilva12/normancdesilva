"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface MobileToolCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

export function MobileToolCard({ name, description, icon: Icon, href, color }: MobileToolCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        textDecoration: "none",
        transition: "all 0.2s ease",
        minHeight: "120px",
        position: "relative",
        overflow: "hidden",
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = "scale(0.95)";
        e.currentTarget.style.borderColor = color;
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
      }}
    >
      {/* Gradient overlay on touch */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${color}15, transparent)`,
          opacity: 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: `${color}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "12px",
        }}
      >
        <Icon style={{ width: "26px", height: "26px", color: color, strokeWidth: 2 }} />
      </div>

      {/* Text */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#ffffff",
            marginBottom: "4px",
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#94a3b8",
            lineHeight: 1.3,
          }}
        >
          {description}
        </div>
      </div>
    </Link>
  );
}
