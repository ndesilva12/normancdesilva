"use client";

import { BarChart3 } from "lucide-react";

export function VisualRostersPreview() {
  return (
    <div style={{ 
      padding: "40px 20px", 
      textAlign: "center",
      color: "var(--muted)" 
    }}>
      <BarChart3 size={48} style={{ 
        margin: "0 auto 20px auto", 
        opacity: 0.3,
        color: "#3b82f6"
      }} />
      <h3 style={{ 
        fontSize: "18px", 
        fontWeight: 600,
        color: "var(--foreground)",
        marginBottom: "8px"
      }}>
        Visual Rosters
      </h3>
      <p style={{ fontSize: "14px", marginBottom: "24px" }}>
        Interactive roster visualization and team data
      </p>
      <div style={{ 
        fontSize: "13px",
        color: "var(--muted)",
        maxWidth: "400px",
        margin: "0 auto"
      }}>
        Click "Open Full Tool" to access the roster visualization interface
      </div>
    </div>
  );
}
