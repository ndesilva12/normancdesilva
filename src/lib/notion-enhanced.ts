import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  DatabaseObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

// Validate environment variables
const NOTION_TOKEN = process.env.NOTION_API_KEY;

if (!NOTION_TOKEN) {
  console.error("NOTION_API_KEY environment variable is not set");
}

// Initialize Notion client
const notion = new Client({
  auth: NOTION_TOKEN,
});

// Validation helper
function validateConfig() {
  if (!NOTION_TOKEN) {
    throw new Error("NOTION_API_KEY environment variable is not set. Please add it to your Vercel environment variables.");
  }
}

// Enhanced interfaces
export interface WorkspaceItem {
  id: string;
  type: 'page' | 'database';
  title: string;
  icon?: string;
  lastEditedTime: string;
  url: string;
}

export interface WorkspaceDatabase {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  createdTime: string;
  lastEditedTime: string;
  url: string;
  description?: string;
}

// Helper functions (reuse from existing notion.ts)
function extractPlainText(richText: RichTextItemResponse[]): string {
  return richText.map((text) => text.plain_text).join("");
}

function getPageTitle(page: PageObjectResponse): string {
  const titleProperty = Object.values(page.properties).find(
    (prop) => prop.type === "title"
  );
  if (titleProperty && titleProperty.type === "title") {
    return extractPlainText(titleProperty.title);
  }
  return "Untitled";
}

function getDatabaseTitle(database: DatabaseObjectResponse): string {
  if (database.title && database.title.length > 0) {
    return extractPlainText(database.title);
  }
  return "Untitled Database";
}

function getIcon(item: PageObjectResponse | DatabaseObjectResponse): string | undefined {
  if (!item.icon) return undefined;
  if (item.icon.type === "emoji") return item.icon.emoji;
  if (item.icon.type === "external") return item.icon.external.url;
  if (item.icon.type === "file") return item.icon.file.url;
  return undefined;
}

function getCover(item: PageObjectResponse | DatabaseObjectResponse): string | undefined {
  if (!item.cover) return undefined;
  if (item.cover.type === "external") return item.cover.external.url;
  if (item.cover.type === "file") return item.cover.file.url;
  return undefined;
}

// Get workspace overview using search (safe approach)
export async function getWorkspaceOverview(): Promise<{
  pages: WorkspaceItem[],
  databases: WorkspaceItem[]
}> {
  validateConfig();
  try {
    console.log("Fetching workspace overview...");

    // Use the basic search without type filters to avoid conflicts
    const allResponse = await notion.search({
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 100,
    });

    const pages: WorkspaceItem[] = [];
    const databases: WorkspaceItem[] = [];

    // Process results and categorize them safely
    for (const result of allResponse.results) {
      try {
        if (result.object === 'page' && 'properties' in result) {
          const page = result as PageObjectResponse;
          pages.push({
            id: page.id,
            type: 'page',
            title: getPageTitle(page),
            icon: getIcon(page),
            lastEditedTime: page.last_edited_time,
            url: page.url,
          });
        } else if (result.object === 'data_source' && 'properties' in result) {
          const database = result as unknown as DatabaseObjectResponse;
          databases.push({
            id: database.id,
            type: 'database',
            title: getDatabaseTitle(database),
            icon: getIcon(database),
            lastEditedTime: database.last_edited_time,
            url: database.url,
          });
        }
      } catch (itemError) {
        console.warn('Error processing search result item:', itemError);
        // Continue processing other items
      }
    }

    console.log(`Found ${pages.length} pages and ${databases.length} databases`);
    return { pages, databases };
  } catch (error) {
    console.error("Error fetching workspace overview:", error);
    throw error;
  }
}

