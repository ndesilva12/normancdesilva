import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspaceOverview,
  getAllDatabases,
  getDatabasePages,
  searchWorkspaceContent,
} from "@/lib/notion-enhanced";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  const id = searchParams.get("id");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  // Check configuration before making any requests
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json(
      { error: "NOTION_API_KEY environment variable is not set. Please add it to your Vercel environment variables." },
      { status: 500 }
    );
  }

  try {
    switch (action) {
      case "overview": {
        // Get workspace overview (pages and databases)
        const overview = await getWorkspaceOverview();
        return NextResponse.json(overview);
      }

      case "databases": {
        // Get all databases with full metadata
        const databases = await getAllDatabases();
        return NextResponse.json({ databases });
      }

      case "database-pages": {
        // Get pages from a specific database
        if (!id) {
          return NextResponse.json({ error: "Database ID is required" }, { status: 400 });
        }
        const pages = await getDatabasePages(id, limit);
        return NextResponse.json({ pages });
      }

      case "search": {
        // Search all content
        if (!search) {
          return NextResponse.json({ error: "Search query is required" }, { status: 400 });
        }
        const results = await searchWorkspaceContent(search);
        return NextResponse.json({ results });
      }

      default: {
        // Default to workspace overview
        const overview = await getWorkspaceOverview();
        return NextResponse.json(overview);
      }
    }
  } catch (error) {
    console.error("Workspace API error:", error);

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch from Notion";

    // Check for common Notion API errors
    if (errorMessage.includes("unauthorized") || errorMessage.includes("invalid_token")) {
      return NextResponse.json(
        { error: "Invalid Notion API key. Please check your NOTION_API_KEY environment variable." },
        { status: 500 }
      );
    }

    if (errorMessage.includes("object_not_found")) {
      return NextResponse.json(
        { error: "The requested Notion object was not found or you don't have access to it." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}