import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  DatabaseObjectResponse,
  SearchResponse,
} from "@notionhq/client/build/src/api-endpoints";

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
  return richText.map((text) => text.plain_text).join("");
}

// Helper to get title from page or database
function getTitle(item: PageObjectResponse | DatabaseObjectResponse): string {
  if ("properties" in item && item.properties) {
    // This is a page
    const titleProperty = Object.values(item.properties).find(
      (prop: any) => prop.type === "title"
    );
    if (titleProperty && titleProperty.type === "title") {
      return extractPlainText(titleProperty.title);
    }
  } else if ("title" in item) {
    // This is a database
    return extractPlainText(item.title);
  }
  return "Untitled";
}

// Helper to get icon
function getIcon(item: PageObjectResponse | DatabaseObjectResponse): string | undefined {
  if (!item.icon) return undefined;
  if (item.icon.type === "emoji") return item.icon.emoji;
  if (item.icon.type === "external") return item.icon.external.url;
  if (item.icon.type === "file") return item.icon.file.url;
  return undefined;
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

    const data = await response.json() as SearchResponse;

    return data.results
      .filter((item): item is DatabaseObjectResponse => item.object === "database")
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

    const data = await response.json() as SearchResponse;

    return data.results
      .filter((item): item is PageObjectResponse => item.object === "page")
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

// Get all workspace items (databases + top-level pages)
export async function getWorkspaceItems(): Promise<WorkspaceItem[]> {
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
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: limit,
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending",
        },
      ],
    });

    return response.results
      .filter((item): item is PageObjectResponse => "properties" in item)
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
      .filter((item): item is PageObjectResponse | DatabaseObjectResponse => 
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