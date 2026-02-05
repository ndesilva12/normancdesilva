// Unified sources - combines search sources and tools into a single system

export type UnifiedSourceId =
  // Web search sources
  | "google"
  | "images"
  | "news"
  | "trends"
  | "duck"
  | "wikipedia"
  | "grokipedia"
  | "x"
  | "youtube"
  | "rumble"
  | "amazon"
  // Tool sources (removed: deep-search, dark-search, corporate-info, business-info, contact-finder, rosters - have dedicated pages)
  | "image-lookup"
  | "spotify"
  // AI sources (last)
  | "grok"
  | "gemini"
  | "claude"
  | "chatgpt";

export type SourceType = "meta" | "web" | "ai" | "tool";

export interface SourceInputField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  type?: "text" | "file" | "url";
}

export interface ToolOption {
  id: string;
  type: "toggle" | "select" | "radio";
  label: string;
  options?: { value: string; label: string; description?: string; icon?: string }[];
  defaultValue: string;
}

export interface UnifiedSourceConfig {
  id: UnifiedSourceId;
  name: string;
  description: string;
  longDescription?: string;
  type: SourceType;
  // For web sources - the search URL template
  searchUrlTemplate?: string;
  // For meta sources - which individual sources they include
  includedSources?: UnifiedSourceId[];
  // For tool sources - additional input fields beyond the main search bar
  additionalInputs?: SourceInputField[];
  // For tool sources - options/toggles
  toolOptions?: ToolOption[];
  // API endpoint for tool sources
  apiEndpoint?: string;
  // Whether this tool uses the main search input as the primary input
  usesSearchInput?: boolean;
  // Tool page href for reference
  toolHref?: string;
  // Whether clicking on this tool should navigate directly to its page (no inline preview)
  navigateDirectly?: boolean;
  // Example searches
  exampleSearches?: string[];
}

// Ordered list of all sources as specified
export const UNIFIED_SOURCES: UnifiedSourceConfig[] = [
  // Web search sources
  {
    id: "google",
    name: "Google",
    description: "Google search",
    type: "web",
    searchUrlTemplate: "https://www.google.com/search?q={query}",
  },
  {
    id: "images",
    name: "Images",
    description: "Google Images search",
    type: "web",
    searchUrlTemplate: "https://www.google.com/search?q={query}&tbm=isch",
  },
  {
    id: "news",
    name: "News",
    description: "Google News search",
    type: "web",
    searchUrlTemplate: "https://www.google.com/search?q={query}&tbm=nws",
  },
  {
    id: "trends",
    name: "Trends",
    description: "Google Trends",
    type: "web",
    searchUrlTemplate: "https://trends.google.com/trends/explore?q={query}",
  },
  {
    id: "duck",
    name: "Duck",
    description: "DuckDuckGo private search",
    type: "web",
    searchUrlTemplate: "https://duckduckgo.com/?q={query}",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Wikipedia search",
    type: "web",
    searchUrlTemplate: "https://en.wikipedia.org/wiki/Special:Search?search={query}",
  },
  {
    id: "grokipedia",
    name: "Grokipedia",
    description: "Grokipedia search",
    type: "web",
    searchUrlTemplate: "https://grokipedia.com/search?q={query}",
  },
  // Tool sources removed (deep-search, dark-search, corporate-info, business-info, contact-finder, rosters)
  // These have dedicated tool pages and shouldn't appear as search sources
  // More web sources
  {
    id: "x",
    name: "X",
    description: "X/Twitter search",
    type: "web",
    searchUrlTemplate: "https://x.com/search?q={query}",
  },
  {
    id: "youtube",
    name: "Youtube",
    description: "YouTube search",
    type: "web",
    searchUrlTemplate: "https://www.youtube.com/results?search_query={query}",
  },
  {
    id: "rumble",
    name: "Rumble",
    description: "Rumble video search",
    type: "web",
    searchUrlTemplate: "https://rumble.com/search/video?q={query}",
  },
  {
    id: "amazon",
    name: "Amazon",
    description: "Amazon product search",
    type: "web",
    searchUrlTemplate: "https://www.amazon.com/s?k={query}",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Spotify music search",
    type: "web",
    searchUrlTemplate: "https://open.spotify.com/search/{query}",
  },
  // AI sources (last)
  {
    id: "grok",
    name: "Grok",
    description: "xAI Grok",
    type: "ai",
    apiEndpoint: "/api/search",
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Google Gemini",
    type: "ai",
    apiEndpoint: "/api/search",
  },
  {
    id: "claude",
    name: "Claude",
    description: "Anthropic Claude",
    type: "ai",
    apiEndpoint: "/api/search",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "OpenAI ChatGPT",
    type: "ai",
    apiEndpoint: "/api/search",
  },
];

