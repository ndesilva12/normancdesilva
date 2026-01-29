import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceDatabases, getWorkspacePages } from "@/lib/notion-workspace";
import { getNotionPages, NOTION_DATABASE_ID } from "@/lib/notion";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get("view") || "overview";

  try {
    if (view === "overview") {
      // Get databases and top-level pages for organizational overview
      const [databases, topLevelPages, notesFromDatabase] = await Promise.all([
        getWorkspaceDatabases().catch(() => []),
        getWorkspacePages().catch(() => []),
        NOTION_DATABASE_ID ? getNotionPages(10).catch(() => []) : []
      ]);

      // Combine and organize items
      const organizationalItems = [
        ...databases.map(db => ({
          id: db.id,
          type: "database" as const,
          title: db.title,
          icon: db.icon || "🗃️",
          lastEditedTime: db.lastEditedTime,
          url: db.url,
          category: "Database"
        })),
        ...topLevelPages.map(page => ({
          id: page.id,
          type: "page" as const,
          title: page.title,
          icon: page.icon || "📄",
          lastEditedTime: page.lastEditedTime,
          url: page.url,
          category: "Page"
        }))
      ];

      // Sort by last edited time
      organizationalItems.sort((a, b) => 
        new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime()
      );

      // Include recent notes from the notes database for quick access
      const recentNotes = notesFromDatabase.map(note => ({
        id: note.id,
        type: "note" as const,
        title: note.title,
        icon: note.icon || "📝",
        lastEditedTime: note.lastEditedTime,
        url: note.url,
        category: "Recent Note"
      }));

      return NextResponse.json({
        organizationalItems,
        recentNotes,
        hasNotesDatabase: !!NOTION_DATABASE_ID
      });
    }

    return NextResponse.json({ error: "Invalid view" }, { status: 400 });
  } catch (error) {
    console.error("Notion overview API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch overview" },
      { status: 500 }
    );
  }
}