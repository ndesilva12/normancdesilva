"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, ExternalLink, RefreshCw, Hash, Globe } from "lucide-react";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const getTopicUrl = (topic: TrendingTopic) => {
    if (topic.source === "x") {
      return `https://x.com/search?q=${encodeURIComponent(topic.topic)}`;
    }
    return topic.searchUrl;
  };

  const getSourceIcon = (source: "x" | "google") => {
    if (source === "x") {
      return <Hash size={14} />;
    }
    return <Globe size={14} />;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0f0a 0%, #2a1e1a 50%, #1e1a26 100%)",
      color: "#ffffff",
      padding: isMobile ? "16px" : "32px",
    }}>
      {/* Header */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        marginBottom: "48px",
      }}>
        <Link 
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#9ca3af",
            textDecoration: "none",
            fontSize: "14px",
            marginBottom: "24px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          gap: "16px",
          marginBottom: "12px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 style={{
                fontSize: isMobile ? "32px" : "48px",
                fontWeight: "800",
                margin: 0,
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Trending
              </h1>
              <p style={{
                fontSize: "14px",
                color: "#9ca3af",
                margin: "4px 0 0 0",
              }}>
                What's trending on X and Google right now
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: "600",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#ffffff",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Source Selector */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        marginBottom: "32px",
      }}>
        <div style={{
          display: "flex",
          gap: "8px",
          padding: "6px",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          width: "fit-content",
        }}>
          {[
            { id: "all" as TrendingSource, name: "All Sources" },
            { id: "x" as TrendingSource, name: "X (Twitter)" },
            { id: "google" as TrendingSource, name: "Google" },
          ].map((source) => (
            <button
              key={source.id}
              onClick={() => setSelectedSource(source.id)}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                background: selectedSource === source.id 
                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  : "transparent",
                border: "none",
                borderRadius: "8px",
                color: selectedSource === source.id ? "#ffffff" : "#9ca3af",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (selectedSource !== source.id) {
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSource !== source.id) {
                  e.currentTarget.style.color = "#9ca3af";
                }
              }}
            >
              {source.name}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {errorX && selectedSource !== "google" && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "14px",
            marginBottom: "16px",
          }}>
            X Error: {errorX}
          </div>
        )}

        {errorGoogle && selectedSource !== "x" && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "14px",
            marginBottom: "16px",
          }}>
            Google Error: {errorGoogle}
          </div>
        )}

        {isLoading && filteredTopics.length === 0 ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "80px 0",
          }}>
            <RefreshCw size={32} style={{ color: "#f59e0b" }} className="animate-spin" />
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "16px",
          }}>
            {filteredTopics.map((topic, idx) => (
              <a
                key={`${topic.source}-${idx}`}
                href={getTopicUrl(topic)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  background: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "20px",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = getSourceColor(topic.source);
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${getSourceColor(topic.source)}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Gradient accent */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: `linear-gradient(90deg, ${getSourceColor(topic.source)}, transparent)`,
                }} />

                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: topic.description ? "12px" : "0",
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#ffffff",
                      margin: "0 0 8px 0",
                      lineHeight: "1.4",
                    }}>
                      {topic.topic}
                    </h3>
                    {topic.description && (
                      <p style={{
                        fontSize: "14px",
                        color: "#9ca3af",
                        margin: 0,
                        lineHeight: "1.5",
                      }}>
                        {topic.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink 
                    size={16} 
                    style={{
                      color: getSourceColor(topic.source),
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    background: `${getSourceColor(topic.source)}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: getSourceColor(topic.source),
                  }}>
                    {getSourceIcon(topic.source)}
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: getSourceColor(topic.source),
                    textTransform: "uppercase",
                  }}>
                    {topic.source === "x" ? "X" : "Google"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {!isLoading && filteredTopics.length === 0 && (
          <div style={{
            maxWidth: "600px",
            margin: "64px auto",
            textAlign: "center",
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <TrendingUp size={40} style={{ color: "#f59e0b" }} />
            </div>
            <h3 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#ffffff",
              marginBottom: "12px",
            }}>
              No Trending Topics
            </h3>
            <p style={{
              fontSize: "16px",
              color: "#9ca3af",
              lineHeight: "1.6",
            }}>
              Unable to load trending topics. Try refreshing or selecting a different source.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
