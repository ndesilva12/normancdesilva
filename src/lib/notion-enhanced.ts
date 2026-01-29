import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
  DatabaseObjectResponse,
  BlockObjectResponse,
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

export interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  createdTime: string;
  lastEditedTime: string;
  url: string;
  properties?: Record<string, unknown>;
  parent?: {
    type: string;
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
  };
}

export interface NotionDatabase {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  createdTime: string;
  lastEditedTime: string;
  url: string;
  description?: string;
  properties: Record<string, unknown>;
  parent?: {
    type: string;
    page_id?: string;
    workspace?: boolean;
  };
}

export interface NotionBlock {
  id: string;
  type: string;
  content: string;
  hasChildren: boolean;
  children?: NotionBlock[];
}

export interface NotionWorkspaceItem {
  id: string;
  type: 'page' | 'database';
  title: string;
  icon?: string;
  lastEditedTime: string;
  url: string;
  parent?: {
    type: string;
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
  };
}

// Helper to extract plain text from rich text array
function extractPlainText(richText: RichTextItemResponse[]): string {
  return richText.map((text) => text.plain_text).join("");
}

// Helper to get page title from properties
function getPageTitle(page: PageObjectResponse): string {
  const titleProperty = Object.values(page.properties).find(
    (prop) => prop.type === "title"
  );
  if (titleProperty && titleProperty.type === "title") {
    return extractPlainText(titleProperty.title);
  }
  return "Untitled";
}

// Helper to get database title
function getDatabaseTitle(database: DatabaseObjectResponse): string {
  if (database.title && database.title.length > 0) {
    return extractPlainText(database.title);
  }
  return "Untitled Database";
}

// Helper to get page/database icon
function getIcon(item: PageObjectResponse | DatabaseObjectResponse): string | undefined {
  if (!item.icon) return undefined;
  if (item.icon.type === "emoji") return item.icon.emoji;
  if (item.icon.type === "external") return item.icon.external.url;
  if (item.icon.type === "file") return item.icon.file.url;
  return undefined;
}

// Helper to get page/database cover
function getCover(item: PageObjectResponse | DatabaseObjectResponse): string | undefined {
  if (!item.cover) return undefined;
  if (item.cover.type === "external") return item.cover.external.url;
  if (item.cover.type === "file") return item.cover.file.url;
  return undefined;
}

// Convert block to our format
function convertBlock(block: BlockObjectResponse): NotionBlock {
  let content = "";

  switch (block.type) {
    case "paragraph":
      content = extractPlainText(block.paragraph.rich_text);
      break;
    case "heading_1":
      content = extractPlainText(block.heading_1.rich_text);
      break;
    case "heading_2":
      content = extractPlainText(block.heading_2.rich_text);
      break;
    case "heading_3":
      content = extractPlainText(block.heading_3.rich_text);
      break;
    case "bulleted_list_item":
      content = extractPlainText(block.bulleted_list_item.rich_text);
      break;
    case "numbered_list_item":
      content = extractPlainText(block.numbered_list_item.rich_text);
      break;
    case "to_do":
      content = `${block.to_do.checked ? "[x]" : "[ ]"} ${extractPlainText(block.to_do.rich_text)}`;
      break;
    case "toggle":
      content = extractPlainText(block.toggle.rich_text);
      break;
    case "quote":
      content = extractPlainText(block.quote.rich_text);
      break;
    case "callout":
      content = extractPlainText(block.callout.rich_text);
      break;
    case "code":
      content = extractPlainText(block.code.rich_text);
      break;
    case "divider":
      content = "---";
      break;
    case "image":
      if (block.image.type === "external") {
        content = block.image.external.url;
      } else if (block.image.type === "file") {
        content = block.image.file.url;
      }
      break;
    case "bookmark":
      content = block.bookmark.url;
      break;
    case "link_preview":
      content = block.link_preview.url;
      break;
    case "child_page":
      // Child pages don't have accessible title in block format
      content = "Child Page";
      break;
    case "child_database":
      // Child databases don't have accessible title in block format  
      content = "Child Database";
      break;
    default:
      content = "";
  }

  return {
    id: block.id,
    type: block.type,
    content,
    hasChildren: block.has_children,
  };
}

