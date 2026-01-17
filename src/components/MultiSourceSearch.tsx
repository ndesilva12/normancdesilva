"use client";

import { useState, useEffect, FormEvent, useCallback, useRef } from "react";
import { Search, ExternalLink, X, Loader2, TrendingUp, ChevronDown } from "lucide-react";
import {
  SearchSource,
  SEARCH_SOURCES,
  AI_SOURCES,
  getSearchUrl,
  SearchResult,
  WebSearchResultItem,
} from "@/lib/search-service";

interface TrendingSearch {
  title: string;
  searchUrl: string;
  source: "google" | "x";
}

// Get the URL to open an AI model's web interface
function getAIModelUrl(source: SearchSource): string {
  switch (source) {
    case "grok":
      return "https://x.com/i/grok";
    case "gemini":
      return "https://gemini.google.com/app";
    case "claude":
      return "https://claude.ai/new";
    case "chatgpt":
      return "https://chatgpt.com";
    default:
      return "";
  }
}

interface MultiSourceSearchProps {
  onResultsChange?: (results: SearchResult[]) => void;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationState {
  [source: string]: ConversationMessage[];
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
  const [userManuallySelected, setUserManuallySelected] = useState(false);

  // Conversation state for follow-up messages
  const [conversations, setConversations] = useState<ConversationState>({});
  const [followUpInputs, setFollowUpInputs] = useState<{ [source: string]: string }>({});
  const [sendingFollowUp, setSendingFollowUp] = useState<{ [source: string]: boolean }>({});

  // Auto-switch to Grok when query exceeds 6 words
  useEffect(() => {
    if (userManuallySelected) return; // Don't auto-switch if user manually selected

    const wordCount = query.trim().split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount >= 6 && selectedSources[0] === "duck") {
      setSelectedSources(["grok"]);
    } else if (wordCount < 6 && selectedSources[0] === "grok" && !userManuallySelected) {
      setSelectedSources(["duck"]);
    }
  }, [query, selectedSources, userManuallySelected]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch both Google Trends and X trending, then mix them
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      // Fetch both sources in parallel
      const [googleResponse, xResponse] = await Promise.all([
        fetch("/api/google-trends"),
        fetch("/api/x-trending"),
      ]);

      const googleData = await googleResponse.json();
      const xData = await xResponse.json();

      const googleTrends: TrendingSearch[] = (googleData.trends || []).slice(0, 6).map((t: { title: string; searchUrl: string }) => ({
        title: t.title,
        searchUrl: t.searchUrl,
        source: "google" as const,
      }));

      const xTrends: TrendingSearch[] = (xData.topics || []).slice(0, 6).map((t: { topic: string; searchUrl: string }) => ({
        title: t.topic,
        searchUrl: t.searchUrl,
        source: "x" as const,
      }));

      // Interleave the trends from both sources
      const mixed: TrendingSearch[] = [];
      const maxLength = Math.max(googleTrends.length, xTrends.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < googleTrends.length) mixed.push(googleTrends[i]);
        if (i < xTrends.length) mixed.push(xTrends[i]);
      }

      // Take top 10 mixed trends
      setTrends(mixed.slice(0, 10));
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

  // Single-select: clicking a source selects only that source (deselects all others)
  const selectSource = (source: SearchSource) => {
    setSelectedSources([source]);
    setUserManuallySelected(true); // User manually selected, disable auto-switch
  };

  // Check if all AI sources are selected
  const allAISelected = AI_SOURCES.every((s) => selectedSources.includes(s)) && selectedSources.length === AI_SOURCES.length;

  // Check if multiple non-AI sources selected (multi-mode)
  const isMultiMode = selectedSources.length > 1 && !allAISelected;

  // Toggle all AI sources (replaces current selection with all AI)
  const toggleAllAI = () => {
    setUserManuallySelected(true);
    if (allAISelected) {
      // If AI is already selected, switch to first web source
      setSelectedSources(["duck"]);
    } else {
      // Select all AI sources only
      setSelectedSources([...AI_SOURCES]);
    }
  };

