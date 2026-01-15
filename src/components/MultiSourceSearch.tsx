"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { Search, ExternalLink, X, Loader2, TrendingUp } from "lucide-react";
import {
  SearchSource,
  SEARCH_SOURCES,
  getSearchUrl,
  SearchResult,
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
        // Don't allow deselecting the last source
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
    const newResults: SearchResult[] = [];

    // Process each selected source
    for (const sourceId of selectedSources) {
      const sourceConfig = SEARCH_SOURCES.find((s) => s.id === sourceId);
      if (!sourceConfig) continue;

      if (sourceConfig.type === "web") {
        // Web sources just get a URL
        const url = getSearchUrl(sourceId, query.trim());
        newResults.push({
          source: sourceId,
          sourceName: sourceConfig.name,
          type: "web",
          status: "success",
          url,
        });
      } else {
        // AI sources need an API call
        newResults.push({
          source: sourceId,
          sourceName: sourceConfig.name,
          type: "ai",
          status: "loading",
        });
      }
    }

    setResults([...newResults]);
    if (onResultsChange) onResultsChange([...newResults]);

    // Now fetch AI results
    const aiSources = selectedSources.filter((s) => {
      const config = SEARCH_SOURCES.find((c) => c.id === s);
      return config?.type === "ai";
    });

    // Fetch AI results in parallel
    const aiPromises = aiSources.map(async (sourceId) => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&source=${sourceId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Search failed");
        }

        return { source: sourceId, content: data.content, status: "success" as const };
      } catch (error) {
        return {
          source: sourceId,
          error: error instanceof Error ? error.message : "Search failed",
          status: "error" as const,
        };
      }
    });

    const aiResults = await Promise.all(aiPromises);

    // Update results with AI responses
    const finalResults = newResults.map((result) => {
      const aiResult = aiResults.find((r) => r.source === result.source);
      if (aiResult) {
        return {
          ...result,
          status: aiResult.status,
          content: aiResult.status === "success" ? aiResult.content : undefined,
          error: aiResult.status === "error" ? aiResult.error : undefined,
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
              <>
                <span>Search</span>
                <ExternalLink style={{ width: "14px", height: "14px" }} />
              </>
            )}
          </button>
        </div>

        {/* Source Selector Buttons - Below Search Bar */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
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
                padding: "8px 18px",
                fontSize: "13px",
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
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "14px" }}>{source.icon}</span>
              {source.name}
            </button>
          ))}
        </div>
      </form>

      {/* Results display */}
      {results.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
              Results ({results.length})
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

          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
            {results.map((result) => {
              const sourceConfig = SEARCH_SOURCES.find((s) => s.id === result.source);
              return (
                <div
                  key={result.source}
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      borderBottom: result.type === "ai" ? "1px solid var(--glass-border)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{sourceConfig?.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: "var(--foreground)" }}>{result.sourceName}</div>
                      <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                        {result.type === "web" ? "Web Search" : "AI Response"}
                      </div>
                    </div>
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
                          backgroundColor: "var(--accent)",
                          color: "var(--background)",
                          fontSize: "13px",
                          fontWeight: 500,
                          textDecoration: "none",
                        }}
                      >
                        Open
                        <ExternalLink style={{ width: "14px", height: "14px" }} />
                      </a>
                    )}
                    {result.status === "loading" && (
                      <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                    )}
                  </div>

                  {result.type === "ai" && (
                    <div style={{ padding: "16px", maxHeight: "300px", overflowY: "auto" }}>
                      {result.status === "loading" && (
                        <div style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                          Generating response...
                        </div>
                      )}
                      {result.status === "error" && (
                        <div style={{ color: "#f87171", fontSize: "14px" }}>
                          Error: {result.error}
                        </div>
                      )}
                      {result.status === "success" && result.content && (
                        <div
                          style={{
                            fontSize: "14px",
                            lineHeight: 1.7,
                            color: "var(--foreground)",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {result.content}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
