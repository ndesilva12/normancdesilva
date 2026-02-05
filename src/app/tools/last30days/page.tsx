"use client";

import { useState, useEffect } from "react";
import { Calendar, Search, Globe, MessageSquare, Hash, RefreshCw, ExternalLink, TrendingUp, CheckCircle, XCircle, Lightbulb, FileText } from "lucide-react";
import { IntelToolNav } from "@/components/IntelToolNav";

interface ResearchResult {
  patterns: string[];
  mistakes: string[];
  techniques: Array<{ technique: string; source: string; url: string }>;
  sources: Array<{ url: string; description: string; platform: string }>;
  prompt?: string;
}

export default function Last30DaysPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleResearch = async () => {
    if (!query.trim()) {
      setError("Please enter a research topic");
      return;
    }
    
    setLoading(true);
    setError("");
    setResult(null);
    
    try {
      const response = await fetch("/api/last30days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to research topic");
      }
      
      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'reddit': return <MessageSquare size={14} />;
      case 'x': case 'twitter': return <Hash size={14} />;
      case 'web': return <Globe size={14} />;
      default: return <Globe size={14} />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'reddit': return '#FF4500';
      case 'x': case 'twitter': return '#1DA1F2';
      case 'web': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)",
      color: "#f1f5f9",
      padding: isMobile ? "16px" : "32px",
    }}>
      {/* Header */}
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        marginBottom: "48px",
      }}>
        <IntelToolNav current="l3d" />
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "14px",
            marginBottom: "24px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#f1f5f9"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
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
            background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Calendar size={24} />
          </div>
          <h1 style={{
            fontSize: isMobile ? "32px" : "48px",
            fontWeight: "800",
            margin: 0,
            background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Last 30 Days
          </h1>
        </div>
        
        <p style={{
          fontSize: isMobile ? "14px" : "18px",
          color: "#94a3b8",
          margin: 0,
          lineHeight: "1.6",
        }}>
          Research what people are actually saying <em>right now</em> across Reddit, X, and the web.
          <br />
          <span style={{ fontSize: "14px", color: "#64748b" }}>
            Get synthesized insights, patterns, and actionable takeaways from the last 30 days.
          </span>
        </p>
      </div>

      {/* Search Interface */}
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        marginBottom: "48px",
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          borderRadius: "16px",
          padding: isMobile ? "20px" : "32px",
        }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#94a3b8",
              marginBottom: "8px",
            }}>
              What do you want to research?
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
                  color: "#64748b",
                }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Claude Code best practices, Midjourney v7 prompting..."
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  fontSize: "16px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "12px",
                  color: "#f1f5f9",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(148, 163, 184, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleResearch();
                }}
              />
            </div>
          </div>

          <button
            onClick={handleResearch}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "16px",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "700",
              background: loading 
                ? "linear-gradient(135deg, #475569 0%, #334155 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
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
                <TrendingUp size={20} />
                Research Topic
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
      {result && (
        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}>
          {/* What's Working */}
          {result.patterns && result.patterns.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
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
                  background: "rgba(16, 185, 129, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981",
                }}>
                  <CheckCircle size={18} />
                </div>
                <h2 style={{
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#10b981",
                }}>
                  What's Working
                </h2>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: "24px",
                listStyle: "none",
              }}>
                {result.patterns.map((pattern, idx) => (
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
                      color: "#10b981",
                      fontWeight: "bold",
                    }}>•</span>
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Mistakes */}
          {result.mistakes && result.mistakes.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
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
                  <XCircle size={18} />
                </div>
                <h2 style={{
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#ef4444",
                }}>
                  Common Mistakes
                </h2>
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: "24px",
                listStyle: "none",
              }}>
                {result.mistakes.map((mistake, idx) => (
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
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Techniques */}
          {result.techniques && result.techniques.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
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
                  background: "rgba(59, 130, 246, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                }}>
                  <Lightbulb size={18} />
                </div>
                <h2 style={{
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#3b82f6",
                }}>
                  Key Techniques
                </h2>
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}>
                {result.techniques.map((tech, idx) => (
                  <div key={idx} style={{
                    padding: "16px",
                    background: "rgba(15, 23, 42, 0.4)",
                    borderRadius: "8px",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                  }}>
                    <p style={{
                      margin: "0 0 8px 0",
                      fontSize: "15px",
                      lineHeight: "1.6",
                      color: "#e2e8f0",
                    }}>
                      {tech.technique}
                    </p>
                    <a
                      href={tech.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        color: "#3b82f6",
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={12} />
                      {tech.source}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ready-to-Use Prompt */}
          {result.prompt && (
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
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
                  <FileText size={18} />
                </div>
                <h2 style={{
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "700",
                  margin: 0,
                  color: "#a855f7",
                }}>
                  Ready-to-Use Prompt
                </h2>
              </div>
              <pre style={{
                margin: 0,
                padding: "20px",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: "8px",
                fontSize: "14px",
                lineHeight: "1.6",
                color: "#cbd5e1",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}>
                {result.prompt}
              </pre>
            </div>
          )}

          {/* Sources */}
          {result.sources && result.sources.length > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(148, 163, 184, 0.1)",
              borderRadius: "16px",
              padding: isMobile ? "20px" : "32px",
            }}>
              <h3 style={{
                fontSize: isMobile ? "16px" : "18px",
                fontWeight: "700",
                margin: "0 0 16px 0",
                color: "#94a3b8",
              }}>
                Sources
              </h3>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}>
                {result.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px",
                      background: "rgba(15, 23, 42, 0.4)",
                      borderRadius: "8px",
                      textDecoration: "none",
                      transition: "all 0.2s",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = getPlatformColor(src.platform);
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
                      e.currentTarget.style.background = "rgba(15, 23, 42, 0.4)";
                    }}
                  >
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: `${getPlatformColor(src.platform)}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: getPlatformColor(src.platform),
                      flexShrink: 0,
                    }}>
                      {getPlatformIcon(src.platform)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: "0 0 4px 0",
                        fontSize: "14px",
                        color: "#e2e8f0",
                        lineHeight: "1.5",
                      }}>
                        {src.description}
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#64748b",
                      }}>
                        {src.platform} • {new URL(src.url).hostname}
                      </p>
                    </div>
                    <ExternalLink 
                      size={16} 
                      style={{
                        color: "#64748b",
                        flexShrink: 0,
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && (
        <div style={{
          maxWidth: "600px",
          margin: "64px auto",
          textAlign: "center",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Calendar size={40} style={{ color: "#3b82f6" }} />
          </div>
          <h3 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#f1f5f9",
            marginBottom: "12px",
          }}>
            Ready to Research
          </h3>
          <p style={{
            fontSize: "16px",
            color: "#94a3b8",
            lineHeight: "1.6",
          }}>
            Enter any topic to discover what people are saying about it in the last 30 days across Reddit, X, and the web.
          </p>
        </div>
      )}
    </div>
  );
}