// Get all databases with full metadata
export async function getAllDatabases(): Promise<WorkspaceDatabase[]> {
  validateConfig();
  try {
    console.log("Fetching all databases...");

    // Search for all content, then filter for databases
    const response = await notion.search({
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 100,
    });

    const databases: WorkspaceDatabase[] = [];

    for (const result of response.results) {
      try {
        if (result.object === 'data_source' && 'properties' in result) {
          const database = result as unknown as DatabaseObjectResponse;
          
          // Get database description if available
          let description = undefined;
          if (database.description && database.description.length > 0) {
            description = extractPlainText(database.description);
          }

          databases.push({
            id: database.id,
            title: getDatabaseTitle(database),
            icon: getIcon(database),
            cover: getCover(database),
            createdTime: database.created_time,
            lastEditedTime: database.last_edited_time,
            url: database.url,
            description,
          });
        }
      } catch (itemError) {
        console.warn('Error processing database item:', itemError);
        // Continue processing other items
      }
    }

    console.log(`Found ${databases.length} databases`);
    return databases;
  } catch (error) {
    console.error("Error fetching databases:", error);
    throw error;
  }
}

// Search across all content
export async function searchWorkspaceContent(query: string): Promise<WorkspaceItem[]> {
  validateConfig();
  try {
    const response = await notion.search({
      query,
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 50,
    });

    const items: WorkspaceItem[] = [];

    for (const result of response.results) {
      try {
        if (result.object === 'page' && 'properties' in result) {
          const page = result as PageObjectResponse;
          items.push({
            id: page.id,
            type: 'page',
            title: getPageTitle(page),
            icon: getIcon(page),
            lastEditedTime: page.last_edited_time,
            url: page.url,
          });
        } else if (result.object === 'data_source' && 'properties' in result) {
          const database = result as unknown as DatabaseObjectResponse;
          items.push({
            id: database.id,
            type: 'database',
            title: getDatabaseTitle(database),
            icon: getIcon(database),
            lastEditedTime: database.last_edited_time,
            url: database.url,
          });
        }
      } catch (itemError) {
        console.warn('Error processing search result item:', itemError);
        // Continue processing other items
      }
    }

    return items;
  } catch (error) {
    console.error("Error searching workspace content:", error);
    throw error;
  }
}

// Get pages from a specific database using dataSources if available
export async function getDatabasePages(databaseId: string, limit = 20) {
  validateConfig();
  try {
    console.log("Fetching pages from database:", databaseId);

    // Try using dataSources.query if available, fall back to databases approach
    let response;
    try {
      if (notion.dataSources && typeof notion.dataSources.query === 'function') {
        response = await notion.dataSources.query({
          data_source_id: databaseId,
          page_size: limit,
          sorts: [
            {
              timestamp: "last_edited_time",
              direction: "descending",
            },
          ],
        });
      } else {
        // Fallback: try to retrieve database info first, then search for related pages
        const database = await notion.databases.retrieve({ database_id: databaseId });
        
        // Search for pages that might be in this database
        const searchResponse = await notion.search({
          sort: {
            direction: "descending", 
            timestamp: "last_edited_time",
          },
          page_size: limit,
        });
        
        // Filter results to pages that have this database as parent
        response = {
          results: searchResponse.results.filter(result => 
            result.object === 'page' && 
            'parent' in result && 
            result.parent.type === 'database_id' && 
            result.parent.database_id === databaseId
          )
        };
      }
    } catch (queryError) {
      console.warn('Error with database query, trying alternative approach:', queryError);
      
      // Final fallback: just return empty results
      response = { results: [] };
    }

    const pages = [];

    for (const result of response.results) {
      try {
        if (result.object === 'page' && 'properties' in result) {
          const page = result as PageObjectResponse;
          pages.push({
            id: page.id,
            title: getPageTitle(page),
            icon: getIcon(page),
            cover: getCover(page),
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time,
            url: page.url,
            properties: page.properties,
          });
        }
      } catch (itemError) {
        console.warn('Error processing page item:', itemError);
        // Continue processing other items
      }
    }

    console.log(`Found ${pages.length} pages in database`);
    return pages;
  } catch (error) {
    console.error("Error fetching database pages:", error);
    throw error;
  }
}