import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export interface WorkspaceItem {
  id: string;
  type: "page" | "database";
  title: string;
  icon?: string;
  lastEditedTime: string;
  url: string;
  parent?: {
    type: string;
    page_id?: string;
    database_id?: string;
    workspace?: boolean;
  };
}

// Helper to extract plain text from rich text array
function extractPlainText(richText: any[]): string {
  try {
    if (!Array.isArray(richText)) return "";
    return richText.map((text) => text?.plain_text || "").join("");
  } catch (error) {
    return "";
  }
}

// Helper to get title from page or database  
function getTitle(item: any): string {
  try {
    if (item?.properties) {
      // This is a page
      const titleProperty = Object.values(item.properties).find(
        (prop: any) => prop?.type === "title"
      );
      if (titleProperty && (titleProperty as any).type === "title") {
        return extractPlainText((titleProperty as any).title || []);
      }
    } else if (item?.title) {
      // This is a database
      return extractPlainText(item.title || []);
    }
    return "Untitled";
  } catch (error) {
    return "Untitled";
  }
}

// Helper to get icon
function getIcon(item: any): string | undefined {
  try {
    if (!item?.icon) return undefined;
    if (item.icon.type === "emoji") return item.icon.emoji;
    if (item.icon.type === "external") return item.icon.external?.url;
    if (item.icon.type === "file") return item.icon.file?.url;
    return undefined;
  } catch (error) {
    return undefined;
  }
}

// Get all databases in the workspace
export async function getWorkspaceDatabases(): Promise<WorkspaceItem[]> {
  try {
    // Use raw fetch to avoid SDK type issues
    const response = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: "object",
          value: "database",
        },
        sort: {
          direction: "descending",
          timestamp: "last_edited_time",
        },
        page_size: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json() as any;

    return data.results
      .filter((item: any) => item.object === "database")
      .map((database) => ({
        id: database.id,
        type: "database" as const,
        title: getTitle(database),
        icon: getIcon(database),
        lastEditedTime: database.last_edited_time,
        url: database.url,
        parent: database.parent,
      }));
  } catch (error) {
    console.error("Error fetching workspace databases:", error);
    throw error;
  }
}

// Get top-level pages (pages not in databases)
export async function getWorkspacePages(): Promise<WorkspaceItem[]> {
  try {
    // Use raw fetch to avoid SDK type issues
    const response = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: "object",
          value: "page",
        },
        sort: {
          direction: "descending",
          timestamp: "last_edited_time",
        },
        page_size: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json() as any;

    return data.results
      .filter((item: any) => item.object === "page")
      // Filter out pages that are in databases (we want top-level pages only)
      .filter((page) => !page.parent || page.parent.type !== "database_id")
      .map((page) => ({
        id: page.id,
        type: "page" as const,
        title: getTitle(page),
        icon: getIcon(page),
        lastEditedTime: page.last_edited_time,
        url: page.url,
        parent: page.parent,
      }));
  } catch (error) {
    console.error("Error fetching workspace pages:", error);
    throw error;
  }
}

// Get children from root page
export async function getRootPageChildren(): Promise<WorkspaceItem[]> {
  const rootPageId = process.env.NOTION_ROOT_PAGE_ID || process.env.NOTION_DATABASE_ID;
  
  if (!rootPageId) {
    throw new Error("NOTION_ROOT_PAGE_ID or NOTION_DATABASE_ID not configured");
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/blocks/${rootPageId}/children`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const items: WorkspaceItem[] = [];

    for (const block of data.results || []) {
      if (block.type === "child_database") {
        // Fetch database details
        const dbResponse = await fetch(
          `https://api.notion.com/v1/databases/${block.id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
              "Notion-Version": "2022-06-28",
            },
          }
        );
        if (dbResponse.ok) {
          const database = await dbResponse.json();
          items.push({
            id: database.id,
            type: "database",
            title: getTitle(database),
            icon: getIcon(database),
            lastEditedTime: database.last_edited_time,
            url: database.url,
          });
        }
      } else if (block.type === "child_page") {
        // Fetch page details
        const pageResponse = await fetch(
          `https://api.notion.com/v1/pages/${block.id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
              "Notion-Version": "2022-06-28",
            },
          }
        );
        if (pageResponse.ok) {
          const page = await pageResponse.json();
          items.push({
            id: page.id,
            type: "page",
            title: getTitle(page),
            icon: getIcon(page),
            lastEditedTime: page.last_edited_time,
            url: page.url,
          });
        }
      }
    }

    // Sort by last edited time
    items.sort((a, b) => 
      new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime()
    );

    return items;
  } catch (error) {
    console.error("Error fetching root page children:", error);
    throw error;
  }
}

// Get all workspace items (databases + top-level pages)
export async function getWorkspaceItems(): Promise<WorkspaceItem[]> {
  // Use root page children if configured, otherwise fall back to workspace search
  if (process.env.NOTION_ROOT_PAGE_ID || process.env.NOTION_DATABASE_ID) {
    return getRootPageChildren();
  }

  try {
    const [databases, pages] = await Promise.all([
      getWorkspaceDatabases(),
      getWorkspacePages(),
    ]);

    // Combine and sort by last edited time
    const allItems = [...databases, ...pages];
    allItems.sort((a, b) => 
      new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime()
    );

    return allItems;
  } catch (error) {
    console.error("Error fetching workspace items:", error);
    throw error;
  }
}

// Get pages within a specific database
export async function getDatabasePages(databaseId: string, limit = 50): Promise<WorkspaceItem[]> {
  try {
    // Use raw fetch to avoid SDK type issues
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: limit,
        sorts: [
          {
            timestamp: "last_edited_time",
            direction: "descending",
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json() as any;

    return data.results
      .filter((item: any) => item?.properties)
      .map((page: any) => ({
        id: page.id,
        type: "page" as const,
        title: getTitle(page),
        icon: getIcon(page),
        lastEditedTime: page.last_edited_time,
        url: page.url,
        parent: page.parent,
      }));
  } catch (error) {
    console.error("Error fetching database pages:", error);
    throw error;
  }
}

// Search across workspace
export async function searchWorkspace(query: string): Promise<WorkspaceItem[]> {
  try {
    const response = await notion.search({
      query,
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 50,
    });

    return response.results
      .filter((item: any) => 
        item.object === "page" || item.object === "database"
      )
      .map((item) => ({
        id: item.id,
        type: item.object as "page" | "database",
        title: getTitle(item),
        icon: getIcon(item),
        lastEditedTime: item.last_edited_time,
        url: item.url,
        parent: item.parent,
      }));
  } catch (error) {
    console.error("Error searching workspace:", error);
    throw error;
  }
}