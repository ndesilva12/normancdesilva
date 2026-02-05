"use client";

import { UserSearch } from "lucide-react";

export function ContactFinderPreview() {
  return (
    <div style={{ 
      padding: "40px 20px", 
      textAlign: "center",
      color: "var(--muted)" 
    }}>
      <UserSearch size={48} style={{ 
        margin: "0 auto 20px auto", 
        opacity: 0.3,
        color: "#f59e0b"
      }} />
      <h3 style={{ 
        fontSize: "18px", 
        fontWeight: 600,
        color: "var(--foreground)",
        marginBottom: "8px"
      }}>
        Contact Finder
      </h3>
      <p style={{ fontSize: "14px", marginBottom: "24px" }}>
        Discover and verify contact information
      </p>
      <div style={{ 
        fontSize: "13px",
        color: "var(--muted)",
        maxWidth: "400px",
        margin: "0 auto"
      }}>
        Click "Open Full Tool" to search for contact details
      </div>
    </div>
  );
}