// Get all workspace content (pages and databases)
export async function getWorkspaceItems(): Promise<NotionWorkspaceItem[]> {
  validateConfig();
  try {
    console.log("Fetching workspace content...");

    const response = await notion.search({
      filter: {
        property: "object",
        value: "page",
      },
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 100,
    });

    const items: NotionWorkspaceItem[] = [];

    // Process pages
    for (const result of response.results) {
      if ("properties" in result) {
        const page = result as PageObjectResponse;
        items.push({
          id: page.id,
          type: 'page',
          title: getPageTitle(page),
          icon: getIcon(page),
          lastEditedTime: page.last_edited_time,
          url: page.url,
          parent: page.parent,
        });
      }
    }

    // Also search for databases
    const dbResponse = await notion.search({
      filter: {
        property: "object",
        value: "database",
      },
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 100,
    });

    // Process databases
    for (const result of dbResponse.results) {
      if ("properties" in result) {
        const database = result as DatabaseObjectResponse;
        items.push({
          id: database.id,
          type: 'database',
          title: getDatabaseTitle(database),
          icon: getIcon(database),
          lastEditedTime: database.last_edited_time,
          url: database.url,
          parent: database.parent,
        });
      }
    }

    console.log(`Found ${items.length} workspace items`);
    return items.sort((a, b) => new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime());
  } catch (error) {
    console.error("Error fetching workspace items:", error);
    throw error;
  }
}

// Get all databases user has access to
export async function getAllDatabases(): Promise<NotionDatabase[]> {
  validateConfig();
  try {
    console.log("Fetching all databases...");

    const response = await notion.search({
      filter: {
        property: "object",
        value: "database",
      },
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 100,
    });

    const databases: NotionDatabase[] = [];

    for (const result of response.results) {
      if ("properties" in result) {
        const database = result as DatabaseObjectResponse;
        
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
          properties: database.properties,
          parent: database.parent,
        });
      }
    }

    console.log(`Found ${databases.length} databases`);
    return databases;
  } catch (error) {
    console.error("Error fetching databases:", error);
    throw error;
  }
}

// Get pages from a specific database
export async function getDatabasePages(databaseId: string, limit = 20): Promise<NotionPage[]> {
  validateConfig();
  try {
    console.log("Fetching pages from database:", databaseId);

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

    const pages: NotionPage[] = [];

    for (const result of response.results) {
      if ("properties" in result) {
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
          parent: page.parent,
        });
      }
    }

    console.log(`Found ${pages.length} pages in database`);
    return pages;
  } catch (error) {
    console.error("Error fetching database pages:", error);
    throw error;
  }
}

// Get root workspace pages (pages not in databases or other pages)
export async function getRootPages(): Promise<NotionPage[]> {
  validateConfig();
  try {
    console.log("Fetching root workspace pages...");

    const response = await notion.search({
      filter: {
        property: "object",
        value: "page",
      },
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 100,
    });

    const rootPages: NotionPage[] = [];

    for (const result of response.results) {
      if ("properties" in result) {
        const page = result as PageObjectResponse;
        
        // Check if this is a root page (parent is workspace, not database or page)
        const isRootPage = page.parent.type === "workspace" || 
                          (page.parent.type === "page_id" && !page.parent.page_id);

        if (isRootPage) {
          rootPages.push({
            id: page.id,
            title: getPageTitle(page),
            icon: getIcon(page),
            cover: getCover(page),
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time,
            url: page.url,
            properties: page.properties,
            parent: page.parent,
          });
        }
      }
    }

    console.log(`Found ${rootPages.length} root pages`);
    return rootPages;
  } catch (error) {
    console.error("Error fetching root pages:", error);
    throw error;
  }
}

