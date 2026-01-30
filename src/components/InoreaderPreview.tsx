"use client";

import { Rss, ExternalLink } from "lucide-react";

export function InoreaderPreview() {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
      <Rss style={{ width: "32px", height: "32px", color: "var(--accent)", marginBottom: "12px", opacity: 0.7 }} />
      <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
        Inoreader RSS Reader
      </p>
      <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
        Connect your Inoreader account to view your RSS feeds
      </p>
      <a
        href="/tools/inoreader"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 16px",
          backgroundColor: "var(--accent)",
          color: "var(--background)",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        Configure Inoreader
        <ExternalLink style={{ width: "14px", height: "14px" }} />
      </a>
    </div>
  );
}
