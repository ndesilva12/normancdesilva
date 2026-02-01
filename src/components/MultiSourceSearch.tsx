"use client";

import { useState, useEffect, FormEvent, useCallback, useRef, useMemo } from "react";
import { useLayout } from "@/contexts/LayoutContext";
import {
  Search, ExternalLink, X, Loader2, ChevronDown, Upload,
  BookOpen, FileSearch, Link2, User, Target, Sparkles, LayoutGrid, Grid3X3
} from "lucide-react";
import {
  UnifiedSourceId,
  UNIFIED_SOURCES,
  DEFAULT_SOURCE,
  getSearchUrl,
  getSourceConfig,
  getAIModelUrl,
  sourceNeedsInputs,
  sourceIsTool,
} from "@/lib/unified-sources";
import { useSettings } from "@/contexts/SettingsContext";
import { useRecentSearches } from "@/contexts/RecentSearchesContext";
import { useAuth } from "@/contexts/AuthContext";

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

// Deep Search Report Type
interface DeepSearchReportType {
  topic: string;
  briefOverview: string;
  sections: { title: string; content: string; links?: { title: string; url: string; type: string }[] }[];
  hiddenMechanics: string[];
  counterintuitiveInsights: string[];
  expertDebates: string[];
  underreportedAngles: string[];
  socialMediaHighlights: { platform: string; author: string; content: string; url: string }[];
  podcastReferences: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  links?: { title: string; url: string; type: string }[];
  timestamp: number;
}

// Dark Search Report Type
interface DarkSearchReportType {
  topic: string;
  mode: "long" | "short" | "links";
  summary: string;
  sections: { title: string; content: string; links?: { title: string; url: string; type: string }[] }[];
  keyTakeaways: string[];
  alternativePerspectives: string[];
  unansweredQuestions: string[];
  socialMediaHighlights: { platform: string; author: string; content: string; url: string }[];
  podcastReferences: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  links?: { title: string; url: string; type: string }[];
  timestamp: number;
}

