import { NextRequest, NextResponse } from "next/server";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  source: string;
  query: string;
  instant_answer?: string;
}

// DuckDuckGo Instant Answer API
async function searchDuckDuckGo(query: string): Promise<WebSearchResponse> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Dashboard/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error("DuckDuckGo API error");
    }

    const data = await response.json();
    const results: WebSearchResult[] = [];

    // Add abstract if available
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.Abstract,
        source: data.AbstractSource,
      });
    }

    // Add related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 8)) {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(" - ")[0] || topic.Text.substring(0, 60),
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
        // Handle nested topics
        if (topic.Topics && Array.isArray(topic.Topics)) {
          for (const subTopic of topic.Topics.slice(0, 3)) {
            if (subTopic.FirstURL && subTopic.Text) {
              results.push({
                title: subTopic.Text.split(" - ")[0] || subTopic.Text.substring(0, 60),
                url: subTopic.FirstURL,
                snippet: subTopic.Text,
              });
            }
          }
        }
      }
    }

    return {
      results: results.slice(0, 10),
      source: "duckduckgo",
      query,
      instant_answer: data.Answer || data.Abstract || undefined,
    };
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    return { results: [], source: "duckduckgo", query };
  }
}

// Wikipedia Search API
async function searchWikipedia(query: string): Promise<WebSearchResponse> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=10&srprop=snippet|titlesnippet`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Dashboard/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error("Wikipedia API error");
    }

    const data = await response.json();
    const results: WebSearchResult[] = [];

    if (data.query?.search) {
      for (const item of data.query.search) {
        results.push({
          title: item.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
          snippet: item.snippet.replace(/<[^>]*>/g, ""), // Strip HTML tags
        });
      }
    }

    return {
      results,
      source: "wikipedia",
      query,
    };
  } catch (error) {
    console.error("Wikipedia search error:", error);
    return { results: [], source: "wikipedia", query };
  }
}

// YouTube Search (using oEmbed for basic info, limited but works)
async function searchYouTube(query: string): Promise<WebSearchResponse> {
  // YouTube doesn't have a free search API, so we return a search URL
  // In a real app, you'd use the YouTube Data API with an API key
  return {
    results: [{
      title: `Search YouTube for "${query}"`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      snippet: `View video results for "${query}" on YouTube`,
    }],
    source: "youtube",
    query,
  };
}

// Rumble Search
async function searchRumble(query: string): Promise<WebSearchResponse> {
  return {
    results: [{
      title: `Search Rumble for "${query}"`,
      url: `https://rumble.com/search/video?q=${encodeURIComponent(query)}`,
      snippet: `View video results for "${query}" on Rumble`,
    }],
    source: "rumble",
    query,
  };
}

// X/Twitter Search
async function searchX(query: string): Promise<WebSearchResponse> {
  return {
    results: [{
      title: `Search X for "${query}"`,
      url: `https://x.com/search?q=${encodeURIComponent(query)}`,
      snippet: `View posts about "${query}" on X (Twitter)`,
    }],
    source: "x",
    query,
  };
}

// Google Trends
async function searchTrends(query: string): Promise<WebSearchResponse> {
  return {
    results: [{
      title: `Google Trends: "${query}"`,
      url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(query)}`,
      snippet: `Explore search trends and interest over time for "${query}"`,
    }],
    source: "trends",
    query,
  };
}

// Grokipedia Search
async function searchGrokipedia(query: string): Promise<WebSearchResponse> {
  return {
    results: [{
      title: `Search Grokipedia for "${query}"`,
      url: `https://grokipedia.com/search?q=${encodeURIComponent(query)}`,
      snippet: `View AI-generated encyclopedia entries for "${query}"`,
    }],
    source: "grokipedia",
    query,
  };
}

// Google Search (fallback - just provides link)
async function searchGoogle(query: string): Promise<WebSearchResponse> {
  return {
    results: [{
      title: `Search Google for "${query}"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      snippet: `View web search results for "${query}" on Google`,
    }],
    source: "google",
    query,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const source = searchParams.get("source");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  if (!source) {
    return NextResponse.json({ error: "Source parameter is required" }, { status: 400 });
  }

  let response: WebSearchResponse;

  switch (source) {
    case "duck":
      response = await searchDuckDuckGo(query);
      break;
    case "wikipedia":
      response = await searchWikipedia(query);
      break;
    case "youtube":
      response = await searchYouTube(query);
      break;
    case "rumble":
      response = await searchRumble(query);
      break;
    case "x":
      response = await searchX(query);
      break;
    case "trends":
      response = await searchTrends(query);
      break;
    case "grokipedia":
      response = await searchGrokipedia(query);
      break;
    case "google":
      response = await searchGoogle(query);
      break;
    default:
      return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  }

  return NextResponse.json(response);
}
