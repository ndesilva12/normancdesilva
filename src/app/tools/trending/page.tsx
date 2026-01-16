"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface TrendingTopic {
  topic: string;
  description?: string;
  searchUrl: string;
  source: "x" | "google";
}

type TrendingSource = "all" | "x" | "google";

export default function TrendingPage() {
  const [xTopics, setXTopics] = useState<TrendingTopic[]>([]);
  const [googleTopics, setGoogleTopics] = useState<TrendingTopic[]>([]);
  const [isLoadingX, setIsLoadingX] = useState(true);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(true);
  const [errorX, setErrorX] = useState<string | null>(null);
  const [errorGoogle, setErrorGoogle] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<TrendingSource>("all");

  const loadXTrending = useCallback(async () => {
    setIsLoadingX(true);
    setErrorX(null);

    try {
      const response = await fetch("/api/x-trending");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch X trending topics");
      }

      const topics = (data.topics || []).map((t: { topic: string; description?: string; searchUrl: string }) => ({
        ...t,
        source: "x" as const,
      }));
      setXTopics(topics);
    } catch (err) {
      setErrorX(err instanceof Error ? err.message : "Failed to load X trending");
    } finally {
      setIsLoadingX(false);
    }
  }, []);

  const loadGoogleTrending = useCallback(async () => {
    setIsLoadingGoogle(true);
    setErrorGoogle(null);

    try {
      const response = await fetch("/api/google-trends");
      const data = await response.json();

      const topics = (data.trends || []).map((t: { title: string; searchUrl: string }) => ({
        topic: t.title,
        searchUrl: t.searchUrl,
        source: "google" as const,
      }));
      setGoogleTopics(topics);
    } catch (err) {
      setErrorGoogle(err instanceof Error ? err.message : "Failed to load Google Trends");
    } finally {
      setIsLoadingGoogle(false);
    }
  }, []);

  useEffect(() => {
    loadXTrending();
    loadGoogleTrending();
  }, [loadXTrending, loadGoogleTrending]);

  const handleRefresh = () => {
    if (selectedSource === "all" || selectedSource === "x") {
      loadXTrending();
    }
    if (selectedSource === "all" || selectedSource === "google") {
      loadGoogleTrending();
    }
  };

  const isLoading = (selectedSource === "all" && (isLoadingX || isLoadingGoogle)) ||
    (selectedSource === "x" && isLoadingX) ||
    (selectedSource === "google" && isLoadingGoogle);

  const getFilteredTopics = (): TrendingTopic[] => {
    switch (selectedSource) {
      case "x":
        return xTopics;
      case "google":
        return googleTopics;
      case "all":
      default:
        // Interleave topics from both sources
        const combined: TrendingTopic[] = [];
        const maxLength = Math.max(xTopics.length, googleTopics.length);
        for (let i = 0; i < maxLength; i++) {
          if (i < xTopics.length) combined.push(xTopics[i]);
          if (i < googleTopics.length) combined.push(googleTopics[i]);
        }
        return combined;
    }
  };

  const filteredTopics = getFilteredTopics();

  const getSourceColor = (source: "x" | "google") => {
    return source === "x" ? "#1d9bf0" : "#4285f4";
  };

  const getSourceIcon = (source: "x" | "google") => {
    if (source === "x") {
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    );
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
                  <TrendingUp style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
                  Trending
                </h1>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  What&apos;s trending on X and Google right now
                </p>
              </div>
              <button
                onClick={handleRefresh}
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
            </div>
          </motion.div>

          {/* Source Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ marginBottom: "24px" }}
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
              }}
            >
              {[
                { id: "all" as TrendingSource, name: "All", icon: null },
                { id: "x" as TrendingSource, name: "X (Twitter)", icon: getSourceIcon("x") },
                { id: "google" as TrendingSource, name: "Google Trends", icon: getSourceIcon("google") },
              ].map((source) => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
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
                  {source.icon}
                  {source.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Loading States */}
          {isLoading && filteredTopics.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Error Messages */}
              {selectedSource !== "google" && errorX && (
                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "16px",
                    borderLeft: "4px solid #f87171",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#f87171" }}>
                    X Trending: {errorX}
                  </p>
                </div>
              )}
              {selectedSource !== "x" && errorGoogle && (
                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "16px",
                    borderLeft: "4px solid #f87171",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#f87171" }}>
                    Google Trends: {errorGoogle}
                  </p>
                </div>
              )}

              {/* Topics List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredTopics.map((topic, index) => (
                  <motion.a
                    key={`${topic.source}-${topic.topic}-${index}`}
                    href={topic.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="glass"
                    style={{
                      borderRadius: "10px",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      textDecoration: "none",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(4px)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: `${getSourceColor(topic.source)}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: getSourceColor(topic.source),
                      }}
                    >
                      {getSourceIcon(topic.source)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          marginBottom: topic.description ? "4px" : 0,
                        }}
                      >
                        {topic.topic}
                      </h3>
                      {topic.description && (
                        <p
                          style={{
                            fontSize: "13px",
                            color: "var(--foreground-muted)",
                            lineHeight: 1.4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {topic.description}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor: `${getSourceColor(topic.source)}15`,
                          color: getSourceColor(topic.source),
                          fontWeight: 500,
                          textTransform: "uppercase",
                        }}
                      >
                        {topic.source === "x" ? "X" : "Google"}
                      </span>
                      <ExternalLink
                        style={{
                          width: "16px",
                          height: "16px",
                          color: getSourceColor(topic.source),
                        }}
                      />
                    </div>
                  </motion.a>
                ))}
              </div>

              {filteredTopics.length === 0 && !isLoading && (
                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "40px",
                    textAlign: "center",
                  }}
                >
                  <TrendingUp style={{ width: "40px", height: "40px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    No trending topics available
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