// Deep Search Results Component
function DeepSearchResults({ report }: { report: DeepSearchReportType }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Brief Overview */}
      {report.briefOverview && (
        <div style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--foreground)" }}>
          {report.briefOverview}
        </div>
      )}

      {/* Sections */}
      {report.sections && report.sections.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {report.sections.map((section, idx) => (
            <div key={idx} style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>
                {section.title}
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--foreground-muted)", whiteSpace: "pre-wrap" }}>
                {section.content}
              </div>
              {section.links && section.links.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                  {section.links.map((link, lIdx) => (
                    <a key={lIdx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "rgba(255, 255, 255, 0.05)", fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>
                      {link.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden Mechanics */}
      {report.hiddenMechanics && report.hiddenMechanics.length > 0 && (
        <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(147, 51, 234, 0.1)", border: "1px solid rgba(147, 51, 234, 0.2)" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#a855f7", marginBottom: "10px" }}>Hidden Mechanics</div>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {report.hiddenMechanics.map((item, idx) => (
              <li key={idx} style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Counterintuitive Insights */}
      {report.counterintuitiveInsights && report.counterintuitiveInsights.length > 0 && (
        <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#22c55e", marginBottom: "10px" }}>Counterintuitive Insights</div>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {report.counterintuitiveInsights.map((item, idx) => (
              <li key={idx} style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expert Debates */}
      {report.expertDebates && report.expertDebates.length > 0 && (
        <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#3b82f6", marginBottom: "10px" }}>Expert Debates</div>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {report.expertDebates.map((item, idx) => (
              <li key={idx} style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Underreported Angles */}
      {report.underreportedAngles && report.underreportedAngles.length > 0 && (
        <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f59e0b", marginBottom: "10px" }}>Underreported Angles</div>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {report.underreportedAngles.map((item, idx) => (
              <li key={idx} style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Social Media Highlights */}
      {report.socialMediaHighlights && report.socialMediaHighlights.length > 0 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>Social Media Highlights</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {report.socialMediaHighlights.map((highlight, idx) => (
              <a key={idx} href={highlight.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)", textDecoration: "none" }}>
                <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "4px" }}>{highlight.platform} • {highlight.author}</div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>{highlight.content}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Podcast References */}
      {report.podcastReferences && report.podcastReferences.length > 0 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>Podcast References</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {report.podcastReferences.map((podcast, idx) => (
              <a key={idx} href={podcast.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)", textDecoration: "none" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "2px" }}>{podcast.title}</div>
                <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "4px" }}>{podcast.episode}{podcast.timestamp && ` • ${podcast.timestamp}`}</div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>{podcast.summary}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {report.links && report.links.length > 0 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>Sources</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {report.links.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--glass-border)", fontSize: "13px", color: "var(--foreground)", textDecoration: "none" }}>
                {link.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Dark Search Results Component
function DarkSearchResults({ report }: { report: DarkSearchReportType }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Summary */}
      {report.summary && (
        <div style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--foreground)", whiteSpace: "pre-wrap" }}>
          {report.summary}
        </div>
      )}

      {/* Key Takeaways */}
      {report.keyTakeaways && report.keyTakeaways.length > 0 && (
        <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#ef4444", marginBottom: "10px" }}>Key Takeaways</div>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {report.keyTakeaways.map((item, idx) => (
              <li key={idx} style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections */}
      {report.sections && report.sections.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {report.sections.map((section, idx) => (
            <div key={idx} style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>
                {section.title}
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--foreground-muted)", whiteSpace: "pre-wrap" }}>
                {section.content}
              </div>
              {section.links && section.links.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                  {section.links.map((link, lIdx) => (
                    <a key={lIdx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: "6px", backgroundColor: "rgba(255, 255, 255, 0.05)", fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>
                      {link.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alternative Perspectives */}
      {report.alternativePerspectives && report.alternativePerspectives.length > 0 && (
        <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(147, 51, 234, 0.1)", border: "1px solid rgba(147, 51, 234, 0.2)" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#a855f7", marginBottom: "10px" }}>Alternative Perspectives</div>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {report.alternativePerspectives.map((item, idx) => (
              <li key={idx} style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Unanswered Questions */}
      {report.unansweredQuestions && report.unansweredQuestions.length > 0 && (
        <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#f59e0b", marginBottom: "10px" }}>Unanswered Questions</div>
          <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {report.unansweredQuestions.map((item, idx) => (
              <li key={idx} style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Social Media Highlights */}
      {report.socialMediaHighlights && report.socialMediaHighlights.length > 0 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>Social Media Highlights</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {report.socialMediaHighlights.map((highlight, idx) => (
              <a key={idx} href={highlight.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)", textDecoration: "none" }}>
                <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "4px" }}>{highlight.platform} • {highlight.author}</div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>{highlight.content}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Podcast References */}
      {report.podcastReferences && report.podcastReferences.length > 0 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>Podcast References</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {report.podcastReferences.map((podcast, idx) => (
              <a key={idx} href={podcast.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)", textDecoration: "none" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: "2px" }}>{podcast.title}</div>
                <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "4px" }}>{podcast.episode}{podcast.timestamp && ` • ${podcast.timestamp}`}</div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>{podcast.summary}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {report.links && report.links.length > 0 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px" }}>Sources</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {report.links.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 14px", borderRadius: "8px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--glass-border)", fontSize: "13px", color: "var(--foreground)", textDecoration: "none" }}>
                {link.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MultiSourceSearch({ onResultsChange, onToolResult, onToolActive, widgetsCollapsed, onToggleCollapse }: MultiSourceSearchProps) {
  const { settings, updateSettings } = useSettings();
  const { getRecentSearches, addRecentSearch } = useRecentSearches();
  const { user } = useAuth();
  const { layout } = useLayout();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [trends, setTrends] = useState<TrendingSearch[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sources hidden state (default to collapsed, will sync with layout setting via useEffect)
  const [sourcesHidden, setSourcesHidden] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sources-hidden");
      // Default to collapsed (true) unless explicitly set to "false"
      return saved !== "false";
    }
    return true;
  });

  // Sync sources visibility with layout setting
  useEffect(() => {
    if (layout.searchSourceMode === "alwaysShowing") {
      setSourcesHidden(false);
    }
  }, [layout.searchSourceMode]);

  // Persist sources hidden state (only when not in "Always Show" mode)
  useEffect(() => {
    if (layout.searchSourceMode !== "alwaysShowing") {
      localStorage.setItem("sources-hidden", String(sourcesHidden));
    }
  }, [sourcesHidden, layout.searchSourceMode]);

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
    // Only auto-hide sources if "Always Show Sources" is disabled
    if (layout.searchSourceMode !== "alwaysShowing") {
      setSourcesHidden(true);
    }
  };

  // Highlighted sources (no longer used since meta sources were removed)
  const highlightedSources: string[] = [];

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

        // Add userId for tools that need it (like contact-finder)
        if (user?.uid) {
          body.userId = user.uid;
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

        // Extract content based on response structure
        // For deep-search and dark-search, report is an object, not a string
        // so we extract summary from the report for display
        let content: string | undefined;
        const reportData = (data as { report?: { summary?: string; briefOverview?: string } }).report;
        if (typeof reportData === "object" && reportData !== null) {
          // deep-search uses briefOverview, dark-search uses summary
          content = reportData.briefOverview || reportData.summary;
        } else {
          content = (data as { content?: string }).content ||
                    (data as { summary?: string }).summary;
        }

        setToolResult({
          source: selectedSource,
          sourceName: sourceConfig.name,
          status: "success",
          content,
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

        {/* Search button for tools with additional inputs */}
        {currentSourceConfig.additionalInputs && currentSourceConfig.additionalInputs.length > 0 && (
          <button
            type="submit"
            disabled={isSearching || !hasRequiredInputs}
            onClick={handleSearch}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px 20px",
              marginTop: "8px",
              marginBottom: "16px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: hasRequiredInputs ? "var(--accent)" : "rgba(255, 255, 255, 0.1)",
              color: hasRequiredInputs ? "var(--background)" : "var(--foreground-muted)",
              fontSize: "15px",
              fontWeight: 600,
              cursor: hasRequiredInputs && !isSearching ? "pointer" : "not-allowed",
              transition: "all 0.15s",
              opacity: isSearching ? 0.7 : 1,
            }}
          >
            {isSearching ? (
              <>
                <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                Searching...
              </>
            ) : (
              <>
                <Search style={{ width: "18px", height: "18px" }} />
                Search
              </>
            )}
          </button>
        )}

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

          {toolResult.status === "success" && (toolResult.content || toolResult.data) && (
            <>
              {/* Summary/Content - skip for tools with dedicated renderers */}
              {toolResult.content && toolResult.source !== "deep-search" && toolResult.source !== "dark-search" && (
                <div
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.8,
                    color: "var(--foreground)",
                    whiteSpace: "pre-wrap",
                    marginBottom: toolResult.source === "contact-finder" ? "20px" : 0,
                  }}
                >
                  {toolResult.content}
                </div>
              )}

              {/* Contact Finder Results */}
              {toolResult.source === "contact-finder" && toolResult.data && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {((toolResult.data as { results?: Array<{
                    name: string;
                    title?: string;
                    organization?: string;
                    contacts?: Array<{ type: string; value: string; confidence?: string; source?: string; notes?: string }>;
                    reasoning?: string;
                    additionalNotes?: string;
                  }> }).results || []).map((result, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--glass-border)",
                      }}
                    >
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
                          {result.name}
                        </div>
                        {result.title && (
                          <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                            {result.title}
                            {result.organization && ` at ${result.organization}`}
                          </div>
                        )}
                      </div>

                      {/* Contacts */}
                      {result.contacts && result.contacts.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {result.contacts.map((contact, cIdx) => (
                            <div
                              key={cIdx}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "10px",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                backgroundColor: "rgba(255, 255, 255, 0.02)",
                              }}
                            >
                              <div
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  backgroundColor: contact.confidence === "high"
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : contact.confidence === "speculative"
                                    ? "rgba(234, 179, 8, 0.15)"
                                    : "rgba(255, 255, 255, 0.1)",
                                  color: contact.confidence === "high"
                                    ? "#22c55e"
                                    : contact.confidence === "speculative"
                                    ? "#eab308"
                                    : "var(--foreground-muted)",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  textTransform: "capitalize",
                                  flexShrink: 0,
                                }}
                              >
                                {contact.type}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    color: "var(--foreground)",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {contact.type === "website" || contact.type === "form" ? (
                                    <a
                                      href={contact.value}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "var(--accent)", textDecoration: "none" }}
                                    >
                                      {contact.value}
                                    </a>
                                  ) : contact.type === "email" ? (
                                    <a
                                      href={`mailto:${contact.value}`}
                                      style={{ color: "var(--accent)", textDecoration: "none" }}
                                    >
                                      {contact.value}
                                    </a>
                                  ) : (
                                    contact.value
                                  )}
                                </div>
                                {contact.notes && (
                                  <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                                    {contact.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reasoning */}
                      {result.reasoning && (
                        <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "12px", fontStyle: "italic" }}>
                          {result.reasoning}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Disclaimer */}
                  {(toolResult.data as { disclaimer?: string }).disclaimer && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(234, 179, 8, 0.1)",
                        border: "1px solid rgba(234, 179, 8, 0.2)",
                        fontSize: "12px",
                        color: "#eab308",
                        marginTop: "8px",
                      }}
                    >
                      {(toolResult.data as { disclaimer: string }).disclaimer}
                    </div>
                  )}
                </div>
              )}

              {/* Deep Search Results */}
              {toolResult.source === "deep-search" && toolResult.data && (toolResult.data as { report?: object }).report && (
                <DeepSearchResults report={(toolResult.data as { report: DeepSearchReportType }).report} />
              )}

              {/* Dark Search Results */}
              {toolResult.source === "dark-search" && toolResult.data && (toolResult.data as { report?: object }).report && (
                <DarkSearchResults report={(toolResult.data as { report: DarkSearchReportType }).report} />
              )}

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
    // Order: Google, Jimmy, Images, News, Trends, Duck, Wikipedia, Grokipedia | tools | X, Youtube, Rumble, Amazon | individual AI
    const order: UnifiedSourceId[] = [
      "google", "jimmy", "images", "news", "trends", "duck", "wikipedia", "grokipedia",
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

            return (
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px", flex: 1 }}>
                {displayTrends.map((trend, index) => (
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
                    {index < displayTrends.length - 1 && (
                      <span style={{ marginLeft: "8px", opacity: 0.3 }}>•</span>
                    )}
                  </button>
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
          {/* When sources are hidden, show selected source with hint text */}
          {sourcesHidden ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              {/* Selected source button */}
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
              {/* Hint text */}
              <span style={{ fontSize: "11px", color: "var(--foreground-muted)", opacity: 0.7 }}>
                click to change source
              </span>
            </div>
          ) : (
            <>
              {/* All sources displayed as inline buttons - clicking any source selects it and hides others */}
              {orderedSources.map((source) => {
                const isSelected = selectedSource === source.id;
                const isHighlighted = highlightedSources.includes(source.id);
                const isMetaSource = source.type === "meta";

                // Add separator after Grokipedia (end of web sources) and before individual AI sources
                const showSeparatorAfter = source.id === "grokipedia" || source.id === "amazon";

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
