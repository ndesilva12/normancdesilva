"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface WidgetBlockProps {
  id: string;
  title: string;
  icon: LucideIcon;
  href: string;
  preview?: React.ReactNode;
  isVisible: boolean;
}

export function WidgetBlock({
  title,
  icon: Icon,
  href,
  preview,
  isVisible,
}: WidgetBlockProps) {
  if (!isVisible) return null;

  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "20px",
        borderRadius: "12px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid var(--glass-border)",
        cursor: "pointer",
        transition: "all 0.2s",
        textDecoration: "none",
        color: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
        e.currentTarget.style.borderColor = "var(--glass-border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: preview ? "16px" : "0",
        }}
      >
        <Icon
          style={{
            width: "24px",
            height: "24px",
            color: "var(--accent)",
          }}
        />
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>

      {/* Preview Content */}
      {preview && (
        <div
          style={{
            fontSize: "14px",
            color: "var(--foreground-muted)",
          }}
        >
          {preview}
        </div>
      )}
    </Link>
  );
}
