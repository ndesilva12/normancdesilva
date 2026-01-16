import { NextRequest, NextResponse } from "next/server";
import {
  getNotionPages,
  getNotionPage,
  getNotionPageContent,
  createNotionPage,
  updateNotionPageTitle,
  appendToNotionPage,
  archiveNotionPage,
  searchNotionPages,
} from "@/lib/notion";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pageId = searchParams.get("pageId");
  const content = searchParams.get("content");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "20", 10);

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch from Notion" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pageId, title, content } = body;

    switch (action) {
      case "create": {
        if (!title) {
          return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        const page = await createNotionPage(title, content);
        return NextResponse.json({ page });
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
