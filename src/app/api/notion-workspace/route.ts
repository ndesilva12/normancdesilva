import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspaceItems,
  getAllDatabases,
  getDatabasePages,
  getRootPages,
  getNotionPage,
  getNotionDatabase,
  getNotionPageContent,
  getNotionSubpages,
  searchNotionContent,
  createNotionPage,
  createNotionPageInDatabase,
  createNotionSubpage,
  updateNotionPageTitle,
  appendToNotionPage,
  archiveNotionPage,
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
      case "workspace": {
        // Get all workspace items (pages and databases)
        const items = await getWorkspaceItems();
        return NextResponse.json({ items });
      }

      case "databases": {
        // Get all databases
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

      case "root-pages": {
        // Get root workspace pages
        const pages = await getRootPages();
        return NextResponse.json({ pages });
      }

      case "page": {
        // Get specific page details
        if (!id) {
          return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
        }
        const page = await getNotionPage(id);
        return NextResponse.json({ page });
      }

      case "database": {
        // Get specific database details
        if (!id) {
          return NextResponse.json({ error: "Database ID is required" }, { status: 400 });
        }
        const database = await getNotionDatabase(id);
        return NextResponse.json({ database });
      }

      case "page-content": {
        // Get page content (blocks)
        if (!id) {
          return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
        }
        const [page, blocks] = await Promise.all([
          getNotionPage(id),
          getNotionPageContent(id),
        ]);
        return NextResponse.json({ page, blocks });
      }

      case "subpages": {
        // Get subpages of a page
        if (!id) {
          return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
        }
        const subpages = await getNotionSubpages(id);
        return NextResponse.json({ subpages });
      }

      case "search": {
        // Search all content
        if (!search) {
          return NextResponse.json({ error: "Search query is required" }, { status: 400 });
        }
        const results = await searchNotionContent(search);
        return NextResponse.json({ results });
      }

      default: {
        // Default to workspace overview
        const [databases, rootPages] = await Promise.all([
          getAllDatabases(),
          getRootPages(),
        ]);
        return NextResponse.json({ databases, rootPages });
      }
    }
  } catch (error) {
    console.error("Notion workspace API error:", error);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pageId, databaseId, parentPageId, title, content } = body;

    switch (action) {
      case "create-page": {
        if (!title) {
          return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        const page = await createNotionPage(title, content);
        return NextResponse.json({ page });
      }

      case "create-database-page": {
        if (!databaseId || !title) {
          return NextResponse.json({ error: "Database ID and title are required" }, { status: 400 });
        }
        const page = await createNotionPageInDatabase(databaseId, title, content);
        return NextResponse.json({ page });
      }

      case "create-subpage": {
        if (!parentPageId || !title) {
          return NextResponse.json({ error: "Parent page ID and title are required" }, { status: 400 });
        }
        const subpage = await createNotionSubpage(parentPageId, title, content);
        return NextResponse.json({ page: subpage });
      }

      case "update-title": {
        if (!pageId || !title) {
          return NextResponse.json({ error: "Page ID and title are required" }, { status: 400 });
        }
        const page = await updateNotionPageTitle(pageId, title);
        return NextResponse.json({ page });
      }

      case "append-content": {
        if (!pageId || !content) {
          return NextResponse.json({ error: "Page ID and content are required" }, { status: 400 });
        }
        await appendToNotionPage(pageId, content);
        return NextResponse.json({ success: true });
      }

      case "archive": {
        if (!pageId) {
          return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
        }
        await archiveNotionPage(pageId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Notion workspace API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform Notion action" },
      { status: 500 }
    );
  }
}