import { NextRequest, NextResponse } from "next/server";
import {
  getNotionPages,
  getNotionPage,
  getNotionPageContent,
  createNotionPage,
  createNotionSubpage,
  getNotionSubpages,
  updateNotionPageTitle,
  appendToNotionPage,
  archiveNotionPage,
  searchNotionPages,
  NOTION_DATABASE_ID,
} from "@/lib/notion";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageId = searchParams.get("pageId");
  const content = searchParams.get("content");
  const subpages = searchParams.get("subpages");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  // Check configuration before making any requests
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json(
      { error: "NOTION_API_KEY environment variable is not set. Please add it to your Vercel environment variables." },
      { status: 500 }
    );
  }

  if (!NOTION_DATABASE_ID && !pageId && !search) {
    return NextResponse.json(
      { error: "NOTION_DATABASE_ID environment variable is not set. Please add it to your Vercel environment variables." },
      { status: 500 }
    );
  }

  try {
    // Search for pages
    if (search) {
      const pages = await searchNotionPages(search);
      return NextResponse.json({ pages });
    }

    // Get specific page content
    if (pageId && content === "true") {
      const [page, blocks] = await Promise.all([
        getNotionPage(pageId),
        getNotionPageContent(pageId),
      ]);
      return NextResponse.json({ page, blocks });
    }

    // Get subpages of a page
    if (pageId && subpages === "true") {
      const childPages = await getNotionSubpages(pageId);
      return NextResponse.json({ subpages: childPages });
    }

    // Get specific page metadata
    if (pageId) {
      const page = await getNotionPage(pageId);
      return NextResponse.json({ page });
    }

    // Get all pages from database
    const pages = await getNotionPages(limit);
    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Notion API error:", error);

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch from Notion";

    // Check for common Notion API errors
    if (errorMessage.includes("Could not find database") || errorMessage.includes("object_not_found")) {
      return NextResponse.json(
        { error: `Database not found. Make sure NOTION_DATABASE_ID is correct and the integration has access to it. Current ID: ${NOTION_DATABASE_ID?.slice(0, 8)}...` },
        { status: 500 }
      );
    }

    if (errorMessage.includes("unauthorized") || errorMessage.includes("invalid_token")) {
      return NextResponse.json(
        { error: "Invalid Notion API key. Please check your NOTION_API_KEY environment variable." },
        { status: 500 }
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
    const { action, pageId, parentPageId, title, content } = body;

    switch (action) {
      case "create": {
        if (!title) {
          return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        const page = await createNotionPage(title, content);
        return NextResponse.json({ page });
      }

      case "createSubpage": {
        if (!parentPageId || !title) {
          return NextResponse.json({ error: "Parent page ID and title are required" }, { status: 400 });
        }
        const subpage = await createNotionSubpage(parentPageId, title, content);
        return NextResponse.json({ page: subpage });
      }

      case "updateTitle": {
        if (!pageId || !title) {
          return NextResponse.json({ error: "Page ID and title are required" }, { status: 400 });
        }
        const page = await updateNotionPageTitle(pageId, title);
        return NextResponse.json({ page });
      }

      case "append": {
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
    console.error("Notion API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform Notion action" },
      { status: 500 }
    );
  }
}