  // Enable multi-select mode with web sources
  const WEB_SOURCES: SearchSource[] = ["duck", "google", "wikipedia", "grokipedia", "x", "youtube", "rumble", "trends", "amazon"];
  const allWebSelected = WEB_SOURCES.every((s) => selectedSources.includes(s)) && selectedSources.length === WEB_SOURCES.length;

  const toggleAllWeb = () => {
    setUserManuallySelected(true);
    if (allWebSelected) {
      setSelectedSources(["duck"]);
    } else {
      setSelectedSources([...WEB_SOURCES]);
    }
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

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || selectedSources.length === 0) return;

    // Single source handling - open directly for web sources
    if (selectedSources.length === 1) {
      const sourceId = selectedSources[0];
      const sourceConfig = SEARCH_SOURCES.find((s) => s.id === sourceId);

      // For web sources (non-AI), open the URL directly
      if (sourceConfig?.type === "web") {
        const searchUrl = getSearchUrl(sourceId, query.trim());
        window.open(searchUrl, "_blank");
        return;
      }
    }

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
    setConversations({});
    setFollowUpInputs({});
    setUserManuallySelected(false); // Reset manual selection to enable auto-switch again
    setSelectedSources(["duck"]); // Reset to default source
    if (onResultsChange) onResultsChange([]);
  };

  // Handle follow-up message for a specific AI source
  const handleFollowUp = async (source: SearchSource) => {
    const followUpQuery = followUpInputs[source]?.trim();
    if (!followUpQuery) return;

    setSendingFollowUp(prev => ({ ...prev, [source]: true }));

    // Get the current result for this source
    const currentResult = results.find(r => r.source === source);
    if (!currentResult || currentResult.type !== "ai") return;

    // Build conversation history from previous messages
    const existingConversation = conversations[source] || [];

    // If this is the first follow-up, add the original query and response to history
    let conversationHistory = [...existingConversation];
    if (conversationHistory.length === 0 && currentResult.content) {
      conversationHistory = [
        { role: "user" as const, content: query },
        { role: "assistant" as const, content: currentResult.content },
      ];
    }

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: followUpQuery,
          source,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Follow-up failed");
      }

      // Update conversation history
      const newHistory: ConversationMessage[] = [
        ...conversationHistory,
        { role: "user", content: followUpQuery },
        { role: "assistant", content: data.content },
      ];
      setConversations(prev => ({ ...prev, [source]: newHistory }));

      // Update the result with the new content (append to existing)
      setResults(prev =>
        prev.map(r => {
          if (r.source === source) {
            const existingContent = r.content || "";
            const separator = "\n\n---\n\n**You:** " + followUpQuery + "\n\n**" + r.sourceName + ":** ";
            return {
              ...r,
              content: existingContent + separator + data.content,
            };
          }
          return r;
        })
      );

      // Clear the follow-up input
      setFollowUpInputs(prev => ({ ...prev, [source]: "" }));
    } catch (error) {
      console.error("Follow-up error:", error);
    } finally {
      setSendingFollowUp(prev => ({ ...prev, [source]: false }));
    }
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
          {result.type === "ai" && getAIModelUrl(result.source) && (
            <a
              href={getAIModelUrl(result.source)}
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
              Open {result.sourceName}
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
            <div style={{ textAlign: "center", padding: "40px" }}>
              {result.error?.includes("not configured") ? (
                <>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔑</div>
                  <div style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "8px" }}>
                    {result.error}
                  </div>
                  <div style={{ color: "var(--foreground-muted)", fontSize: "13px", opacity: 0.7 }}>
                    This AI source requires an API key to be configured.
                  </div>
                </>
              ) : (
                <div style={{ color: "#f87171", fontSize: "14px" }}>
                  Error: {result.error}
                </div>
              )}
            </div>
          )}

          {result.status === "success" && result.type === "ai" && result.content && (
            <>
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

              {/* Follow-up input for AI responses */}
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
                    value={followUpInputs[result.source] || ""}
                    onChange={(e) =>
                      setFollowUpInputs(prev => ({ ...prev, [result.source]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFollowUp(result.source);
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
                    onClick={() => handleFollowUp(result.source)}
                    disabled={sendingFollowUp[result.source] || !followUpInputs[result.source]?.trim()}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "var(--accent)",
                      color: "var(--background)",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: sendingFollowUp[result.source] || !followUpInputs[result.source]?.trim() ? "not-allowed" : "pointer",
                      opacity: sendingFollowUp[result.source] || !followUpInputs[result.source]?.trim() ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {sendingFollowUp[result.source] ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </>
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
          {result.type === "ai" && result.status === "success" && getAIModelUrl(result.source) && (
            <a
              href={getAIModelUrl(result.source)}
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
            <div>
              {result.error?.includes("not configured") ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔑</div>
                  <div style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>
                    API key not configured
                  </div>
                </div>
              ) : (
                <div style={{ color: "#f87171", fontSize: "13px" }}>
                  Error: {result.error}
                </div>
              )}
            </div>
          )}

          {result.status === "success" && result.type === "ai" && result.content && (
            <>
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

              {/* Follow-up input for AI responses in cards */}
              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--glass-border)",
                }}
              >
                <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                  <input
                    type="text"
                    placeholder="Follow-up..."
                    value={followUpInputs[result.source] || ""}
                    onChange={(e) =>
                      setFollowUpInputs(prev => ({ ...prev, [result.source]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFollowUp(result.source);
                      }
                    }}
                    style={{
                      flex: 1,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "12px",
                      color: "var(--foreground)",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => handleFollowUp(result.source)}
                    disabled={sendingFollowUp[result.source] || !followUpInputs[result.source]?.trim()}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "var(--accent)",
                      color: "var(--background)",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: sendingFollowUp[result.source] || !followUpInputs[result.source]?.trim() ? "not-allowed" : "pointer",
                      opacity: sendingFollowUp[result.source] || !followUpInputs[result.source]?.trim() ? 0.5 : 1,
                    }}
                  >
                    {sendingFollowUp[result.source] ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </>
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
            placeholder="Search across multiple sources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (query.trim()) {
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

          {/* Clear button */}
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
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {/* All AI Button */}
                <button
                  type="button"
                  onClick={toggleAllAI}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    border: "none",
                    borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
                    background: allAISelected ? "rgba(6, 182, 212, 0.15)" : "transparent",
                    color: allAISelected ? "var(--accent)" : "var(--foreground)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  All AI Models
                  {allAISelected && <span style={{ fontSize: "12px" }}>✓</span>}
                </button>
                {SEARCH_SOURCES.map((source) => (
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
            {/* All AI Button - First */}
            <button
              type="button"
              onClick={toggleAllAI}
              className={!allAISelected ? "glass" : ""}
              style={{
                whiteSpace: "nowrap",
                borderRadius: "9999px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: allAISelected
                  ? "var(--accent)"
                  : "transparent",
                color: allAISelected
                  ? "var(--background)"
                  : "var(--foreground-muted)",
              }}
            >
              AI
            </button>
            {/* All Web Button */}
            <button
              type="button"
              onClick={toggleAllWeb}
              className={!allWebSelected ? "glass" : ""}
              style={{
                whiteSpace: "nowrap",
                borderRadius: "9999px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: allWebSelected
                  ? "var(--accent)"
                  : "transparent",
                color: allWebSelected
                  ? "var(--background)"
                  : "var(--foreground-muted)",
              }}
            >
              Web
            </button>
            {SEARCH_SOURCES.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => selectSource(source.id)}
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
                  backgroundColor: selectedSources.includes(source.id) && selectedSources.length === 1
                    ? "var(--accent)"
                    : "transparent",
                  color: selectedSources.includes(source.id) && selectedSources.length === 1
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
