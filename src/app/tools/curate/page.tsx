"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Sparkles, Search, Filter, RefreshCw, ExternalLink, Clock, TrendingUp, Zap, BookOpen, History } from "lucide-react";

interface CuratedItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  duration: string;
  category: 'short-unique' | 'short-trending' | 'long-unique' | 'long-trending';
}

interface CurationHistory {
  id: string;
  topic: string;
  source: string;
  timestamp: string;
  itemCount: number;
  items: CuratedItem[];
}

export default function CuratePage() {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CuratedItem[]>([]);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<CurationHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/curate", {
        headers: { "x-user-id": user.uid },
      });
      const data = await response.json();
      setHistory(data.curations || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCurate = async () => {
    setLoading(true);
    setError("");
    
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) {
        headers["x-user-id"] = user.uid;
      }
      
      const response = await fetch("/api/curate", {
        method: "POST",
        headers,
        body: JSON.stringify({ topic: topic.trim() || "general", source }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to curate content");
      }
      
      const data = await response.json();
      setResults(data.items || []);
      loadHistory(); // Refresh history after new curation
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: CurationHistory) => {
    setResults(item.items);
    setTopic(item.topic === "general" ? "" : item.topic);
    setSource(item.source);
    setShowHistory(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'short-unique': return <Zap size={16} />;
      case 'short-trending': return <TrendingUp size={16} />;
      case 'long-unique': return <BookOpen size={16} />;
      case 'long-trending': return <Sparkles size={16} />;
      default: return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'short-unique': return 'Quick Insight';
      case 'short-trending': return 'Trending Now';
      case 'long-unique': return 'Deep Dive';
      case 'long-trending': return 'Popular Deep Dive';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'short-unique': return '#8b5cf6';
      case 'short-trending': return '#f59e0b';
      case 'long-unique': return '#3b82f6';
      case 'long-trending': return '#ec4899';
      default: return '#6b7280';
    }
  };

  // Group results by category
  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CuratedItem[]>);

  const categoryOrder = ['short-unique', 'short-trending', 'long-unique', 'long-trending'];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
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
          alignItems: "center",
          gap: "16px",
          marginBottom: "12px",
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Sparkles size={24} />
          </div>
          <h1 style={{
            fontSize: isMobile ? "32px" : "48px",
            fontWeight: "800",
            margin: 0,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Curate
          </h1>
        </div>
        
        <p style={{
          fontSize: isMobile ? "14px" : "18px",
          color: "#9ca3af",
          margin: 0,
          lineHeight: "1.6",
        }}>
          Discover intellectually rigorous content tailored to your worldview.
          <br />
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            Searches X, YouTube, Reddit, and the web for insights that matter.
          </span>
        </p>
      </div>

      {/* Search Interface */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        marginBottom: "48px",
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: isMobile ? "20px" : "32px",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
            gap: "16px",
            marginBottom: "16px",
          }}>
            {/* Topic Input */}
            <div>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#9ca3af",
                marginBottom: "8px",
              }}>
                Topic or "general" for chaos mode
              </label>
              <div style={{
                position: "relative",
              }}>
                <Search 
                  size={20} 
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280",
                  }}
                />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Federal Reserve, Austrian economics, or leave blank..."
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 48px",
                    fontSize: "16px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#ffffff",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCurate();
                  }}
                />
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#9ca3af",
                marginBottom: "8px",
              }}>
                Source Filter
              </label>
              <div style={{
                position: "relative",
              }}>
                <Filter 
                  size={20} 
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280",
                    pointerEvents: "none",
                  }}
                />
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 48px",
                    fontSize: "16px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#ffffff",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="all">All Sources</option>
                  <option value="x">X (Twitter)</option>
                  <option value="reddit">Reddit</option>
                  <option value="youtube">YouTube</option>
                  <option value="articles">Articles</option>
                  <option value="podcasts">Podcasts</option>
                </select>
              </div>
            </div>
          </div>

          {/* Curate Button */}
          <button
            onClick={handleCurate}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "700",
              background: loading 
                ? "linear-gradient(135deg, #4b5563 0%, #374151 100%)"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              transition: "all 0.2s",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Curating...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Curate Content
              </>
            )}
          </button>

          {error && (
            <div style={{
              marginTop: "16px",
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "14px",
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          {categoryOrder.map((category) => {
            const items = groupedResults[category];
            if (!items || items.length === 0) return null;

            return (
              <div key={category} style={{ marginBottom: "48px" }}>
                {/* Category Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                  paddingBottom: "12px",
                  borderBottom: `2px solid ${getCategoryColor(category)}`,
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: `${getCategoryColor(category)}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: getCategoryColor(category),
                  }}>
                    {getCategoryIcon(category)}
                  </div>
                  <h2 style={{
                    fontSize: isMobile ? "20px" : "24px",
                    fontWeight: "700",
                    margin: 0,
                    color: getCategoryColor(category),
                  }}>
                    {getCategoryLabel(category)}
                  </h2>
                  <span style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    fontWeight: "600",
                  }}>
                    ({items.length})
                  </span>
                </div>

                {/* Items Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(350px, 1fr))",
                  gap: "20px",
                }}>
                  {items.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
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
                        e.currentTarget.style.borderColor = getCategoryColor(category);
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = `0 8px 24px ${getCategoryColor(category)}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Gradient Accent */}
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        background: `linear-gradient(90deg, ${getCategoryColor(category)}, transparent)`,
                      }} />

                      {/* Content */}
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "12px",
                      }}>
                        <h3 style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#ffffff",
                          margin: 0,
                          lineHeight: "1.4",
                          flex: 1,
                        }}>
                          {item.title}
                        </h3>
                        <ExternalLink 
                          size={16} 
                          style={{
                            color: getCategoryColor(category),
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        />
                      </div>

                      <p style={{
                        fontSize: "14px",
                        color: "#9ca3af",
                        margin: "0 0 16px 0",
                        lineHeight: "1.6",
                      }}>
                        {item.summary}
                      </p>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        paddingTop: "16px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                      }}>
                        <span style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          fontWeight: "600",
                        }}>
                          {item.source}
                        </span>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: getCategoryColor(category),
                          fontWeight: "600",
                        }}>
                          <Clock size={14} />
                          {item.duration}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <div style={{
          maxWidth: "600px",
          margin: "64px auto",
          textAlign: "center",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Sparkles size={40} style={{ color: "#667eea" }} />
          </div>
          <h3 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#ffffff",
            marginBottom: "12px",
          }}>
            Ready to Discover
          </h3>
          <p style={{
            fontSize: "16px",
            color: "#9ca3af",
            lineHeight: "1.6",
          }}>
            Enter a topic you want to explore, or leave it blank for a curated mix of fascinating content across your interests.
          </p>
        </div>
      )}
    </div>
  );
}
