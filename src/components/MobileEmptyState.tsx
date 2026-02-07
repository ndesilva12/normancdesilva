"use client";

import { LucideIcon } from "lucide-react";

interface MobileEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function MobileEmptyState({ icon: Icon, title, description, action }: MobileEmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "20px",
          background: "rgba(20, 184, 166, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <Icon style={{ width: "36px", height: "36px", color: "#14b8a6" }} />
      </div>

      <h3
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#ffffff",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "14px",
          color: "#94a3b8",
          lineHeight: 1.6,
          maxWidth: "300px",
          marginBottom: action ? "24px" : 0,
        }}
      >
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 600,
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
