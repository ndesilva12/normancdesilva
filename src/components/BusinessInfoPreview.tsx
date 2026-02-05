"use client";

import { Building2 } from "lucide-react";

export function BusinessInfoPreview() {
  return (
    <div style={{ 
      padding: "40px 20px", 
      textAlign: "center",
      color: "var(--muted)" 
    }}>
      <Building2 size={48} style={{ 
        margin: "0 auto 20px auto", 
        opacity: 0.3,
        color: "#8b5cf6"
      }} />
      <h3 style={{ 
        fontSize: "18px", 
        fontWeight: 600,
        color: "var(--foreground)",
        marginBottom: "8px"
      }}>
        Business Information Lookup
      </h3>
      <p style={{ fontSize: "14px", marginBottom: "24px" }}>
        Search company data, registration info, and business intelligence
      </p>
      <div style={{ 
        fontSize: "13px",
        color: "var(--muted)",
        maxWidth: "400px",
        margin: "0 auto"
      }}>
        Click "Open Full Tool" to access the business info search interface
      </div>
    </div>
  );
}
