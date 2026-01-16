import { Client } from "@notionhq/client";
import {
  PageObjectResponse,
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

export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Validation helper
function validateConfig() {
  if (!NOTION_TOKEN) {
    throw new Error("NOTION_API_KEY environment variable is not set. Please add it to your Vercel environment variables.");
  }
  if (!NOTION_DATABASE_ID) {
    throw new Error("NOTION_DATABASE_ID environment variable is not set. Please add it to your Vercel environment variables.");
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
}

export interface NotionBlock {
  id: string;
  type: string;
  content: string;
  hasChildren: boolean;
  children?: NotionBlock[];
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

// Helper to get page icon
function getPageIcon(page: PageObjectResponse): string | undefined {
  if (!page.icon) return undefined;
  if (page.icon.type === "emoji") return page.icon.emoji;
  if (page.icon.type === "external") return page.icon.external.url;
  if (page.icon.type === "file") return page.icon.file.url;
  return undefined;
}

// Helper to get page cover
function getPageCover(page: PageObjectResponse): string | undefined {
  if (!page.cover) return undefined;
  if (page.cover.type === "external") return page.cover.external.url;
  if (page.cover.type === "file") return page.cover.file.url;
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

// Fetch all pages from database
export async function getNotionPages(limit = 20): Promise<NotionPage[]> {
  validateConfig();
  try {
    // Use raw request to query database (bypassing SDK type issues)
    const response = await notion.request<{
      results: PageObjectResponse[];
      has_more: boolean;
      next_cursor: string | null;
    }>({
      path: `databases/${NOTION_DATABASE_ID!}/query`,
      method: "post",
      body: {
        page_size: limit,
        sorts: [
          {
            timestamp: "last_edited_time",
            direction: "descending",
          },
        ],
      },
    });

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => ({
        id: page.id,
        title: getPageTitle(page),
        icon: getPageIcon(page),
        cover: getPageCover(page),
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        url: page.url,
        properties: page.properties,
      }));
  } catch (error) {
    console.error("Error fetching Notion pages:", error);
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
      icon: getPageIcon(page),
      cover: getPageCover(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
      properties: page.properties,
    };
  } catch (error) {
    console.error("Error fetching Notion page:", error);
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

// Create a new page in the database
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

    const page = (await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID! },
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
      icon: getPageIcon(page),
      cover: getPageCover(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
    };
  } catch (error) {
    console.error("Error creating Notion page:", error);
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
      icon: getPageIcon(page),
      cover: getPageCover(page),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
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

// Search pages
export async function searchNotionPages(query: string): Promise<NotionPage[]> {
  validateConfig();
  try {
    const response = await notion.search({
      query,
      filter: {
        property: "object",
        value: "page",
      },
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
      page_size: 20,
    });

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => ({
        id: page.id,
        title: getPageTitle(page),
        icon: getPageIcon(page),
        cover: getPageCover(page),
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        url: page.url,
      }));
  } catch (error) {
    console.error("Error searching Notion pages:", error);
    throw error;
  }
}