// Fetch a single page
export async function getNotionPage(pageId: string): Promise<NotionPage> {
  validateConfig();
  try {
    const page = (await notion.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;

    return {
      id: page.id,
      title: getPageTitle(page),
      icon: getIcon(page),
      cover: getCover(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
      properties: page.properties,
      parent: page.parent,
    };
  } catch (error) {
    console.error("Error fetching Notion page:", error);
    throw error;
  }
}

// Fetch a single database
export async function getNotionDatabase(databaseId: string): Promise<NotionDatabase> {
  validateConfig();
  try {
    const database = (await notion.databases.retrieve({
      database_id: databaseId,
    })) as DatabaseObjectResponse;

    let description = undefined;
    if (database.description && database.description.length > 0) {
      description = extractPlainText(database.description);
    }

    return {
      id: database.id,
      title: getDatabaseTitle(database),
      icon: getIcon(database),
      cover: getCover(database),
      createdTime: database.created_time,
      lastEditedTime: database.last_edited_time,
      url: database.url,
      description,
      properties: database.properties,
      parent: database.parent,
    };
  } catch (error) {
    console.error("Error fetching Notion database:", error);
    throw error;
  }
}

// Fetch blocks (content) of a page
export async function getNotionPageContent(pageId: string): Promise<NotionBlock[]> {
  validateConfig();
  try {
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined;

    do {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      });

      for (const block of response.results) {
        if ("type" in block) {
          const convertedBlock = convertBlock(block as BlockObjectResponse);

          // Recursively fetch children if they exist
          if (block.has_children) {
            convertedBlock.children = await getNotionPageContent(block.id);
          }

          blocks.push(convertedBlock);
        }
      }

      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);

    return blocks;
  } catch (error) {
    console.error("Error fetching Notion page content:", error);
    throw error;
  }
}

// Get subpages (child pages) of a page
export async function getNotionSubpages(parentPageId: string): Promise<NotionPage[]> {
  try {
    // Query children blocks and filter for child_page type
    const response = await notion.blocks.children.list({
      block_id: parentPageId,
      page_size: 100,
    });

    const subpages: NotionPage[] = [];

    for (const block of response.results) {
      if ("type" in block && block.type === "child_page") {
        // Fetch the full page details for each child page
        try {
          const page = await getNotionPage(block.id);
          subpages.push(page);
        } catch (error) {
          console.error(`Error fetching subpage ${block.id}:`, error);
        }
      }
    }

    return subpages;
  } catch (error) {
    console.error("Error fetching Notion subpages:", error);
    throw error;
  }
}

// Search across all content
export async function searchNotionContent(query: string): Promise<NotionWorkspaceItem[]> {
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

    const items: NotionWorkspaceItem[] = [];

    for (const result of response.results) {
      if ("properties" in result) {
        if (result.object === "page") {
          const page = result as PageObjectResponse;
          items.push({
            id: page.id,
            type: 'page',
            title: getPageTitle(page),
            icon: getIcon(page),
            lastEditedTime: page.last_edited_time,
            url: page.url,
            parent: page.parent,
          });
        } else if (result.object === "database") {
          const database = result as DatabaseObjectResponse;
          items.push({
            id: database.id,
            type: 'database',
            title: getDatabaseTitle(database),
            icon: getIcon(database),
            lastEditedTime: database.last_edited_time,
            url: database.url,
            parent: database.parent,
          });
        }
      }
    }

    return items;
  } catch (error) {
    console.error("Error searching Notion content:", error);
    throw error;
  }
}

// Create a new page in a database
export async function createNotionPageInDatabase(databaseId: string, title: string, content?: string): Promise<NotionPage> {
  validateConfig();
  try {
    const children: Parameters<typeof notion.pages.create>[0]["children"] = [];

    if (content) {
      // Split content by newlines and create paragraph blocks
      const lines = content.split("\n").filter(line => line.trim());
      for (const line of lines) {
        children.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: line } }],
          },
        });
      }
    }

    const page = (await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      children: children.length > 0 ? children : undefined,
    })) as PageObjectResponse;

    return {
      id: page.id,
      title: getPageTitle(page),
      icon: getIcon(page),
      cover: getCover(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
      parent: page.parent,
    };
  } catch (error) {
    console.error("Error creating Notion page:", error);
    throw error;
  }
}

