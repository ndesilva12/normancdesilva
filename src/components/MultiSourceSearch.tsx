"use client";

import { useState, useEffect, FormEvent, useCallback, useRef, useMemo } from "react";
import { Search, ExternalLink, X, Loader2, TrendingUp, ChevronDown } from "lucide-react";
import {
  UnifiedSourceId,
  UNIFIED_SOURCES,
  AI_SOURCE_IDS,
  WEB_SOURCE_IDS,
  DEFAULT_SOURCE,
  getSearchUrl,
  getSourceConfig,
  getAIModelUrl,
  sourceNeedsInputs,
} from "@/lib/unified-sources";
import { useSettings } from "@/contexts/SettingsContext";
import { useRecentSearches } from "@/contexts/RecentSearchesContext";

interface TrendingSearch {
  title: string;
  searchUrl: string;
  source: "google" | "x";
}

interface ToolResult {
  source: UnifiedSourceId;
  sourceName: string;
  status: "loading" | "success" | "error";
  content?: string;
  error?: string;
  data?: Record<string, unknown>;
}

interface MultiSourceSearchProps {
  onResultsChange?: (hasResults: boolean) => void;
  onToolResult?: (result: ToolResult | null) => void;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export function MultiSourceSearch({ onResultsChange, onToolResult }: MultiSourceSearchProps) {
  const { settings, updateSettings } = useSettings();
  const { addRecentSearch } = useRecentSearches();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [trends, setTrends] = useState<TrendingSearch[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Tool-specific input values
  const [toolInputs, setToolInputs] = useState<Record<string, string>>({});

  // Get default source from settings (with fallback)
  const defaultSource = (settings.searchSources?.defaultSourceShort as UnifiedSourceId) || DEFAULT_SOURCE;

  // Selected source (single select only now)
  const [selectedSource, setSelectedSource] = useState<UnifiedSourceId>(defaultSource);

  // AI follow-up conversation
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  // Update parent when tool result changes
  useEffect(() => {
    if (onToolResult) {
      onToolResult(toolResult);
    }
    if (onResultsChange) {
      onResultsChange(toolResult !== null);
    }
  }, [toolResult, onToolResult, onResultsChange]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch trending topics
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const [googleResponse, xResponse] = await Promise.all([
        fetch("/api/google-trends"),
        fetch("/api/x-trending"),
      ]);

      const googleData = await googleResponse.json();
      const xData = await xResponse.json();

      const googleTrends: TrendingSearch[] = (googleData.trends || []).slice(0, 12).map((t: { title: string; searchUrl: string }) => ({
        title: t.title,
        searchUrl: t.searchUrl,
        source: "google" as const,
      }));

      const xTrends: TrendingSearch[] = (xData.topics || []).slice(0, 12).map((t: { topic: string; searchUrl: string }) => ({
        title: t.topic,
        searchUrl: t.searchUrl,
        source: "x" as const,
      }));

      // Interleave trends
      const mixed: TrendingSearch[] = [];
      const maxLength = Math.max(googleTrends.length, xTrends.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < googleTrends.length) mixed.push(googleTrends[i]);
        if (i < xTrends.length) mixed.push(xTrends[i]);
      }

      setTrends(mixed.slice(0, 24));
    } catch (error) {
      console.error("Error fetching trends:", error);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current source config
  const currentSourceConfig = useMemo(() => getSourceConfig(selectedSource), [selectedSource]);

  // Check if current source needs additional inputs
  const needsAdditionalInputs = useMemo(() => sourceNeedsInputs(selectedSource), [selectedSource]);

  // Check if all required inputs are filled
  const hasRequiredInputs = useMemo(() => {
    if (!currentSourceConfig?.additionalInputs) return true;
    return currentSourceConfig.additionalInputs
      .filter(input => input.required)
      .every(input => toolInputs[input.id]?.trim());
  }, [currentSourceConfig, toolInputs]);

  // Select a source
  const selectSource = (source: UnifiedSourceId) => {
    setSelectedSource(source);
    setToolInputs({}); // Clear tool inputs when changing source
    setDropdownOpen(false);
  };

  // Toggle all AI sources
  const allAISelected = AI_SOURCE_IDS.includes(selectedSource);
  const toggleAI = () => {
    selectSource("grok"); // Select first AI source
  };

  // Toggle all Web sources
  const allWebSelected = WEB_SOURCE_IDS.includes(selectedSource);
  const toggleWeb = () => {
    selectSource("google"); // Select first web source
  };

  // Auto-expand textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [query]);

  const handleTrendClick = (trend: TrendingSearch) => {
    setQuery(trend.title);
  };

  // Handle tool input change
  const handleToolInputChange = (inputId: string, value: string) => {
    setToolInputs(prev => ({ ...prev, [inputId]: value }));
  };

  // Handle search/execute
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    const sourceConfig = currentSourceConfig;
    if (!sourceConfig) return;

    // For tools with additional inputs, check those are filled
    if (needsAdditionalInputs && !hasRequiredInputs) return;

    // For tools that use search input or web/AI sources, check query
    if ((sourceConfig.type !== "tool" || sourceConfig.usesSearchInput) && !query.trim()) return;

    // Add to recent searches
    if (query.trim()) {
      addRecentSearch("search", query.trim());
    }

    // Handle web sources - open in new tab
    if (sourceConfig.type === "web") {
      const searchUrl = getSearchUrl(selectedSource, query.trim());
      window.open(searchUrl, "_blank");
      return;
    }

    // Handle AI and tool sources - fetch and display results
    setIsSearching(true);
    setToolResult({
      source: selectedSource,
      sourceName: sourceConfig.name,
      status: "loading",
    });

    try {
      let response: Response;
      let data: Record<string, unknown>;

      if (sourceConfig.type === "ai") {
        // AI source
        response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&source=${selectedSource}`
        );
        data = await response.json();

        if (!response.ok) {
          throw new Error((data as { error?: string }).error || "Search failed");
        }

        setToolResult({
          source: selectedSource,
          sourceName: sourceConfig.name,
          status: "success",
          content: (data as { content?: string }).content,
        });

        // Initialize conversation for follow-ups
        setConversation([
          { role: "user", content: query },
          { role: "assistant", content: (data as { content?: string }).content || "" },
        ]);
      } else {
        // Tool source
        const endpoint = sourceConfig.apiEndpoint || "";
        const body: Record<string, string> = {};

        // Add search query if tool uses it
        if (sourceConfig.usesSearchInput && query.trim()) {
          body.query = query.trim();
        }

        // Add additional inputs
        if (sourceConfig.additionalInputs) {
          sourceConfig.additionalInputs.forEach(input => {
            if (toolInputs[input.id]) {
              body[input.id] = toolInputs[input.id];
            }
          });
        }

        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        data = await response.json();

        if (!response.ok) {
          throw new Error((data as { error?: string }).error || "Request failed");
        }

        setToolResult({
          source: selectedSource,
          sourceName: sourceConfig.name,
          status: "success",
          content: (data as { content?: string; report?: string }).content || (data as { report?: string }).report,
          data,
        });
      }
    } catch (error) {
      setToolResult({
        source: selectedSource,
        sourceName: currentSourceConfig?.name || selectedSource,
        status: "error",
        error: error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Clear results
  const clearResults = () => {
    setToolResult(null);
    setConversation([]);
    setFollowUpInput("");
    setToolInputs({});
  };

  // Handle AI follow-up
  const handleFollowUp = async () => {
    if (!followUpInput.trim() || !toolResult || toolResult.status !== "success") return;

    setSendingFollowUp(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: followUpInput,
          source: selectedSource,
          conversationHistory: conversation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Follow-up failed");
      }

      // Update conversation
      const newConversation: ConversationMessage[] = [
        ...conversation,
        { role: "user", content: followUpInput },
        { role: "assistant", content: data.content },
      ];
      setConversation(newConversation);

      // Update result with appended content
      const existingContent = toolResult.content || "";
      const separator = "\n\n---\n\n**You:** " + followUpInput + "\n\n**" + toolResult.sourceName + ":** ";
      setToolResult({
        ...toolResult,
        content: existingContent + separator + data.content,
      });

      setFollowUpInput("");
    } catch (error) {
      console.error("Follow-up error:", error);
    } finally {
      setSendingFollowUp(false);
    }
  };

  // Set default source preference
  const setAsDefaultSource = () => {
    updateSettings({
      searchSources: {
        ...settings.searchSources,
        defaultSourceShort: selectedSource,
      },
    });
  };

  // Render result display
  const renderResult = () => {
    if (!toolResult) return null;

    const sourceConfig = getSourceConfig(toolResult.source);
    const isAI = sourceConfig?.type === "ai";

    return (
      <div
        className="glass"
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          marginTop: "24px",
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
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "18px", color: "var(--foreground)" }}>
              {toolResult.sourceName}
            </div>
            <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
              {isAI ? "AI Response" : "Tool Results"}
            </div>
          </div>
          {toolResult.status === "loading" && (
            <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          )}
          {isAI && toolResult.status === "success" && getAIModelUrl(toolResult.source) && (
            <a
              href={getAIModelUrl(toolResult.source)}
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
              Open {toolResult.sourceName}
              <ExternalLink style={{ width: "14px", height: "14px" }} />
            </a>
          )}
          <button
            onClick={clearResults}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
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

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {toolResult.status === "loading" && (
            <div style={{ color: "var(--foreground-muted)", fontSize: "14px", textAlign: "center", padding: "40px" }}>
              Processing request...
            </div>
          )}

          {toolResult.status === "error" && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              {toolResult.error?.includes("not configured") ? (
                <>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔑</div>
                  <div style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "8px" }}>
                    {toolResult.error}
                  </div>
                  <div style={{ color: "var(--foreground-muted)", fontSize: "13px", opacity: 0.7 }}>
                    This source requires an API key to be configured.
                  </div>
                </>
              ) : (
                <div style={{ color: "#f87171", fontSize: "14px" }}>
                  Error: {toolResult.error}
                </div>
              )}
            </div>
          )}

          {toolResult.status === "success" && toolResult.content && (
            <>
              <div
                style={{
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "var(--foreground)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {toolResult.content}
              </div>

              {/* Follow-up input for AI */}
              {isAI && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--glass-border)",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <textarea
                      placeholder="Ask a follow-up question..."
                      value={followUpInput}
                      onChange={(e) => setFollowUpInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleFollowUp();
                        }
                      }}
                      rows={1}
                      style={{
                        flex: 1,
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        fontSize: "14px",
                        color: "var(--foreground)",
                        resize: "none",
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={handleFollowUp}
                      disabled={sendingFollowUp || !followUpInput.trim()}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "var(--accent)",
                        color: "var(--background)",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: sendingFollowUp || !followUpInput.trim() ? "not-allowed" : "pointer",
                        opacity: sendingFollowUp || !followUpInput.trim() ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {sendingFollowUp ? (
                        <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                      ) : (
                        "Send"
                      )}
                    </button>
                  </div>
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
      {/* Trending Topics */}
      {trends.length > 0 && !toolResult && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: "16px",
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
              marginTop: "4px",
            }}
          />
          {(() => {
            const displayTrends = isMobile ? trends.slice(0, 10) : trends.slice(0, 14);
            const halfLength = Math.ceil(displayTrends.length / 2);
            const row1 = displayTrends.slice(0, halfLength);
            const row2 = displayTrends.slice(halfLength);

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", flex: 1 }}>
                {[row1, row2].map((row, rowIndex) => (
                  <div key={rowIndex} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px" }}>
                    {row.map((trend, index) => (
                      <button
                        key={index}
                        onClick={() => handleTrendClick(trend)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "2px 0",
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
                        {index < row.length - 1 && (
                          <span style={{ marginLeft: "8px", opacity: 0.3 }}>•</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {trendsLoading && !toolResult && (
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
            alignItems: "flex-start",
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
              marginTop: "10px",
            }}
          />
          <textarea
            ref={textareaRef}
            placeholder={needsAdditionalInputs ? "Additional context (optional)..." : "Search..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (query.trim() || (needsAdditionalInputs && hasRequiredInputs)) {
                  handleSearch(e as unknown as FormEvent);
                }
              }
            }}
            rows={1}
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "var(--foreground)",
              padding: "8px 0",
              resize: "none",
              overflow: "hidden",
              lineHeight: 1.5,
              fontFamily: "inherit",
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--foreground-muted)",
                marginTop: "6px",
                flexShrink: 0,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--foreground-muted)";
              }}
            >
              <X style={{ width: "16px", height: "16px" }} />
            </button>
          )}

          <button
            type="submit"
            disabled={isSearching || (!query.trim() && !hasRequiredInputs)}
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
              cursor: isSearching || (!query.trim() && !hasRequiredInputs) ? "not-allowed" : "pointer",
              opacity: isSearching || (!query.trim() && !hasRequiredInputs) ? 0.5 : 1,
              marginTop: "2px",
            }}
          >
            {isSearching ? (
              <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
            ) : (
              <span>Search</span>
            )}
          </button>
        </div>

        {/* Tool-specific inputs */}
        {needsAdditionalInputs && currentSourceConfig?.additionalInputs && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {currentSourceConfig.additionalInputs.map((input) => (
              <div
                key={input.id}
                style={{
                  flex: input.required ? "1 1 200px" : "0 1 150px",
                  minWidth: "120px",
                }}
              >
                <input
                  type={input.type || "text"}
                  placeholder={input.placeholder}
                  value={toolInputs[input.id] || ""}
                  onChange={(e) => handleToolInputChange(input.id, e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Source Selector */}
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
              <span>{currentSourceConfig?.name || selectedSource}</span>
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
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "var(--dropdown-bg)",
                  zIndex: 50,
                  overflow: "hidden",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {UNIFIED_SOURCES.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => selectSource(source.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      border: "none",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      background: "transparent",
                      color: selectedSource === source.id
                        ? "var(--accent)"
                        : "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {source.name}
                    {selectedSource === source.id && (
                      <span style={{ fontSize: "12px" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Desktop - Compact text buttons */
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {/* AI group button */}
            <button
              type="button"
              onClick={toggleAI}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s",
                backgroundColor: allAISelected ? "var(--accent)" : "transparent",
                color: allAISelected ? "var(--background)" : "var(--foreground-muted)",
              }}
            >
              Ai
            </button>

            {/* Web group button */}
            <button
              type="button"
              onClick={toggleWeb}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s",
                backgroundColor: allWebSelected ? "var(--accent)" : "transparent",
                color: allWebSelected ? "var(--background)" : "var(--foreground-muted)",
              }}
            >
              Web
            </button>

            {/* Separator */}
            <span style={{ color: "var(--foreground-muted)", opacity: 0.3, margin: "0 4px" }}>|</span>

            {/* Individual sources */}
            {UNIFIED_SOURCES.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => selectSource(source.id)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 500,
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  backgroundColor: selectedSource === source.id ? "var(--accent)" : "transparent",
                  color: selectedSource === source.id ? "var(--background)" : "var(--foreground-muted)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (selectedSource !== source.id) {
                    e.currentTarget.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSource !== source.id) {
                    e.currentTarget.style.color = "var(--foreground-muted)";
                  }
                }}
              >
                {source.name}
              </button>
            ))}
          </div>
        )}

        {/* Set as default link */}
        {selectedSource !== defaultSource && (
          <div style={{ marginTop: "8px", textAlign: "center" }}>
            <button
              type="button"
              onClick={setAsDefaultSource}
              style={{
                background: "none",
                border: "none",
                color: "var(--foreground-muted)",
                fontSize: "11px",
                cursor: "pointer",
                textDecoration: "underline",
                opacity: 0.7,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            >
              Set as default source
            </button>
          </div>
        )}
      </form>

      {/* Results display */}
      {renderResult()}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
