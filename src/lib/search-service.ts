// Multi-source search service

export type SearchSource =
  | "duck"
  | "google"
  | "wikipedia"
  | "grokipedia"
  | "x"
  | "youtube"
  | "rumble"
  | "trends"
  | "grok"
  | "gemini"
  | "claude";

export interface SearchSourceConfig {
  id: SearchSource;
  name: string;
  description: string;
  icon: string;
  type: "web" | "ai";
}

export const SEARCH_SOURCES: SearchSourceConfig[] = [
  { id: "duck", name: "DuckDuckGo", description: "Private web search", icon: "🦆", type: "web" },
  { id: "google", name: "Google", description: "Google search", icon: "🔍", type: "web" },
  { id: "wikipedia", name: "Wikipedia", description: "Search Wikipedia", icon: "📚", type: "web" },
  { id: "grokipedia", name: "Grokipedia", description: "Search Grokipedia", icon: "🧠", type: "web" },
  { id: "x", name: "X / Twitter", description: "Search X posts", icon: "𝕏", type: "web" },
  { id: "youtube", name: "YouTube", description: "Search YouTube", icon: "▶️", type: "web" },
  { id: "rumble", name: "Rumble", description: "Search Rumble", icon: "🎬", type: "web" },
  { id: "trends", name: "Google Trends", description: "Search trends", icon: "📈", type: "web" },
  { id: "grok", name: "Grok AI", description: "xAI Grok", icon: "🤖", type: "ai" },
  { id: "gemini", name: "Gemini", description: "Google Gemini", icon: "✨", type: "ai" },
  { id: "claude", name: "Claude", description: "Anthropic Claude", icon: "🔮", type: "ai" },
];

export interface SearchResult {
  source: SearchSource;
  sourceName: string;
  type: "web" | "ai";
  status: "success" | "error" | "loading";
  error?: string;
  // For web sources
  url?: string;
  // For AI sources
  content?: string;
}

// Get the search URL for a web source
export function getSearchUrl(source: SearchSource, query: string): string {
  const encodedQuery = encodeURIComponent(query);

  switch (source) {
    case "duck":
      return `https://duckduckgo.com/?q=${encodedQuery}`;
    case "google":
      return `https://www.google.com/search?q=${encodedQuery}`;
    case "wikipedia":
      return `https://en.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`;
    case "grokipedia":
      return `https://grokipedia.com/search?q=${encodedQuery}`;
    case "x":
      return `https://x.com/search?q=${encodedQuery}`;
    case "youtube":
      return `https://www.youtube.com/results?search_query=${encodedQuery}`;
    case "rumble":
      return `https://rumble.com/search/video?q=${encodedQuery}`;
    case "trends":
      return `https://trends.google.com/trends/explore?q=${encodedQuery}`;
    default:
      return "";
  }
}

// AI source handlers (called server-side)
const GROK_API_KEY = process.env.GROK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function queryGrok(query: string): Promise<string> {
  if (!GROK_API_KEY) throw new Error("Grok API key not configured");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-3-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Provide concise, informative answers.",
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function queryGemini(query: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: query }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export async function queryClaude(query: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error("Claude API key not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Get trending companies using Grok
export async function getTrendingCompanies(): Promise<{ google: string[]; x: string[] }> {
  if (!GROK_API_KEY) {
    return { google: [], x: [] };
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          {
            role: "system",
            content: "You are an assistant that provides current trending information. Respond only with valid JSON.",
          },
          {
            role: "user",
            content: `What companies are trending right now? Provide two lists:
1. Companies trending on Google search in the last 24 hours
2. Companies being discussed on X/Twitter in the last 24 hours

Respond with this exact JSON format:
{
  "google": ["Company 1", "Company 2", "Company 3", "Company 4", "Company 5"],
  "x": ["Company A", "Company B", "Company C", "Company D", "Company E"]
}

Only include well-known company names. Limit each list to 5-8 companies.`,
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Strip markdown if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    return JSON.parse(content.trim());
  } catch (error) {
    console.error("Failed to get trending companies:", error);
    return { google: [], x: [] };
  }
}
