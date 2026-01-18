"use client";

import { Clock, X } from "lucide-react";
import { useRecentSearches } from "@/contexts/RecentSearchesContext";
import { ToolId } from "@/contexts/SettingsContext";

interface RecentSearchesProps {
  toolId: ToolId;
  onSelect: (query: string) => void;
  maxWidth?: string;
}

export function RecentSearches({ toolId, onSelect, maxWidth = "100%" }: RecentSearchesProps) {
  const { getRecentSearches, clearRecentSearches, isToolEnabled } = useRecentSearches();

  if (!isToolEnabled(toolId)) return null;

  const recentItems = getRecentSearches(toolId);

  if (recentItems.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "var(--foreground-muted)",
          }}
        >
          <Clock style={{ width: "12px", height: "12px" }} />
          Recent
        </div>
        <button
          onClick={() => clearRecentSearches(toolId)}
          style={{
            background: "none",
            border: "none",
            padding: "2px 6px",
            fontSize: "11px",
            color: "var(--foreground-muted)",
            cursor: "pointer",
            opacity: 0.7,
          }}
        >
          Clear
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
        }}
      >
        {recentItems.map((item, index) => (
          <button
            key={`${item.query}-${index}`}
            onClick={() => onSelect(item.query)}
            style={{
              padding: "4px 10px",
              borderRadius: "9999px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground-muted)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "150px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(var(--accent-rgb), 0.15)";
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "var(--glass-border)";
              e.currentTarget.style.color = "var(--foreground-muted)";
            }}
            title={item.query}
          >
            {item.query}
          </button>
        ))}
      </div>
    </div>
  );
}

// Inline version for tighter spaces
export function RecentSearchesInline({ toolId, onSelect }: { toolId: ToolId; onSelect: (query: string) => void }) {
  const { getRecentSearches, isToolEnabled } = useRecentSearches();

  if (!isToolEnabled(toolId)) return null;

  const recentItems = getRecentSearches(toolId);

  if (recentItems.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Recent:</span>
      {recentItems.map((item, index) => (
        <button
          key={`${item.query}-${index}`}
          onClick={() => onSelect(item.query)}
          style={{
            background: "none",
            border: "none",
            padding: "2px 0",
            fontSize: "12px",
            color: "var(--foreground-muted)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-muted)")}
        >
          {item.query}
          {index < recentItems.length - 1 && <span style={{ marginLeft: "8px", opacity: 0.3 }}>•</span>}
        </button>
      ))}
    </div>
  );
}
