"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { Search, ExternalLink, X, Loader2, TrendingUp, ChevronDown } from "lucide-react";
import {
  SearchSource,
  SEARCH_SOURCES,
  getSearchUrl,
  SearchResult,
  WebSearchResultItem,
} from "@/lib/search-service";

interface TrendingSearch {
  title: string;
  searchUrl: string;
}

interface MultiSourceSearchProps {
  onResultsChange?: (results: SearchResult[]) => void;
}

export function MultiSourceSearch({ onResultsChange }: MultiSourceSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<SearchSource[]>(["duck"]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trends, setTrends] = useState<TrendingSearch[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch Google Trends on mount
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const response = await fetch("/api/google-trends");
      const data = await response.json();
      if (data.trends && data.trends.length > 0) {
        setTrends(data.trends.slice(0, 10));
      }
    } catch (error) {
      console.error("Error fetching trends:", error);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const toggleSource = (source: SearchSource) => {
    setSelectedSources((prev) => {
      if (prev.includes(source)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== source);
      }
      return [...prev, source];
    });
  };

  const handleTrendClick = (trend: TrendingSearch) => {
    setQuery(trend.title);
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || selectedSources.length === 0) return;

    setIsSearching(true);

    // Initialize all results as loading
    const initialResults: SearchResult[] = selectedSources.map((sourceId) => {
      const sourceConfig = SEARCH_SOURCES.find((s) => s.id === sourceId);
      return {
        source: sourceId,
        sourceName: sourceConfig?.name || sourceId,
        type: sourceConfig?.type || "web",
        status: "loading" as const,
        url: getSearchUrl(sourceId, query.trim()),
      };
    });

    setResults([...initialResults]);
    if (onResultsChange) onResultsChange([...initialResults]);

    // Fetch all results in parallel
    const fetchPromises = selectedSources.map(async (sourceId) => {
      const sourceConfig = SEARCH_SOURCES.find((s) => s.id === sourceId);

      if (sourceConfig?.type === "ai") {
        // AI sources
        try {
          const response = await fetch(
            `/api/search?q=${encodeURIComponent(query.trim())}&source=${sourceId}`
          );
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Search failed");
          }

          return {
            source: sourceId,
            content: data.content,
            status: "success" as const,
            type: "ai" as const,
          };
        } catch (error) {
          return {
            source: sourceId,
            error: error instanceof Error ? error.message : "Search failed",
            status: "error" as const,
            type: "ai" as const,
          };
        }
      } else {
        // Web sources - fetch from our API
        try {
          const response = await fetch(
            `/api/web-search?q=${encodeURIComponent(query.trim())}&source=${sourceId}`
          );
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Search failed");
          }

          return {
            source: sourceId,
            webResults: data.results as WebSearchResultItem[],
            instantAnswer: data.instant_answer,
            status: "success" as const,
            type: "web" as const,
          };
        } catch (error) {
          return {
            source: sourceId,
            error: error instanceof Error ? error.message : "Search failed",
            status: "error" as const,
            type: "web" as const,
          };
        }
      }
    });

    const fetchedResults = await Promise.all(fetchPromises);

    // Merge fetched results with initial results
    const finalResults = initialResults.map((result) => {
      const fetched = fetchedResults.find((r) => r.source === result.source);
      if (fetched) {
        return {
          ...result,
          status: fetched.status,
          content: fetched.type === "ai" && fetched.status === "success" ? fetched.content : undefined,
          webResults: fetched.type === "web" && fetched.status === "success" ? fetched.webResults : undefined,
          instantAnswer: fetched.type === "web" && fetched.status === "success" ? fetched.instantAnswer : undefined,
          error: fetched.status === "error" ? fetched.error : undefined,
        };
      }
      return result;
    });

    setResults(finalResults);
    if (onResultsChange) onResultsChange(finalResults);
    setIsSearching(false);
  };

  const clearResults = () => {
    setResults([]);
    if (onResultsChange) onResultsChange([]);
  };

  const isSingleSource = selectedSources.length === 1;

  // Render a single web result item
  const renderWebResultItem = (item: WebSearchResultItem, index: number, isFullView: boolean) => (
    <a
      key={index}
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: isFullView ? "16px 0" : "12px 0",
        borderBottom: "1px solid var(--glass-border)",
        textDecoration: "none",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <div
        style={{
          fontSize: isFullView ? "16px" : "14px",
          fontWeight: 500,
          color: "var(--accent)",
          marginBottom: "4px",
        }}
      >
        {item.title}
      </div>
      <div
        style={{
          fontSize: isFullView ? "13px" : "11px",
          color: "var(--foreground-muted)",
          marginBottom: "6px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.url}
      </div>
      <div
        style={{
          fontSize: isFullView ? "14px" : "13px",
          color: "var(--foreground)",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: isFullView ? 4 : 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item.snippet}
      </div>
    </a>
  );

  // Render full-page single source results
  const renderSingleSourceResults = (result: SearchResult) => {
    const sourceConfig = SEARCH_SOURCES.find((s) => s.id === result.source);

    return (
      <div
        className="glass"
        style={{
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderBottom: "1px solid var(--glass-border)",
          }}
        >
          <span style={{ fontSize: "24px" }}>{sourceConfig?.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "18px", color: "var(--foreground)" }}>
              {result.sourceName}
            </div>
            <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
              {result.type === "web" ? "Search Results" : "AI Response"}
            </div>
          </div>
          {result.status === "loading" && (
            <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          )}
          {result.type === "web" && result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "var(--foreground-muted)",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Open in {result.sourceName}
              <ExternalLink style={{ width: "14px", height: "14px" }} />
            </a>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {result.status === "loading" && (
            <div style={{ color: "var(--foreground-muted)", fontSize: "14px", textAlign: "center", padding: "40px" }}>
              Fetching results...
            </div>
          )}

          {result.status === "error" && (
            <div style={{ color: "#f87171", fontSize: "14px", textAlign: "center", padding: "40px" }}>
              Error: {result.error}
            </div>
          )}

          {result.status === "success" && result.type === "ai" && result.content && (
            <div
              style={{
                fontSize: "15px",
                lineHeight: 1.8,
                color: "var(--foreground)",
                whiteSpace: "pre-wrap",
              }}
            >
              {result.content}
            </div>
          )}

          {result.status === "success" && result.type === "web" && (
            <>
              {result.instantAnswer && (
                <div
                  style={{
                    padding: "16px",
                    marginBottom: "20px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(6, 182, 212, 0.1)",
                    borderLeft: "4px solid var(--accent)",
                  }}
                >
                  <div style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--foreground)" }}>
                    {result.instantAnswer}
                  </div>
                </div>
              )}
              {result.webResults && result.webResults.length > 0 ? (
                <div>
                  {result.webResults.map((item, index) => renderWebResultItem(item, index, true))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                  No results found. Try searching directly on {result.sourceName}.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Render multi-source result card with preview
  const renderResultCard = (result: SearchResult) => {
    const sourceConfig = SEARCH_SOURCES.find((s) => s.id === result.source);

    return (
      <div
        key={result.source}
        className="glass"
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid var(--glass-border)",
          }}
        >
          <span style={{ fontSize: "18px" }}>{sourceConfig?.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--foreground)" }}>
              {result.sourceName}
            </div>
          </div>
          {result.status === "loading" && (
            <Loader2 style={{ width: "16px", height: "16px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          )}
          {result.type === "web" && result.url && result.status === "success" && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                borderRadius: "6px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Open
              <ExternalLink style={{ width: "12px", height: "12px" }} />
            </a>
          )}
        </div>

        {/* Content Preview */}
        <div style={{ padding: "14px 16px", flex: 1, maxHeight: "280px", overflowY: "auto" }}>
          {result.status === "loading" && (
            <div style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>
              Fetching results...
            </div>
          )}

          {result.status === "error" && (
            <div style={{ color: "#f87171", fontSize: "13px" }}>
              Error: {result.error}
            </div>
          )}

          {result.status === "success" && result.type === "ai" && result.content && (
            <div
              style={{
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--foreground)",
                whiteSpace: "pre-wrap",
              }}
            >
              {result.content}
            </div>
          )}

          {result.status === "success" && result.type === "web" && (
            <>
              {result.instantAnswer && (
                <div
                  style={{
                    padding: "10px",
                    marginBottom: "12px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(6, 182, 212, 0.1)",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "var(--foreground)",
                  }}
                >
                  {result.instantAnswer}
                </div>
              )}
              {result.webResults && result.webResults.length > 0 ? (
                <div>
                  {result.webResults.slice(0, 4).map((item, index) => renderWebResultItem(item, index, false))}
                </div>
              ) : (
                <div style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>
                  Click "Open" to view results on {result.sourceName}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
      {/* Google Trends Row - Above Search Bar */}
      {trends.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <TrendingUp
            style={{
              width: "14px",
              height: "14px",
              color: "var(--foreground-muted)",
              flexShrink: 0,
            }}
          />
          {trends.map((trend, index) => (
            <button
              key={index}
              onClick={() => handleTrendClick(trend)}
              style={{
                background: "none",
                border: "none",
                padding: "4px 0",
                fontSize: "13px",
                color: "var(--foreground-muted)",
                cursor: "pointer",
                transition: "color 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-muted)")}
            >
              {trend.title}
              {index < trends.length - 1 && (
                <span style={{ marginLeft: "8px", opacity: 0.3 }}>•</span>
              )}
            </button>
          ))}
        </div>
      )}

      {trendsLoading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "12px",
            fontSize: "13px",
            color: "var(--foreground-muted)",
          }}
        >
          <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
          Loading trends...
        </div>
      )}

      <form onSubmit={handleSearch}>
        {/* Search Bar */}
        <div
          className="glass"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "12px",
            padding: "8px",
            paddingLeft: "16px",
          }}
        >
          <Search
            style={{
              width: "20px",
              height: "20px",
              flexShrink: 0,
              color: "var(--foreground-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search across multiple sources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "var(--foreground)",
              padding: "8px 0",
            }}
          />

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              borderRadius: "8px",
              backgroundColor: "var(--accent)",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--background)",
              border: "none",
              cursor: isSearching || !query.trim() ? "not-allowed" : "pointer",
              opacity: isSearching || !query.trim() ? 0.5 : 1,
            }}
          >
            {isSearching ? (
              <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>

        {/* Source Selector - Below Search Bar */}
        {isMobile ? (
          /* Mobile Dropdown */
          <div style={{ marginTop: "12px", position: "relative" }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "transparent",
                color: "var(--foreground)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <span>
                {selectedSources.length === 1
                  ? SEARCH_SOURCES.find((s) => s.id === selectedSources[0])?.name
                  : `${selectedSources.length} sources selected`}
              </span>
              <ChevronDown
                style={{
                  width: "16px",
                  height: "16px",
                  transition: "transform 0.2s",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "4px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "#1c1c1c",
                  zIndex: 50,
                  overflow: "hidden",
                }}
              >
                {SEARCH_SOURCES.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => {
                      toggleSource(source.id);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      border: "none",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      background: "transparent",
                      color: selectedSources.includes(source.id)
                        ? "var(--accent)"
                        : "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {source.name}
                    {selectedSources.includes(source.id) && (
                      <span style={{ fontSize: "12px" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Desktop Pill Buttons */
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {SEARCH_SOURCES.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => toggleSource(source.id)}
                className={!selectedSources.includes(source.id) ? "glass" : ""}
                style={{
                  whiteSpace: "nowrap",
                  borderRadius: "9999px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: selectedSources.includes(source.id)
                    ? "var(--accent)"
                    : "transparent",
                  color: selectedSources.includes(source.id)
                    ? "var(--background)"
                    : "var(--foreground-muted)",
                }}
              >
                {source.name}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Results display */}
      {results.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
              Results {isSingleSource ? "" : `(${results.length} sources)`}
            </h3>
            <button
              onClick={clearResults}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--glass-border)",
                background: "transparent",
                color: "var(--foreground-muted)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <X style={{ width: "14px", height: "14px" }} />
              Clear
            </button>
          </div>

          {/* Single source - full page display */}
          {isSingleSource && results.length === 1 ? (
            renderSingleSourceResults(results[0])
          ) : (
            /* Multiple sources - grid of preview cards */
            <div
              style={{
                display: "grid",
                gap: "16px",
                gridTemplateColumns: results.length === 2 ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(320px, 1fr))",
              }}
            >
              {results.map((result) => renderResultCard(result))}
            </div>
          )}
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
