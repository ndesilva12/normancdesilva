import { NextResponse } from "next/server";
import { queryGrok, queryGemini, queryClaude, queryChatGPT, SearchSource, ConversationMessage } from "@/lib/search-service";

async function handleSearch(query: string, source: SearchSource, conversationHistory: ConversationMessage[] = []) {
  // Only AI sources need API calls
  if (!["grok", "gemini", "claude", "chatgpt"].includes(source)) {
    return { error: "Invalid AI source", status: 400 };
  }

  try {
    let content: string;

    switch (source) {
      case "grok":
        content = await queryGrok(query, conversationHistory);
        break;
      case "gemini":
        content = await queryGemini(query, conversationHistory);
        break;
      case "claude":
        content = await queryClaude(query, conversationHistory);
        break;
      case "chatgpt":
        content = await queryChatGPT(query, conversationHistory);
        break;
      default:
        return { error: "Unknown source", status: 400 };
    }

    return { content, source };
  } catch (error) {
    console.error(`Search error for ${source}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Search failed";

    // Check for API key related errors and return user-friendly message
    const isApiKeyError = errorMessage.includes("API key") ||
                          errorMessage.includes("invalid argument") ||
                          errorMessage.includes("Incorrect API key") ||
                          errorMessage.includes("not configured");

    if (isApiKeyError) {
      const sourceNames: Record<string, string> = {
        grok: "Grok",
        gemini: "Gemini",
        claude: "Claude",
        chatgpt: "ChatGPT"
      };
      return { error: `${sourceNames[source] || source} API key not configured`, isConfigError: true, status: 503 };
    }

    return { error: errorMessage, status: 500 };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const source = searchParams.get("source") as SearchSource;

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (!source) {
    return NextResponse.json({ error: "Source is required" }, { status: 400 });
  }

  const result = await handleSearch(query, source);
  if (result.status) {
    return NextResponse.json({ error: result.error, isConfigError: result.isConfigError }, { status: result.status });
  }
  return NextResponse.json(result);
}

// POST endpoint for conversation continuation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, source, conversationHistory } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!source) {
      return NextResponse.json({ error: "Source is required" }, { status: 400 });
    }

    const result = await handleSearch(query, source as SearchSource, conversationHistory || []);
    if (result.status) {
      return NextResponse.json({ error: result.error, isConfigError: result.isConfigError }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST search error:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
