"use client";

import { useState, useEffect, FormEvent, useCallback, useRef, useMemo } from "react";
import {
  Search, ExternalLink, X, Loader2, ChevronDown, Upload,
  BookOpen, FileSearch, Link2, User, Target, Sparkles, LayoutGrid, Grid3X3, Eye, EyeOff
} from "lucide-react";
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
  sourceIsTool,
  sourceIsMeta,
  getIncludedSources,
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
  onToolActive?: (isActive: boolean) => void;
  widgetsCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export function MultiSourceSearch({ onResultsChange, onToolResult, onToolActive, widgetsCollapsed, onToggleCollapse }: MultiSourceSearchProps) {
  const { settings, updateSettings } = useSettings();
  const { getRecentSearches, addRecentSearch } = useRecentSearches();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [trends, setTrends] = useState<TrendingSearch[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sources hidden state (persisted to localStorage)
  const [sourcesHidden, setSourcesHidden] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sources-hidden");
      return saved === "true";
    }
    return false;
  });

  // Persist sources hidden state
  useEffect(() => {
    localStorage.setItem("sources-hidden", String(sourcesHidden));
  }, [sourcesHidden]);

  // Tool-specific input values
  const [toolInputs, setToolInputs] = useState<Record<string, string>>({});

  // Tool option values
  const [toolOptions, setToolOptions] = useState<Record<string, string>>({});

  // Image upload for image-lookup
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get default source from settings (with fallback)
  const defaultSource = (settings.searchSources?.defaultSourceShort as UnifiedSourceId) || DEFAULT_SOURCE;

  // Selected source (single select only now)
  const [selectedSource, setSelectedSource] = useState<UnifiedSourceId>(defaultSource);

  // AI follow-up conversation
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  // Check if current source is a tool
  const isToolSource = useMemo(() => sourceIsTool(selectedSource), [selectedSource]);

  // Update parent when tool result changes
  useEffect(() => {
    if (onToolResult) {
      onToolResult(toolResult);
    }
    if (onResultsChange) {
      onResultsChange(toolResult !== null);
    }
  }, [toolResult, onToolResult, onResultsChange]);

  // Notify parent when tool is active
  useEffect(() => {
    if (onToolActive) {
      onToolActive(isToolSource);
    }
  }, [isToolSource, onToolActive]);

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

  // Initialize tool options when source changes
  useEffect(() => {
    if (currentSourceConfig?.toolOptions) {
      const defaults: Record<string, string> = {};
      currentSourceConfig.toolOptions.forEach(opt => {
        defaults[opt.id] = opt.defaultValue;
      });
      setToolOptions(defaults);
    }
  }, [currentSourceConfig]);

  // Select a source
  const selectSource = (source: UnifiedSourceId) => {
    setSelectedSource(source);
    setToolInputs({}); // Clear tool inputs when changing source
    setUploadedImage(null); // Clear uploaded image
    setToolResult(null); // Clear results
    setDropdownOpen(false);
    setSourcesHidden(true); // Auto-hide sources when selecting a new source
  };

  // Get sources that should be highlighted (for meta sources)
  const highlightedSources = useMemo(() => {
    if (sourceIsMeta(selectedSource)) {
      const included = getIncludedSources(selectedSource);
      return included.map(s => s.id);
    }
    return [];
  }, [selectedSource]);

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

  // Handle tool option change
  const handleToolOptionChange = (optionId: string, value: string) => {
    setToolOptions(prev => ({ ...prev, [optionId]: value }));
  };

  // Handle image upload
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle search/execute
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    const sourceConfig = currentSourceConfig;
    if (!sourceConfig) return;

    // For image-lookup, require an image
    if (selectedSource === "image-lookup" && !uploadedImage && !toolInputs.imageUrl) return;

    // For tools with additional inputs, check those are filled
    if (needsAdditionalInputs && !hasRequiredInputs) return;

    // For tools that use search input or web/AI sources, check query
    if ((sourceConfig.type !== "tool" || sourceConfig.usesSearchInput) && !query.trim()) {
      // Allow empty query for tools with required inputs that are filled
      if (!hasRequiredInputs) return;
    }

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

    // Handle meta sources (AI and Web multi-source)
    if (sourceConfig.type === "meta") {
      // For now, treat meta sources similar to their first included source
      // In a full implementation, this would fetch from all included sources
      if (selectedSource === "ai") {
        // Query all AI sources
        setIsSearching(true);
        setToolResult({
          source: selectedSource,
          sourceName: "AI (All Models)",
          status: "loading",
        });

        try {
          const responses = await Promise.all(
            AI_SOURCE_IDS.map(async (aiSource) => {
              try {
                const resp = await fetch(
                  `/api/search?q=${encodeURIComponent(query.trim())}&source=${aiSource}`
                );
                const data = await resp.json();
                return { source: aiSource, content: data.content, error: data.error };
              } catch (err) {
                return { source: aiSource, error: String(err) };
              }
            })
          );

          const successfulResponses = responses.filter(r => r.content);
          const formattedContent = successfulResponses
            .map(r => `**${r.source.charAt(0).toUpperCase() + r.source.slice(1)}:**\n${r.content}`)
            .join("\n\n---\n\n");

          setToolResult({
            source: selectedSource,
            sourceName: "AI (All Models)",
            status: "success",
            content: formattedContent || "No responses received from AI models.",
          });
        } catch (error) {
          setToolResult({
            source: selectedSource,
            sourceName: "AI (All Models)",
            status: "error",
            error: error instanceof Error ? error.message : "Request failed",
          });
        } finally {
          setIsSearching(false);
        }
        return;
      }

      if (selectedSource === "web") {
        // Open all web sources in tabs
        const webSources = getIncludedSources(selectedSource);
        webSources.forEach(source => {
          if (source.searchUrlTemplate) {
            const searchUrl = getSearchUrl(source.id, query.trim());
            window.open(searchUrl, "_blank");
          }
        });
        return;
      }
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
        const body: Record<string, unknown> = {};

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

        // Add tool options
        Object.entries(toolOptions).forEach(([key, value]) => {
          body[key] = value;
        });

        // Special handling for image-lookup
        if (selectedSource === "image-lookup" && uploadedImage) {
          body.imageData = uploadedImage;
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
    setUploadedImage(null);
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

  // Get recent searches for current tool
  const toolRecentSearches = useMemo((): string[] => {
    if (!isToolSource) return [];
    // Map tool source ID to the ToolId used by the context
    const toolIdMap: Record<string, string> = {
      "deep-search": "deep-search",
      "dark-search": "dark-search",
      "corporate-info": "company-politics",
      "business-info": "business-info",
      "contacts": "contacts",
      "contact-finder": "contact-finder",
      "image-lookup": "image-lookup",
      "visuals": "visuals",
      "rosters": "visual-rosters",
      "spotify": "spotify",
    };
    const toolId = toolIdMap[selectedSource] || "search";
    const recentItems = getRecentSearches(toolId as import("@/contexts/SettingsContext").ToolId);
    return recentItems.map(item => item.query);
  }, [isToolSource, selectedSource, getRecentSearches]);

  // Render tool options
  const renderToolOptions = () => {
    if (!currentSourceConfig?.toolOptions) return null;

    return (
      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {currentSourceConfig.toolOptions.map((option) => {
          // Skip generateMode if action is "search"
          if (option.id === "generateMode" && toolOptions.action === "search") {
            return null;
          }

          if (option.type === "toggle" || option.type === "radio") {
            return (
              <div key={option.id}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--foreground-muted)",
                    marginBottom: "8px",
                  }}
                >
                  {option.label}
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {option.options?.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToolOptionChange(option.id, opt.value)}
                      style={{
                        flex: option.type === "toggle" ? 1 : "0 0 auto",
                        display: "flex",
                        flexDirection: option.type === "radio" && opt.description ? "column" : "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: option.type === "radio" && opt.description ? "12px 16px" : "10px 16px",
                        borderRadius: "8px",
                        border: toolOptions[option.id] === opt.value
                          ? "2px solid var(--accent)"
                          : "1px solid var(--glass-border)",
                        backgroundColor: toolOptions[option.id] === opt.value
                          ? "rgba(var(--accent-rgb), 0.1)"
                          : "rgba(255, 255, 255, 0.03)",
                        color: toolOptions[option.id] === opt.value
                          ? "var(--accent)"
                          : "var(--foreground-muted)",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {option.id === "searchType" && opt.value === "individual" && (
                        <User style={{ width: "16px", height: "16px" }} />
                      )}
                      {option.id === "searchType" && opt.value === "target" && (
                        <Target style={{ width: "16px", height: "16px" }} />
                      )}
                      {option.id === "mode" && opt.value === "long" && (
                        <BookOpen style={{ width: "16px", height: "16px" }} />
                      )}
                      {option.id === "mode" && opt.value === "short" && (
                        <FileSearch style={{ width: "16px", height: "16px" }} />
                      )}
                      {option.id === "mode" && opt.value === "links" && (
                        <Link2 style={{ width: "16px", height: "16px" }} />
                      )}
                      {option.id === "aiSource" && (
                        <Sparkles style={{ width: "14px", height: "14px" }} />
                      )}
                      <span>{opt.label}</span>
                      {opt.description && (
                        <span style={{ fontSize: "11px", opacity: 0.7 }}>{opt.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          if (option.type === "select") {
            return (
              <div key={option.id} style={{ position: "relative" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--foreground-muted)",
                    marginBottom: "8px",
                  }}
                >
                  {option.label}
                </label>
                <select
                  value={toolOptions[option.id] || option.defaultValue}
                  onChange={(e) => handleToolOptionChange(option.id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 36px 12px 14px",
                    fontSize: "14px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {option.options?.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{ backgroundColor: "var(--dropdown-bg)" }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  style={{
                    position: "absolute",
                    right: "12px",
                    bottom: "14px",
                    width: "16px",
                    height: "16px",
                    color: "var(--foreground-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  // Render image upload area for image-lookup
  const renderImageUpload = () => {
    if (selectedSource !== "image-lookup") return null;

    return (
      <div style={{ marginTop: "16px" }}>
        {uploadedImage ? (
          <div
            style={{
              position: "relative",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid var(--glass-border)",
            }}
          >
            <img
              src={uploadedImage}
              alt="Uploaded"
              style={{ width: "100%", maxHeight: "200px", objectFit: "contain" }}
            />
            <button
              type="button"
              onClick={() => setUploadedImage(null)}
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                padding: "6px",
                borderRadius: "50%",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                border: "none",
                cursor: "pointer",
                color: "white",
              }}
            >
              <X style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? "var(--accent)" : "var(--glass-border)"}`,
              borderRadius: "12px",
              padding: "32px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: isDragging ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
            }}
          >
            <Upload
              style={{
                width: "36px",
                height: "36px",
                color: isDragging ? "var(--accent)" : "var(--foreground-muted)",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", marginBottom: "4px" }}>
              Drop an image here or click to upload
            </p>
            <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
    );
  };

  // Render tool panel (description, options, recent searches)
  const renderToolPanel = () => {
    if (!isToolSource || !currentSourceConfig) return null;

    return (
      <div
        className="glass"
        style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        {/* Tool Description */}
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>
            {currentSourceConfig.name}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
            {currentSourceConfig.longDescription || currentSourceConfig.description}
          </p>
        </div>

        {/* Tool-specific inputs */}
        {currentSourceConfig.additionalInputs && currentSourceConfig.additionalInputs.length > 0 && (
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {currentSourceConfig.additionalInputs.map((input) => (
              <div key={input.id}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--foreground-muted)",
                    marginBottom: "6px",
                  }}
                >
                  {input.label} {input.required && <span style={{ color: "var(--accent)" }}>*</span>}
                </label>
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
                    padding: "12px 14px",
                    fontSize: "14px",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Image upload for image-lookup */}
        {renderImageUpload()}

        {/* Tool options */}
        {renderToolOptions()}

        {/* Recent Searches */}
        {toolRecentSearches.length > 0 && (
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--glass-border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "10px" }}>
              Recent Searches
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {toolRecentSearches.slice(0, 5).map((search, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (currentSourceConfig.usesSearchInput) {
                      setQuery(search);
                    } else if (currentSourceConfig.additionalInputs?.[0]) {
                      setToolInputs(prev => ({
                        ...prev,
                        [currentSourceConfig.additionalInputs![0].id]: search,
                      }));
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--glass-border)",
                    background: "transparent",
                    color: "var(--foreground-muted)",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Example Searches */}
        {currentSourceConfig.exampleSearches && currentSourceConfig.exampleSearches.length > 0 && (
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--glass-border)" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "10px" }}>
              Try These Examples
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {currentSourceConfig.exampleSearches.map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (currentSourceConfig.usesSearchInput) {
                      setQuery(example);
                    } else if (currentSourceConfig.additionalInputs?.[0]) {
                      setToolInputs(prev => ({
                        ...prev,
                        [currentSourceConfig.additionalInputs![0].id]: example,
                      }));
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(var(--accent-rgb), 0.3)",
                    background: "rgba(var(--accent-rgb), 0.05)",
                    color: "var(--accent)",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render result display
  const renderResult = () => {
    if (!toolResult) return null;

    const sourceConfig = getSourceConfig(toolResult.source);
    const isAI = sourceConfig?.type === "ai" || toolResult.source === "ai";

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
              {isAI ? "AI Response" : "Results"}
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

  // Build ordered source list for display
  const orderedSources = useMemo(() => {
    // Order: AI, Web | Google, Images, News, Trends, Duck, Wikipedia, Grokipedia | tools | X, Youtube, Rumble, Amazon | individual AI
    const order: UnifiedSourceId[] = [
      "ai", "web",
      "google", "images", "news", "trends", "duck", "wikipedia", "grokipedia",
      "deep-search", "dark-search", "corporate-info", "business-info", "contacts", "contact-finder",
      "image-lookup", "visuals", "rosters", "spotify",
      "x", "youtube", "rumble", "amazon",
      "grok", "gemini", "claude", "chatgpt",
    ];
    return order.map(id => UNIFIED_SOURCES.find(s => s.id === id)).filter(Boolean) as typeof UNIFIED_SOURCES;
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
      {/* Trending Topics - always visible */}
      {trends.length > 0 && (
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

      {trendsLoading && trends.length === 0 && (
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
            gap: isMobile ? "10px" : "8px",
            borderRadius: isMobile ? "14px" : "12px",
            padding: isMobile ? "12px 12px 12px 16px" : "8px",
            paddingLeft: "16px",
          }}
        >
          <Search
            style={{
              width: isMobile ? "22px" : "20px",
              height: isMobile ? "22px" : "20px",
              flexShrink: 0,
              color: "var(--foreground-muted)",
              marginTop: isMobile ? "8px" : "10px",
            }}
          />
          <textarea
            ref={textareaRef}
            placeholder={
              selectedSource === "image-lookup"
                ? "Describe what you're looking for (optional)..."
                : needsAdditionalInputs
                ? "Additional context (optional)..."
                : "Search..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSearch(e as unknown as FormEvent);
              }
            }}
            onFocus={() => {
              if (isMobile) setDropdownOpen(true);
            }}
            rows={1}
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: isMobile ? "16px" : "15px",
              color: "var(--foreground)",
              padding: isMobile ? "6px 0" : "8px 0",
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
            disabled={isSearching}
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
              cursor: isSearching ? "not-allowed" : "pointer",
              opacity: isSearching ? 0.5 : 1,
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

        {/* Source Selector - Unified for both mobile and desktop */}
        <div
          style={{
            marginTop: isMobile ? "12px" : "16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? "6px" : "8px",
          }}
        >
          {/* When sources are hidden, show "show all" first, then selected source */}
          {sourcesHidden ? (
            <>
              {/* Show all button - first position */}
              <button
                type="button"
                onClick={() => setSourcesHidden(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: isMobile ? "10px 14px" : "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  color: "var(--foreground-muted)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Eye style={{ width: "14px", height: "14px" }} />
                show all
              </button>
              {/* Selected source - second position */}
              <button
                type="button"
                onClick={() => setSourcesHidden(false)}
                style={{
                  padding: isMobile ? "10px 14px" : "8px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "2px solid var(--accent)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  backgroundColor: "rgba(var(--accent-rgb), 0.15)",
                  color: "var(--accent)",
                  whiteSpace: "nowrap",
                }}
              >
                {currentSourceConfig?.name || selectedSource}
              </button>
            </>
          ) : (
            <>
              {/* All sources displayed as inline buttons - clicking any source selects it and hides others */}
              {orderedSources.map((source) => {
                const isSelected = selectedSource === source.id;
                const isHighlighted = highlightedSources.includes(source.id);
                const isMetaSource = source.type === "meta";

                // Add separator after Web and before individual AI sources
                const showSeparatorAfter = source.id === "web" || source.id === "amazon";

                return (
                  <div key={source.id} style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "8px" }}>
                    <button
                      type="button"
                      onClick={() => selectSource(source.id)}
                      style={{
                        padding: isMetaSource
                          ? (isMobile ? "10px 14px" : "8px 16px")
                          : (isMobile ? "10px 12px" : "8px 14px"),
                        fontSize: "13px",
                        fontWeight: isSelected || isMetaSource ? 600 : 500,
                        border: isSelected
                          ? "2px solid var(--accent)"
                          : isHighlighted
                          ? "2px solid rgba(var(--accent-rgb), 0.5)"
                          : "1px solid var(--glass-border)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        backgroundColor: isSelected
                          ? "rgba(var(--accent-rgb), 0.15)"
                          : isHighlighted
                          ? "rgba(var(--accent-rgb), 0.08)"
                          : "rgba(255, 255, 255, 0.03)",
                        color: isSelected || isHighlighted
                          ? "var(--accent)"
                          : "var(--foreground-muted)",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isHighlighted) {
                          e.currentTarget.style.borderColor = "rgba(var(--accent-rgb), 0.3)";
                          e.currentTarget.style.color = "var(--foreground)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isHighlighted) {
                          e.currentTarget.style.borderColor = "var(--glass-border)";
                          e.currentTarget.style.color = "var(--foreground-muted)";
                        }
                      }}
                    >
                      {source.name}
                    </button>
                    {showSeparatorAfter && !isMobile && (
                      <span style={{ color: "var(--foreground-muted)", opacity: 0.2, fontSize: "18px" }}>|</span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

      </form>

      {/* Tool panel */}
      {renderToolPanel()}

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