// Get all AI source IDs (individual AI sources, not meta)
export const AI_SOURCE_IDS: UnifiedSourceId[] = UNIFIED_SOURCES
  .filter(s => s.type === "ai")
  .map(s => s.id);

// Get all web source IDs (individual web sources, not meta)
export const WEB_SOURCE_IDS: UnifiedSourceId[] = UNIFIED_SOURCES
  .filter(s => s.type === "web")
  .map(s => s.id);

// Get all tool source IDs
export const TOOL_SOURCE_IDS: UnifiedSourceId[] = UNIFIED_SOURCES
  .filter(s => s.type === "tool")
  .map(s => s.id);

// Default source
export const DEFAULT_SOURCE: UnifiedSourceId = "google";

// Get search URL for a web source
export function getSearchUrl(sourceId: UnifiedSourceId, query: string): string {
  const source = UNIFIED_SOURCES.find(s => s.id === sourceId);
  if (!source?.searchUrlTemplate) return "";
  return source.searchUrlTemplate.replace("{query}", encodeURIComponent(query));
}

// Get source config by ID
export function getSourceConfig(sourceId: UnifiedSourceId): UnifiedSourceConfig | undefined {
  return UNIFIED_SOURCES.find(s => s.id === sourceId);
}

// Check if source needs additional inputs
export function sourceNeedsInputs(sourceId: UnifiedSourceId): boolean {
  const source = UNIFIED_SOURCES.find(s => s.id === sourceId);
  return Boolean(source?.additionalInputs && source.additionalInputs.length > 0);
}

// Check if source has tool options
export function sourceHasOptions(sourceId: UnifiedSourceId): boolean {
  const source = UNIFIED_SOURCES.find(s => s.id === sourceId);
  return Boolean(source?.toolOptions && source.toolOptions.length > 0);
}

// Check if source is a tool (needs full tool experience)
export function sourceIsTool(sourceId: UnifiedSourceId): boolean {
  const source = UNIFIED_SOURCES.find(s => s.id === sourceId);
  return source?.type === "tool";
}

// Check if source is a meta source
export function sourceIsMeta(sourceId: UnifiedSourceId): boolean {
  const source = UNIFIED_SOURCES.find(s => s.id === sourceId);
  return source?.type === "meta";
}

// AI model URLs for external links
export function getAIModelUrl(sourceId: UnifiedSourceId): string {
  switch (sourceId) {
    case "grok":
      return "https://grok.com";
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

// Get sources for display (excluding meta's included sources when meta is active)
export function getDisplaySources(): UnifiedSourceConfig[] {
  return UNIFIED_SOURCES;
}

// Get included sources for a meta source
export function getIncludedSources(sourceId: UnifiedSourceId): UnifiedSourceConfig[] {
  const source = UNIFIED_SOURCES.find(s => s.id === sourceId);
  if (!source?.includedSources) return [];
  return source.includedSources
    .map(id => UNIFIED_SOURCES.find(s => s.id === id))
    .filter((s): s is UnifiedSourceConfig => s !== undefined);
}
