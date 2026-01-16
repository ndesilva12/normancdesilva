import { NextResponse } from "next/server";
import { queryGrok, queryGemini, queryClaude, SearchSource } from "@/lib/search-service";

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

  // Only AI sources need API calls
  if (!["grok", "gemini", "claude"].includes(source)) {
    return NextResponse.json({ error: "Invalid AI source" }, { status: 400 });
  }

  try {
    let content: string;

    switch (source) {
      case "grok":
        content = await queryGrok(query);
        break;
      case "gemini":
        content = await queryGemini(query);
        break;
      case "claude":
        content = await queryClaude(query);
        break;
      default:
        return NextResponse.json({ error: "Unknown source" }, { status: 400 });
    }

    return NextResponse.json({ content, source });
  } catch (error) {
    console.error(`Search error for ${source}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Search failed";

    // Check for API key related errors and return user-friendly message
    const isApiKeyError = errorMessage.includes("API key") ||
                          errorMessage.includes("invalid argument") ||
                          errorMessage.includes("Incorrect API key") ||
                          errorMessage.includes("not configured");

    if (isApiKeyError) {
      const sourceName = source === "grok" ? "Grok" : source === "gemini" ? "Gemini" : "Claude";
      return NextResponse.json(
        { error: `${sourceName} API key not configured`, isConfigError: true },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
