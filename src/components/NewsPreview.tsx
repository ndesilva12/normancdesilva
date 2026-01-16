"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Newspaper, Loader2, ExternalLink, RefreshCw, ChevronDown } from "lucide-react";

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
}

type NewsSource = "zerohedge" | "reason" | "mises";

const NEWS_SOURCES: { id: NewsSource; name: string }[] = [
  { id: "zerohedge", name: "ZeroHedge" },
  { id: "reason", name: "Reason" },
  { id: "mises", name: "Mises" },
];

export function NewsPreview() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<NewsSource>("zerohedge");
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchArticles = useCallback(async (source: NewsSource) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/news?source=${source}`);
      if (!response.ok) {
        throw new Error("Failed to fetch articles");
      }
      const data = await response.json();
      setArticles(data.articles?.slice(0, 6) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(selectedSource);
  }, [selectedSource, fetchArticles]);

  const handleSourceChange = (source: NewsSource) => {
    setSelectedSource(source);
    setShowDropdown(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}m`;
      } else if (diffHours < 24) {
        return `${diffHours}h`;
      } else {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    } catch {
      return "";
    }
  };

  const currentSource = NEWS_SOURCES.find((s) => s.id === selectedSource);

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header - clickable to navigate to full page */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          borderBottom: "1px solid var(--glass-border)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/tools/news"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flex: 1,
          }}
        >
          <Newspaper style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>
            News
          </span>
        </Link>

        {/* Source Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "none",
              color: "var(--foreground-muted)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {currentSource?.name}
            <ChevronDown style={{ width: "12px", height: "12px" }} />
          </button>

          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                minWidth: "120px",
                backgroundColor: "#1a1a1a",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "4px",
                zIndex: 100,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              }}
            >
              {NEWS_SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSourceChange(source.id);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: selectedSource === source.id ? "rgba(var(--accent-rgb), 0.2)" : "transparent",
                    color: selectedSource === source.id ? "var(--accent)" : "var(--foreground)",
                    fontSize: "13px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {source.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/tools/news"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
        </Link>
      </div>

      {/* Content */}
      <div style={{ padding: "8px 12px", flex: 1, minHeight: "160px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
            <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
            <button
              onClick={() => fetchArticles(selectedSource)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
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
              <RefreshCw style={{ width: "14px", height: "14px" }} />
              Retry
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ color: "var(--foreground-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            No articles found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {articles.map((article, index) => (
              <a
                key={article.link || index}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "6px 4px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--foreground-muted)",
                    flexShrink: 0,
                    minWidth: "32px",
                    textAlign: "right",
                  }}
                >
                  {formatDate(article.pubDate)}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--foreground)",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {article.title}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Click anywhere overlay to close dropdown */}
      {showDropdown && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