// Create a new standalone page (not in database)
export async function createNotionPage(title: string, content?: string): Promise<NotionPage> {
  validateConfig();
  try {
    const children: Parameters<typeof notion.pages.create>[0]["children"] = [];

    if (content) {
      // Split content by newlines and create paragraph blocks
      const lines = content.split("\n").filter(line => line.trim());
      for (const line of lines) {
        children.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: line } }],
          },
        });
      }
    }

    // Create a standalone page (parent is workspace)
    const page = (await notion.pages.create({
      parent: { type: "workspace", workspace: true },
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      children: children.length > 0 ? children : undefined,
    })) as PageObjectResponse;

    return {
      id: page.id,
      title: getPageTitle(page),
      icon: getIcon(page),
      cover: getCover(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
      parent: page.parent,
    };
  } catch (error) {
    console.error("Error creating Notion page:", error);
    throw error;
  }
}

// Create a subpage (nested page inside another page)
export async function createNotionSubpage(parentPageId: string, title: string, content?: string): Promise<NotionPage> {
  try {
    const children: Parameters<typeof notion.pages.create>[0]["children"] = [];

    if (content) {
      // Split content by newlines and create paragraph blocks
      const lines = content.split("\n").filter(line => line.trim());
      for (const line of lines) {
        children.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: line } }],
          },
        });
      }
    }

    // Create page with parent as page_id instead of database_id
    const page = (await notion.pages.create({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      children: children.length > 0 ? children : undefined,
    })) as PageObjectResponse;

    return {
      id: page.id,
      title: getPageTitle(page),
      icon: getIcon(page),
      cover: getCover(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
      parent: page.parent,
    };
  } catch (error) {
    console.error("Error creating Notion subpage:", error);
    throw error;
  }
}

// Update a page title
export async function updateNotionPageTitle(pageId: string, title: string): Promise<NotionPage> {
  validateConfig();
  try {
    const page = (await notion.pages.update({
      page_id: pageId,
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
    })) as PageObjectResponse;

    return {
      id: page.id,
      title: getPageTitle(page),
      icon: getIcon(page),
      cover: getCover(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
      parent: page.parent,
    };
  } catch (error) {
    console.error("Error updating Notion page:", error);
    throw error;
  }
}

// Append content to a page
export async function appendToNotionPage(pageId: string, content: string): Promise<void> {
  validateConfig();
  try {
    const lines = content.split("\n").filter(line => line.trim());
    const children: Parameters<typeof notion.blocks.children.append>[0]["children"] = [];

    for (const line of lines) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: line } }],
        },
      });
    }

    if (children.length > 0) {
      await notion.blocks.children.append({
        block_id: pageId,
        children,
      });
    }
  } catch (error) {
    console.error("Error appending to Notion page:", error);
    throw error;
  }
}

// Update a specific block
export async function updateNotionBlock(blockId: string, content: string, blockType: string = "paragraph"): Promise<void> {
  validateConfig();
  try {
    const richText = [{ type: "text", text: { content } }];

    // Build the update body based on block type
    const body: Record<string, unknown> = {};

    switch (blockType) {
      case "paragraph":
        body.paragraph = { rich_text: richText };
        break;
      case "heading_1":
        body.heading_1 = { rich_text: richText };
        break;
      case "heading_2":
        body.heading_2 = { rich_text: richText };
        break;
      case "heading_3":
        body.heading_3 = { rich_text: richText };
        break;
      case "bulleted_list_item":
        body.bulleted_list_item = { rich_text: richText };
        break;
      case "numbered_list_item":
        body.numbered_list_item = { rich_text: richText };
        break;
      case "quote":
        body.quote = { rich_text: richText };
        break;
      default:
        body.paragraph = { rich_text: richText };
    }

    // Use raw request to update block (bypassing SDK type issues)
    await notion.request({
      path: `blocks/${blockId}`,
      method: "patch",
      body,
    });
  } catch (error) {
    console.error("Error updating Notion block:", error);
    throw error;
  }
}

// Delete a block
export async function deleteNotionBlock(blockId: string): Promise<void> {
  validateConfig();
  try {
    await notion.blocks.delete({ block_id: blockId });
  } catch (error) {
    console.error("Error deleting Notion block:", error);
    throw error;
  }
}

// Archive (soft delete) a page
export async function archiveNotionPage(pageId: string): Promise<void> {
  validateConfig();
  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
  } catch (error) {
    console.error("Error archiving Notion page:", error);
    throw error;
  }
}