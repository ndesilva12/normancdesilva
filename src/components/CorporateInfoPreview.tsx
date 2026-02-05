"use client";

import { Briefcase } from "lucide-react";

export function CorporateInfoPreview() {
  return (
    <div style={{ 
      padding: "40px 20px", 
      textAlign: "center",
      color: "var(--muted)" 
    }}>
      <Briefcase size={48} style={{ 
        margin: "0 auto 20px auto", 
        opacity: 0.3,
        color: "#10b981"
      }} />
      <h3 style={{ 
        fontSize: "18px", 
        fontWeight: 600,
        color: "var(--foreground)",
        marginBottom: "8px"
      }}>
        Corporate Information
      </h3>
      <p style={{ fontSize: "14px", marginBottom: "24px" }}>
        Company politics, org charts, and corporate intelligence
      </p>
      <div style={{ 
        fontSize: "13px",
        color: "var(--muted)",
        maxWidth: "400px",
        margin: "0 auto"
      }}>
        Click "Open Full Tool" to access corporate information search
      </div>
    </div>
  );
}
