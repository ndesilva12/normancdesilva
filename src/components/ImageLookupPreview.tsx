"use client";

import { Image as ImageIcon } from "lucide-react";

export function ImageLookupPreview() {
  return (
    <div style={{ 
      padding: "40px 20px", 
      textAlign: "center",
      color: "var(--muted)" 
    }}>
      <ImageIcon size={48} style={{ 
        margin: "0 auto 20px auto", 
        opacity: 0.3,
        color: "#ec4899"
      }} />
      <h3 style={{ 
        fontSize: "18px", 
        fontWeight: 600,
        color: "var(--foreground)",
        marginBottom: "8px"
      }}>
        Image Lookup
      </h3>
      <p style={{ fontSize: "14px", marginBottom: "24px" }}>
        Reverse image search and visual intelligence
      </p>
      <div style={{ 
        fontSize: "13px",
        color: "var(--muted)",
        maxWidth: "400px",
        margin: "0 auto"
      }}>
        Click "Open Full Tool" to perform image searches
      </div>
    </div>
  );
}
