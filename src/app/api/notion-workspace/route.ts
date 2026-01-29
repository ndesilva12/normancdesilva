import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspaceItems,
  getWorkspaceDatabases,
  getWorkspacePages,
  getDatabasePages,
  searchWorkspace,
} from "@/lib/notion-workspace";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "workspace";
  const databaseId = searchParams.get("databaseId");
  const query = searchParams.get("query");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    switch (action) {
      case "workspace":
        const workspaceItems = await getWorkspaceItems();
        return NextResponse.json({ items: workspaceItems });

      case "databases":
        const databases = await getWorkspaceDatabases();
        return NextResponse.json({ items: databases });

      case "pages":
        const pages = await getWorkspacePages();
        return NextResponse.json({ items: pages });

      case "database-pages":
        if (!databaseId) {
          return NextResponse.json({ error: "Database ID is required" }, { status: 400 });
        }
        const databasePages = await getDatabasePages(databaseId, limit);
        return NextResponse.json({ items: databasePages });

      case "search":
        if (!query) {
          return NextResponse.json({ error: "Search query is required" }, { status: 400 });
        }
        const searchResults = await searchWorkspace(query);
        return NextResponse.json({ items: searchResults });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Notion workspace API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}