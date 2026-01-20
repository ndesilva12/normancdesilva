// Unified sources - combines search sources and tools into a single system

export type UnifiedSourceId =
  // Search sources
  | "google"
  | "news"
  | "trends"
  | "duck"
  | "wikipedia"
  | "grokipedia"
  | "x"
  | "youtube"
  | "rumble"
  | "amazon"
  // AI sources
  | "grok"
  | "gemini"
  | "claude"
  | "chatgpt"
  // Tool sources
  | "deep-search"
  | "dark-search"
  | "corporate-info"
  | "business-info"
  | "contacts"
  | "image-lookup"
  | "visuals"
  | "rosters"
  | "spotify";

export type SourceType = "web" | "ai" | "tool";

export interface SourceInputField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  type?: "text" | "file" | "url";
}

export interface UnifiedSourceConfig {
  id: UnifiedSourceId;
  name: string;
  description: string;
  type: SourceType;
  // For web sources - the search URL template
  searchUrlTemplate?: string;
  // For tool sources - additional input fields beyond the main search bar
  additionalInputs?: SourceInputField[];
  // API endpoint for tool sources
  apiEndpoint?: string;
  // Whether this tool uses the main search input as the primary input
  usesSearchInput?: boolean;
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
    id: "news",
    name: "News",
    description: "Google News search",
    type: "web",
    searchUrlTemplate: "https://news.google.com/search?q={query}",
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
  // Tool sources
  {
    id: "deep-search",
    name: "Deep Search",
    description: "Expert-level research reports",
    type: "tool",
    apiEndpoint: "/api/tools/deep-search",
    usesSearchInput: true,
  },
  {
    id: "dark-search",
    name: "Dark Search",
    description: "All perspectives research",
    type: "tool",
    apiEndpoint: "/api/tools/dark-search",
    usesSearchInput: true,
  },
  // More web sources
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
  // Tool sources with additional inputs
  {
    id: "corporate-info",
    name: "Corporate Info",
    description: "Corporate political analysis",
    type: "tool",
    apiEndpoint: "/api/tools/company-politics",
    additionalInputs: [
      {
        id: "companyName",
        label: "Company Name",
        placeholder: "Enter company name...",
        required: true,
      },
    ],
  },
  {
    id: "business-info",
    name: "Business Info",
    description: "Local business research",
    type: "tool",
    apiEndpoint: "/api/tools/business-info",
    additionalInputs: [
      {
        id: "businessName",
        label: "Business Name",
        placeholder: "Enter business name...",
        required: true,
      },
      {
        id: "location",
        label: "Location",
        placeholder: "City, State (optional)",
        required: false,
      },
    ],
  },
  {
    id: "contacts",
    name: "Contacts",
    description: "Search Google Contacts",
    type: "tool",
    apiEndpoint: "/api/contacts/search",
    usesSearchInput: true,
  },
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
  // More tool sources
  {
    id: "image-lookup",
    name: "Image Lookup",
    description: "Reverse image search",
    type: "tool",
    apiEndpoint: "/api/tools/image-lookup",
    additionalInputs: [
      {
        id: "imageUrl",
        label: "Image URL",
        placeholder: "Paste image URL...",
        required: true,
        type: "url",
      },
    ],
  },
  {
    id: "visuals",
    name: "Visuals",
    description: "AI image search & generation",
    type: "tool",
    apiEndpoint: "/api/tools/visuals",
    usesSearchInput: true,
  },
  {
    id: "rosters",
    name: "Rosters",
    description: "Sports team rosters",
    type: "tool",
    apiEndpoint: "/api/tools/visual-rosters",
    additionalInputs: [
      {
        id: "teamName",
        label: "Team Name",
        placeholder: "Enter team name...",
        required: true,
      },
    ],
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Music search & playback",
    type: "tool",
    apiEndpoint: "/api/spotify/search",
    usesSearchInput: true,
  },
  // AI sources
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

// Get all AI source IDs
export const AI_SOURCE_IDS: UnifiedSourceId[] = UNIFIED_SOURCES
  .filter(s => s.type === "ai")
  .map(s => s.id);

// Get all web source IDs
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
