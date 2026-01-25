// Unified sources - combines search sources and tools into a single system

export type UnifiedSourceId =
  // Meta sources (multi-source)
  | "ai"
  | "web"
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
  // Tool sources
  | "deep-search"
  | "dark-search"
  | "corporate-info"
  | "business-info"
  | "contacts"
  | "contact-finder"
  | "image-lookup"
  | "visuals"
  | "rosters"
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
  // Example searches
  exampleSearches?: string[];
}

// Ordered list of all sources as specified
export const UNIFIED_SOURCES: UnifiedSourceConfig[] = [
  // Meta sources (AI and Web)
  {
    id: "ai",
    name: "Ai",
    description: "Query all AI models",
    longDescription: "Get responses from all four AI models simultaneously: Grok, Gemini, Claude, and ChatGPT.",
    type: "meta",
    includedSources: ["grok", "gemini", "claude", "chatgpt"],
    exampleSearches: ["What are the implications of quantum computing?", "Explain dark matter", "Best practices for system design"],
  },
  {
    id: "web",
    name: "Web",
    description: "Search all web sources",
    longDescription: "Search across Google, Images, News, Trends, DuckDuckGo, Wikipedia, and Grokipedia simultaneously.",
    type: "meta",
    includedSources: ["google", "images", "news", "trends", "duck", "wikipedia", "grokipedia"],
    exampleSearches: ["Latest tech news", "Climate change research", "Best restaurants near me"],
  },
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
  // Tool sources
  {
    id: "deep-search",
    name: "Deep Search",
    description: "Expert-level research reports",
    longDescription: "Generate comprehensive expert-level research reports focused on nuances, hidden mechanics, and insights that even educated people miss.",
    type: "tool",
    apiEndpoint: "/api/deep-search",
    usesSearchInput: true,
    toolHref: "/tools/deep-search",
    exampleSearches: [
      "How do central banks actually control inflation?",
      "The hidden mechanics of social media algorithms",
      "Why do some medications work differently for different people?",
    ],
  },
  {
    id: "dark-search",
    name: "Dark Search",
    description: "All perspectives research",
    longDescription: "Comprehensive research exploring all perspectives including alternative, fringe, and controversial viewpoints that mainstream sources often avoid.",
    type: "tool",
    apiEndpoint: "/api/dark-search",
    usesSearchInput: true,
    toolHref: "/tools/dark-search",
    toolOptions: [
      {
        id: "mode",
        type: "radio",
        label: "Output Mode",
        options: [
          { value: "long", label: "Long", description: "Full report" },
          { value: "short", label: "Short", description: "2 paragraphs, 3 links" },
          { value: "links", label: "Links", description: "3 sentences, 10+ links" },
        ],
        defaultValue: "long",
      },
    ],
    exampleSearches: [
      "Alternative theories about consciousness",
      "Controversial nutrition science",
      "Suppressed historical events",
    ],
  },
  {
    id: "corporate-info",
    name: "Corporate Info",
    description: "Corporate political analysis",
    longDescription: "Analyze corporate political leanings, donations, lobbying activities, and public statements to understand a company's political stance.",
    type: "tool",
    apiEndpoint: "/api/company/analyze",
    toolHref: "/tools/company-politics",
    additionalInputs: [
      {
        id: "companyName",
        label: "Company Name",
        placeholder: "Enter company name...",
        required: true,
      },
    ],
    exampleSearches: ["Apple", "Amazon", "Tesla", "Disney", "Nike"],
  },
  {
    id: "business-info",
    name: "Business Info",
    description: "Local business research",
    longDescription: "Deep dive into local businesses with public records, filings, ownership details, and news coverage.",
    type: "tool",
    apiEndpoint: "/api/business/search",
    toolHref: "/tools/business-info",
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
    exampleSearches: ["Joe's Coffee Shop, Brooklyn", "Main Street Bakery, Austin TX"],
  },
  {
    id: "contacts",
    name: "Contacts",
    description: "Search Google Contacts",
    longDescription: "Search and manage your Google Contacts directly from the dashboard.",
    type: "tool",
    apiEndpoint: "/api/contacts",
    usesSearchInput: true,
    toolHref: "/tools/contacts",
    exampleSearches: ["John Smith", "email contains @gmail", "phone 555"],
  },
  {
    id: "contact-finder",
    name: "Contact Finder",
    description: "AI-powered OSINT research",
    longDescription: "Find publicly available contact information for individuals or organizations using AI-powered OSINT research.",
    type: "tool",
    apiEndpoint: "/api/contact-finder",
    toolHref: "/tools/contact-finder",
    additionalInputs: [
      {
        id: "personName",
        label: "Person/Organization Name",
        placeholder: "Enter name to search...",
        required: true,
      },
    ],
    toolOptions: [
      {
        id: "searchType",
        type: "toggle",
        label: "Search Type",
        options: [
          { value: "individual", label: "Individual", description: "Search for a person" },
          { value: "target", label: "Target", description: "Search for an organization" },
        ],
        defaultValue: "individual",
      },
      {
        id: "aiSource",
        type: "radio",
        label: "AI Source",
        options: [
          { value: "grok", label: "Grok" },
          { value: "gemini", label: "Gemini" },
          { value: "claude", label: "Claude" },
          { value: "chatgpt", label: "ChatGPT" },
        ],
        defaultValue: "grok",
      },
    ],
    exampleSearches: ["Elon Musk contact info", "Apple HR department", "Local council member"],
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
    longDescription: "Reverse image search using Google Lens and Bing Visual Search to find image sources and similar images.",
    type: "tool",
    apiEndpoint: "/api/image-lookup",
    toolHref: "/tools/image-lookup",
    toolOptions: [
      {
        id: "engine",
        type: "toggle",
        label: "Search Engine",
        options: [
          { value: "google", label: "Google Lens" },
          { value: "bing", label: "Bing Visual" },
        ],
        defaultValue: "google",
      },
    ],
    // Special handling for image upload - no text input needed
    exampleSearches: [],
  },
  {
    id: "visuals",
    name: "Visuals",
    description: "AI image search & generation",
    longDescription: "AI-powered image search and generation. Find existing images or create new ones with data visualizations or imagination.",
    type: "tool",
    apiEndpoint: "/api/visuals",
    usesSearchInput: true,
    toolHref: "/tools/visuals",
    toolOptions: [
      {
        id: "action",
        type: "toggle",
        label: "Action",
        options: [
          { value: "search", label: "Find Existing Images" },
          { value: "generate", label: "Generate with AI" },
        ],
        defaultValue: "search",
      },
      {
        id: "generateMode",
        type: "toggle",
        label: "Generate Mode",
        options: [
          { value: "data", label: "Data", description: "Charts, infographics, visualizations" },
          { value: "imagine", label: "Imagine", description: "Creative AI-generated images" },
        ],
        defaultValue: "data",
      },
    ],
    exampleSearches: ["Sunset over mountains", "Data visualization pie chart", "Abstract art blue and gold"],
  },
  {
    id: "rosters",
    name: "Rosters",
    description: "Sports team rosters",
    longDescription: "View sports team rosters with player details and hometown mapping across NBA, NFL, NCAA, and more.",
    type: "tool",
    apiEndpoint: "/api/roster",
    toolHref: "/tools/visual-rosters",
    additionalInputs: [
      {
        id: "teamName",
        label: "Team Name",
        placeholder: "Enter team name...",
        required: true,
      },
    ],
    toolOptions: [
      {
        id: "league",
        type: "select",
        label: "League",
        options: [
          { value: "nba", label: "NBA" },
          { value: "nfl", label: "NFL" },
          { value: "mlb", label: "MLB" },
          { value: "nhl", label: "NHL" },
          { value: "mls", label: "MLS" },
          { value: "ncaaf", label: "NCAA Football" },
          { value: "ncaab", label: "NCAA Basketball" },
        ],
        defaultValue: "nba",
      },
    ],
    exampleSearches: ["Los Angeles Lakers", "New England Patriots", "Duke Blue Devils"],
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Music search & playback",
    longDescription: "Control Spotify playback, browse playlists, and search for music right from your dashboard.",
    type: "tool",
    apiEndpoint: "/api/spotify/search",
    usesSearchInput: true,
    toolHref: "/tools/spotify",
    exampleSearches: ["Taylor Swift", "90s hip hop playlist", "Lo-fi beats"],
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
