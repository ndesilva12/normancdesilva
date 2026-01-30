"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Rss, Loader2, ExternalLink } from "lucide-react";

interface RSSArticle {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
}

export function InoreaderPreview() {
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rss-feeds");
      if (!response.ok) throw new Error("Failed to fetch RSS feeds");
      const data = await response.json();
      setArticles(data.articles?.slice(0, 8) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load RSS feeds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffHours < 24) return `${diffHours}h`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
        <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#f87171" }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Link
        href="/tools/inoreader"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          borderBottom: "1px solid var(--glass-border)",
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Rss style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>RSS Feeds</h3>
        </div>
        <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
      </Link>

      {/* Articles List */}
      <div style={{ maxHeight: "300px", overflow: "auto" }}>
        {articles.map((article, index) => (
          <a
            key={index}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "12px 16px",
              borderBottom: index < articles.length - 1 ? "1px solid var(--glass-border)" : "none",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "4px", lineHeight: "1.4" }}>
              {article.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {article.source && (
                <span style={{ fontSize: "11px", color: "var(--accent)" }}>
                  {article.source}
                </span>
              )}
              <span style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                {formatDate(article.pubDate)}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
