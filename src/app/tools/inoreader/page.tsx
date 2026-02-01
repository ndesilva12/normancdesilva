"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Rss,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface RSSArticle {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  source: string;
}

const RSS_FEEDS = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
];

export default function InoreaderPage() {
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rss-feeds");
      if (!response.ok) throw new Error("Failed to fetch RSS feeds");
      const data = await response.json();
      setArticles(data.articles || []);
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
      if (diffHours < 1) {
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${diffMinutes}m ago`;
      }
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "16px" : "20px" }}>
          <RemindersBanner />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                textDecoration: "none",
              }}
            >
              <ArrowLeft style={{ width: "20px", height: "20px" }} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <Rss style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>
                  RSS Feeds
                </h1>
              </div>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Latest articles from your RSS feeds
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <a
                href="https://www.inoreader.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "transparent",
                  color: "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--foreground-muted)";
                }}
              >
                <ExternalLink style={{ width: "16px", height: "16px" }} />
                Open in Inoreader
              </a>
              <button
                onClick={fetchArticles}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "transparent",
                  color: "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <RefreshCw style={{ width: "16px", height: "16px", animation: loading ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass"
            style={{ borderRadius: "12px", overflow: "hidden" }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : error ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <p style={{ color: "#f87171", fontSize: "16px", marginBottom: "16px" }}>{error}</p>
                <button
                  onClick={fetchArticles}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--foreground-muted)" }}>
                <Rss style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
                <p style={{ fontSize: "18px", fontWeight: 500, marginBottom: "8px" }}>No articles found</p>
                <p style={{ fontSize: "14px" }}>Check back later for updates</p>
              </div>
            ) : (
              <div>
                {articles.map((article, index) => (
                  <a
                    key={index}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      padding: isMobile ? "16px" : "20px",
                      borderBottom: index < articles.length - 1 ? "1px solid var(--glass-border)" : "none",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", flex: 1, lineHeight: "1.4" }}>
                        {article.title}
                      </h3>
                      <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0, marginTop: "2px" }} />
                    </div>
                    {article.description && (
                      <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
                        {article.description.substring(0, 200)}{article.description.length > 200 ? "..." : ""}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "13px", color: "var(--accent)", fontWeight: 500 }}>
                        {article.source}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>•</span>
                      <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        {formatDate(article.pubDate)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
