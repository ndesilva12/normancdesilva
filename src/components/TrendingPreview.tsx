"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
interface TrendingTopic {
  topic: string;
  title?: string;
  description?: string;
  searchUrl: string;
  source: "x" | "google";
}

export function TrendingPreview() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [googleRes, xRes] = await Promise.all([
        fetch("/api/google-trends"),
        fetch("/api/x-trending"),
      ]);

      const googleData = await googleRes.json();
      const xData = await xRes.json();

      const googleTopics: TrendingTopic[] = (googleData.trends || []).slice(0, 10).map((t: { title: string; searchUrl: string }) => ({
        topic: t.title,
        searchUrl: t.searchUrl,
        source: "google" as const,
      }));

      const xTopics: TrendingTopic[] = (xData.topics || []).slice(0, 10).map((t: { topic: string; searchUrl: string }) => ({
        topic: t.topic,
        searchUrl: t.searchUrl,
        source: "x" as const,
      }));

      // Interleave
      const mixed: TrendingTopic[] = [];
      const maxLen = Math.max(googleTopics.length, xTopics.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < googleTopics.length) mixed.push(googleTopics[i]);
        if (i < xTopics.length) mixed.push(xTopics[i]);
      }

      setTopics(mixed.slice(0, 16));
    } catch (err) {
      setError("Failed to load trends");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return (
    <div
      className="glass"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 16px",
          borderBottom: "1px solid var(--glass-border)",
          cursor: "pointer",
        }}
        onClick={() => {
          router.push("/tools/trending");
        }}
      >
        <Link
          href="/tools/trending"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            padding: "4px 8px 4px 0",
            margin: "-4px 0",
          }}
        >
          <TrendingUp style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>
            Trending
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchTrends();
            }}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "transparent",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              color: "var(--foreground-muted)",
            }}
            title="Refresh"
          >
            <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <Link
            href="/tools/trending"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              borderRadius: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "var(--foreground-muted)",
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            View All
            <ExternalLink style={{ width: "12px", height: "12px" }} />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
            <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--foreground-muted)", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--foreground-muted)", fontSize: "13px" }}>
            No trends available
          </div>
        )}

        {!loading && !error && topics.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {topics.map((topic, index) => (
              <a
                key={`${topic.source}-${index}`}
                href={topic.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span
                  style={{
                    fontSize: "12px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: topic.source === "google" ? "rgba(66, 133, 244, 0.15)" : "rgba(255, 255, 255, 0.1)",
                    color: topic.source === "google" ? "#4285f4" : "var(--foreground-muted)",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {topic.source === "google" ? "G" : "X"}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    color: "var(--foreground)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {topic.topic}
                </span>
                <ExternalLink style={{ width: "12px", height: "12px", color: "var(--foreground-muted)", flexShrink: 0, opacity: 0.5 }} />
              </a>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
