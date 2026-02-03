"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Lock, RefreshCw, ExternalLink, Eye, FileSearch, Link2 } from "lucide-react";

interface DarkSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  type: "long" | "short" | "links";
}

export default function DarkSearchPage() {
  const [query, setQuery] = useState("");
  const [outputMode, setOutputMode] = useState<"long" | "short" | "links">("long");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DarkSearchResult[]>([]);
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
    setResults([]);

    try {
      const response = await fetch("/api/dark-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: query.trim(),
          outputMode 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to perform dark search");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getOutputModeIcon = (mode: string) => {
    switch (mode) {
      case "long": return <FileSearch size={16} />;
      case "short": return <Eye size={16} />;
      case "links": return <Link2 size={16} />;
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0a0f 0%, #2a1a1e 50%, #1e1626 100%)",
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
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Lock size={24} />
          </div>
          <h1 style={{
            fontSize: isMobile ? "32px" : "48px",
            fontWeight: "800",
            margin: 0,
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Dark Search
          </h1>
        </div>
        
        <p style={{
          fontSize: isMobile ? "14px" : "18px",
          color: "#9ca3af",
          margin: 0,
          lineHeight: "1.6",
        }}>
          Discover hidden content beyond the surface web.
          <br />
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            Academic papers, forums, hidden discussions, and hard-to-find resources.
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
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#9ca3af",
              marginBottom: "8px",
            }}>
              What are you searching for?
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
                placeholder="e.g., Zero-day exploits, academic research, dark web forums..."
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
                  e.target.style.borderColor = "#ef4444";
                  e.target.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.1)";
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

          {/* Output Mode Selection */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: "#9ca3af",
              marginBottom: "8px",
            }}>
              Output Mode
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}>
              {[
                { value: "long", label: "Long Report", desc: "Detailed analysis" },
                { value: "short", label: "Short Summary", desc: "Quick overview" },
                { value: "links", label: "Links Only", desc: "Just the sources" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setOutputMode(mode.value as any)}
                  style={{
                    padding: "12px",
                    background: outputMode === mode.value 
                      ? "rgba(239, 68, 68, 0.2)"
                      : "rgba(0, 0, 0, 0.3)",
                    border: outputMode === mode.value
                      ? "1px solid #ef4444"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: outputMode === mode.value ? "#ef4444" : "#9ca3af",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseEnter={(e) => {
                    if (outputMode !== mode.value) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (outputMode !== mode.value) {
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                    }
                  }}
                >
                  {getOutputModeIcon(mode.value)}
                  <span>{mode.label}</span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "400",
                    opacity: 0.7,
                  }}>
                    {mode.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "700",
              background: loading 
                ? "linear-gradient(135deg, #475569 0%, #334155 100%)"
                : "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
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
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(239, 68, 68, 0.4)";
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
                Searching...
              </>
            ) : (
              <>
                <Lock size={20} />
                Dark Search
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
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            {results.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
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
                  e.currentTarget.style.borderColor = "#ef4444";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(239, 68, 68, 0.3)";
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
                  background: "linear-gradient(90deg, #ef4444, transparent)",
                }} />

                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "8px",
                }}>
                  <h3 style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#ffffff",
                    margin: 0,
                    lineHeight: "1.4",
                    flex: 1,
                  }}>
                    {result.title}
                  </h3>
                  <ExternalLink 
                    size={16} 
                    style={{
                      color: "#ef4444",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                </div>

                {outputMode !== "links" && (
                  <p style={{
                    fontSize: "14px",
                    color: "#9ca3af",
                    margin: "0 0 12px 0",
                    lineHeight: "1.6",
                  }}>
                    {result.snippet}
                  </p>
                )}

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <span style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#ef4444",
                    fontWeight: "600",
                  }}>
                    {result.source}
                  </span>
                </div>
              </a>
            ))}
          </div>
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
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Lock size={40} style={{ color: "#ef4444" }} />
          </div>
          <h3 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#ffffff",
            marginBottom: "12px",
          }}>
            Ready to Explore
          </h3>
          <p style={{
            fontSize: "16px",
            color: "#9ca3af",
            lineHeight: "1.6",
          }}>
            Enter your query to discover hidden content, academic papers, specialized forums, and hard-to-find resources across the web.
          </p>
        </div>
      )}
    </div>
  );
}
