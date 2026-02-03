"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Radar, RefreshCw, ExternalLink, Lightbulb, AlertTriangle, MessageSquare, Headphones } from "lucide-react";

interface DeepSearchReport {
  topic: string;
  briefOverview: string;
  sections: Array<{
    title: string;
    content: string;
    links?: Array<{ title: string; url: string; type: string }>;
  }>;
  hiddenMechanics: string[];
  counterintuitiveInsights: string[];
  expertDebates: string[];
  underreportedAngles: string[];
  socialMediaHighlights: Array<{
    platform: string;
    author: string;
    content: string;
    url: string;
  }>;
  podcastReferences: Array<{
    title: string;
    episode: string;
    timestamp?: string;
    summary: string;
    url: string;
  }>;
}

export default function DeepSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DeepSearchReport | null>(null);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/deep-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to perform deep search");
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0a1a 0%, #1a1a2e 50%, #16213e 100%)",
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
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Radar size={24} />
          </div>
          <h1 style={{
            fontSize: isMobile ? "32px" : "48px",
            fontWeight: "800",
            margin: 0,
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Deep Search
          </h1>
        </div>
        
        <p style={{
          fontSize: isMobile ? "14px" : "18px",
          color: "#9ca3af",
          margin: 0,
          lineHeight: "1.6",
        }}>
          Multi-source deep research with hidden mechanics and expert insights.
          <br />
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            Uncover what others miss — the full story behind any topic.
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
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#9ca3af",
              marginBottom: "8px",
            }}>
              What do you want to research deeply?
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Quantum computing applications, AI regulation..."
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  fontSize: "16px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "16px",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "700",
              background: loading 
                ? "linear-gradient(135deg, #475569 0%, #334155 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
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
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.4)";
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
                Researching...
              </>
            ) : (
              <>
                <Radar size={20} />
                Deep Search
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
      {report && (
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}>
          {/* Brief Overview */}
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: isMobile ? "20px" : "32px",
            marginBottom: "24px",
          }}>
            <h2 style={{
              fontSize: isMobile ? "20px" : "24px",
              fontWeight: "700",
              color: "#3b82f6",
              marginBottom: "16px",
            }}>
              Overview
            </h2>
            <p style={{
              fontSize: "15px",
              lineHeight: "1.7",
              color: "#cbd5e1",
              margin: 0,
            }}>
              {report.briefOverview}
            </p>
          </div>

          {/* Hidden Mechanics */}
          {report.hiddenMechanics && report.hiddenMechanics.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
              borderRadius: "16px",
              padding: isMobile ? "20px" : "32px",
              marginBottom: "24px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(168, 85, 247, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#a855f7",
                }}>
                  <Lightbulb size={18} />
                </div>
                <h2 style={{
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#a855f7",
                }}>
                  Hidden Mechanics
                </h2>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: "24px",
                listStyle: "none",
              }}>
                {report.hiddenMechanics.map((mechanic, idx) => (
                  <li key={idx} style={{
                    fontSize: "15px",
                    lineHeight: "1.7",
                    color: "#cbd5e1",
                    marginBottom: "12px",
                    position: "relative",
                    paddingLeft: "8px",
                  }}>
                    <span style={{
                      position: "absolute",
                      left: "-16px",
                      color: "#a855f7",
                      fontWeight: "bold",
                    }}>•</span>
                    {mechanic}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Counterintuitive Insights */}
          {report.counterintuitiveInsights && report.counterintuitiveInsights.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "16px",
              padding: isMobile ? "20px" : "32px",
              marginBottom: "24px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f59e0b",
                }}>
                  <AlertTriangle size={18} />
                </div>
                <h2 style={{
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#f59e0b",
                }}>
                  Counterintuitive Insights
                </h2>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: "24px",
                listStyle: "none",
              }}>
                {report.counterintuitiveInsights.map((insight, idx) => (
                  <li key={idx} style={{
                    fontSize: "15px",
                    lineHeight: "1.7",
                    color: "#cbd5e1",
                    marginBottom: "12px",
                    position: "relative",
                    paddingLeft: "8px",
                  }}>
                    <span style={{
                      position: "absolute",
                      left: "-16px",
                      color: "#f59e0b",
                      fontWeight: "bold",
                    }}>•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expert Debates */}
          {report.expertDebates && report.expertDebates.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "16px",
              padding: isMobile ? "20px" : "32px",
              marginBottom: "24px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                }}>
                  <MessageSquare size={18} />
                </div>
                <h2 style={{
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#ef4444",
                }}>
                  Expert Debates
                </h2>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: "24px",
                listStyle: "none",
              }}>
                {report.expertDebates.map((debate, idx) => (
                  <li key={idx} style={{
                    fontSize: "15px",
                    lineHeight: "1.7",
                    color: "#cbd5e1",
                    marginBottom: "12px",
                    position: "relative",
                    paddingLeft: "8px",
                  }}>
                    <span style={{
                      position: "absolute",
                      left: "-16px",
                      color: "#ef4444",
                      fontWeight: "bold",
                    }}>•</span>
                    {debate}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social Media Highlights */}
          {report.socialMediaHighlights && report.socialMediaHighlights.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "16px",
              padding: isMobile ? "20px" : "32px",
              marginBottom: "24px",
            }}>
              <h3 style={{
                fontSize: isMobile ? "16px" : "18px",
                fontWeight: "700",
                margin: "0 0 16px 0",
                color: "#3b82f6",
              }}>
                Social Media Highlights
              </h3>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}>
                {report.socialMediaHighlights.map((highlight, idx) => (
                  <a
                    key={idx}
                    href={highlight.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      padding: "16px",
                      background: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#3b82f6",
                        textTransform: "uppercase",
                      }}>
                        {highlight.platform}
                      </span>
                      <ExternalLink size={14} style={{ color: "#6b7280" }} />
                    </div>
                    <p style={{
                      fontSize: "14px",
                      color: "#e2e8f0",
                      lineHeight: "1.5",
                      margin: "0 0 8px 0",
                    }}>
                      {highlight.content}
                    </p>
                    <p style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      margin: 0,
                    }}>
                      — {highlight.author}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Podcast References */}
          {report.podcastReferences && report.podcastReferences.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "16px",
              padding: isMobile ? "20px" : "32px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}>
                <Headphones size={18} style={{ color: "#8b5cf6" }} />
                <h3 style={{
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#8b5cf6",
                }}>
                  Podcast References
                </h3>
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}>
                {report.podcastReferences.map((podcast, idx) => (
                  <a
                    key={idx}
                    href={podcast.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      padding: "16px",
                      background: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#8b5cf6";
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}>
                      <h4 style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#e2e8f0",
                        margin: 0,
                      }}>
                        {podcast.title}
                      </h4>
                      <ExternalLink size={14} style={{ color: "#6b7280" }} />
                    </div>
                    <p style={{
                      fontSize: "13px",
                      color: "#8b5cf6",
                      margin: "0 0 8px 0",
                    }}>
                      {podcast.episode}
                      {podcast.timestamp && ` • ${podcast.timestamp}`}
                    </p>
                    <p style={{
                      fontSize: "14px",
                      color: "#94a3b8",
                      lineHeight: "1.5",
                      margin: 0,
                    }}>
                      {podcast.summary}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !report && (
        <div style={{
          maxWidth: "600px",
          margin: "64px auto",
          textAlign: "center",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.2) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Radar size={40} style={{ color: "#3b82f6" }} />
          </div>
          <h3 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#ffffff",
            marginBottom: "12px",
          }}>
            Ready to Research
          </h3>
          <p style={{
            fontSize: "16px",
            color: "#9ca3af",
            lineHeight: "1.6",
          }}>
            Enter any topic to get a comprehensive deep search report with hidden mechanics, expert insights, and social context.
          </p>
        </div>
      )}
    </div>
  );
}
