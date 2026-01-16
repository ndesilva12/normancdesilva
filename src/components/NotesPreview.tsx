"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StickyNote, Loader2, ExternalLink } from "lucide-react";
import { OneNotePage } from "@/lib/microsoft-graph";

interface NotesPreviewProps {
  isMicrosoftConnected: boolean;
  onConnectMicrosoft: () => void;
}

export function NotesPreview({ isMicrosoftConnected, onConnectMicrosoft }: NotesPreviewProps) {
  const [pages, setPages] = useState<OneNotePage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMicrosoftConnected) {
      fetchNotes();
    }
  }, [isMicrosoftConnected]);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/onenote?limit=5&type=pages");
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      const data = await response.json();
      setPages(data.pages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getOneNoteUrl = (page: OneNotePage): string => {
    return page.links?.oneNoteWebUrl?.href || page.links?.oneNoteClientUrl?.href || "#";
  };

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
      {/* Header - clickable to navigate to full page */}
      <Link
        href="/tools/notes"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          borderBottom: "1px solid var(--glass-border)",
          textDecoration: "none",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <StickyNote style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", flex: 1 }}>
          Notes
        </span>
        <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
      </Link>

      {/* Content */}
      <div style={{ padding: "12px 16px", minHeight: "120px" }}>
        {!isMicrosoftConnected ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginBottom: "12px" }}>
              Connect Microsoft to see your notes
            </p>
            <button
              onClick={onConnectMicrosoft}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Connect Microsoft
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
            <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ color: "#f87171", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            {error}
          </div>
        ) : pages.length === 0 ? (
          <div style={{ color: "var(--foreground-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            No recent notes found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pages.map((page) => (
              <a
                key={page.id}
                href={getOneNoteUrl(page)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: "16px" }}>📝</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "13px",
                    color: "var(--foreground)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {page.title || "Untitled"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                    {page.parentSection?.displayName || "Section"} • {formatDate(page.lastModifiedDateTime)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
