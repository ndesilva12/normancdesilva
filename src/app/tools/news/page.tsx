"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Newspaper, ExternalLink, Loader2, RefreshCw, Clock, Tag, X } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  creator?: string;
  categories?: string[];
  thumbnail?: string;
}

type NewsSource = "zerohedge" | "reason" | "mises";

const NEWS_SOURCES: { id: NewsSource; name: string; url: string }[] = [
  { id: "zerohedge", name: "ZeroHedge", url: "https://www.zerohedge.com" },
  { id: "reason", name: "Reason", url: "https://reason.com" },
  { id: "mises", name: "Mises Institute", url: "https://mises.org" },
];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<NewsSource>("zerohedge");
  const [readerArticle, setReaderArticle] = useState<NewsArticle | null>(null);
  const [readerContent, setReaderContent] = useState<string | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);

  const loadContent = useCallback(async (source: NewsSource) => {
    setIsLoading(true);
    setError(null);
    setArticles([]);

    try {
      const response = await fetch(`/api/news?source=${source}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch news");
      }

      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent(selectedSource);
  }, [selectedSource, loadContent]);

  const handleSourceChange = (source: NewsSource) => {
    setSelectedSource(source);
  };

  const openReader = async (article: NewsArticle) => {
    setReaderArticle(article);
    setReaderContent(null);
    setReaderLoading(true);

    try {
      const response = await fetch(`/api/news/reader?url=${encodeURIComponent(article.link)}`);
      const data = await response.json();

      if (response.ok && data.content) {
        setReaderContent(data.content);
      } else {
        // Fallback to description if reader fails
        setReaderContent(article.description || "Unable to load article content. Click the link below to read on the original site.");
      }
    } catch {
      setReaderContent(article.description || "Unable to load article content. Click the link below to read on the original site.");
    } finally {
      setReaderLoading(false);
    }
  };

  const closeReader = () => {
    setReaderArticle(null);
    setReaderContent(null);
  };

  const currentSource = NEWS_SOURCES.find((s) => s.id === selectedSource);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      return "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1000px",
            margin: "0 auto",
            padding: "32px 24px 100px 24px",
          }}
        >
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "32px" }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "var(--foreground)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <Newspaper style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
                  News
                </h1>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Latest articles from {currentSource?.name || "selected source"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => loadContent(selectedSource)}
                  disabled={isLoading}
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
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  <RefreshCw style={{ width: "16px", height: "16px", animation: isLoading ? "spin 1s linear infinite" : "none" }} />
                  Refresh
                </button>
                <a
                  href={currentSource?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    fontSize: "14px",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  Visit {currentSource?.name || "Site"}
                  <ExternalLink style={{ width: "16px", height: "16px" }} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Source Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              marginBottom: "24px",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <div
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px",
                borderRadius: "12px",
                width: "fit-content",
                minWidth: "max-content",
              }}
            >
              {NEWS_SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSourceChange(source.id)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: selectedSource === source.id ? "var(--accent)" : "transparent",
                    color: selectedSource === source.id ? "var(--background)" : "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {source.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "16px", color: "#f87171", marginBottom: "16px" }}>
                {error}
              </p>
              <button
                onClick={() => loadContent(selectedSource)}
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
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Articles Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {articles.map((article, index) => (
                  <motion.div
                    key={article.link}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass"
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      display: "flex",
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onClick={() => openReader(article)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Thumbnail */}
                    {article.thumbnail && (
                      <div
                        style={{
                          width: "200px",
                          minHeight: "140px",
                          flexShrink: 0,
                          backgroundImage: `url(${article.thumbnail})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {/* Title */}
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {article.title}
                      </h3>

                      {/* Description */}
                      <p
                        style={{
                          fontSize: "14px",
                          color: "var(--foreground-muted)",
                          lineHeight: 1.6,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          flex: 1,
                        }}
                      >
                        {article.description}
                      </p>

                      {/* Meta */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        {/* Time */}
                        {article.pubDate && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                            <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                              {formatDate(article.pubDate)}
                            </span>
                          </div>
                        )}

                        {/* Author */}
                        {article.creator && (
                          <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                            by {article.creator}
                          </span>
                        )}

                        {/* Categories */}
                        {article.categories && article.categories.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Tag style={{ width: "12px", height: "12px", color: "var(--foreground-muted)" }} />
                            <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                              {article.categories.slice(0, 2).join(", ")}
                            </span>
                          </div>
                        )}

                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "12px",
                            color: "var(--accent)",
                          }}
                        >
                          Click to read
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {articles.length === 0 && (
                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "40px",
                    textAlign: "center",
                  }}
                >
                  <Newspaper style={{ width: "40px", height: "40px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    No articles available
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Reader Modal */}
      {readerArticle && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={closeReader}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              width: "100%",
              maxWidth: "800px",
              maxHeight: "90vh",
              backgroundColor: "#0f0f0f",
              borderRadius: "16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Reader Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                borderBottom: "1px solid var(--glass-border)",
                flexShrink: 0,
              }}
            >
              <Newspaper style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
              <span style={{ flex: 1, fontSize: "14px", color: "var(--foreground-muted)" }}>
                {currentSource?.name}
              </span>
              <a
                href={readerArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Open Original
                <ExternalLink style={{ width: "14px", height: "14px" }} />
              </a>
              <button
                onClick={closeReader}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "var(--foreground)",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Reader Content */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "24px",
              }}
            >
              {/* Title */}
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  lineHeight: 1.3,
                  marginBottom: "16px",
                }}
              >
                {readerArticle.title}
              </h1>

              {/* Meta */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
                {readerArticle.pubDate && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                    <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                      {formatDate(readerArticle.pubDate)}
                    </span>
                  </div>
                )}
                {readerArticle.creator && (
                  <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    by {readerArticle.creator}
                  </span>
                )}
              </div>

              {/* Thumbnail */}
              {readerArticle.thumbnail && (
                <div
                  style={{
                    width: "100%",
                    height: "300px",
                    borderRadius: "12px",
                    marginBottom: "24px",
                    backgroundImage: `url(${readerArticle.thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}

              {/* Article Content */}
              {readerLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.8,
                    color: "var(--foreground)",
                  }}
                  dangerouslySetInnerHTML={{ __html: readerContent || "" }}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
