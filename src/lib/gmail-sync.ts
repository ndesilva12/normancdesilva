// Gmail API integration for Relationship Intel

import { google } from "googleapis";
import { promises as fs } from "fs";
import { Interaction } from "@/types/relationship-intel";
import { generateSummary, isRelevantToProject } from "./clawdbot-ai";

const TOKEN_PATH = "/home/ubuntu/.config/google/token_norman_desilva_gmail_com.json";

interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  date: Date;
}

/**
 * Get authenticated Gmail client
 */
async function getGmailClient() {
  try {
    const tokenData = await fs.readFile(TOKEN_PATH, "utf-8");
    const tokens = JSON.parse(tokenData);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    return google.gmail({ version: "v1", auth: oauth2Client });
  } catch (error) {
    console.error("Failed to initialize Gmail client:", error);
    throw new Error("Gmail authentication failed");
  }
}

/**
 * Extract email address from Gmail format
 */
function extractEmail(emailString: string): string {
  const match = emailString.match(/<(.+?)>/);
  return match ? match[1] : emailString;
}

/**
 * Decode email body
 */
function decodeBody(body: any): string {
  if (!body) return "";

  let data = "";
  if (body.data) {
    data = body.data;
  } else if (body.parts) {
    // Multi-part message - get text/plain part
    const textPart = body.parts.find((part: any) =>
      part.mimeType === "text/plain" || part.mimeType === "text/html"
    );
    if (textPart && textPart.body && textPart.body.data) {
      data = textPart.body.data;
    }
  }

  if (data) {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  }

  return "";
}

/**
 * Parse Gmail message
 */
function parseMessage(message: any): GmailMessage {
  const headers = message.payload.headers;
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const from = extractEmail(getHeader("From"));
  const toHeader = getHeader("To");
  const ccHeader = getHeader("Cc");

  const to = toHeader
    ? toHeader.split(",").map((email: string) => extractEmail(email.trim()))
    : [];
  const cc = ccHeader
    ? ccHeader.split(",").map((email: string) => extractEmail(email.trim()))
    : [];

  const body = decodeBody(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    to,
    cc,
    subject: getHeader("Subject"),
    body,
    date: new Date(parseInt(message.internalDate)),
  };
}

/**
 * Sync Gmail for a project with AI filtering
 */
export async function syncGmailForProject(
  projectName: string,
  projectKeywords: string[],
  daysBack: number = 60,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Map<string, { contact: string; interactions: Interaction[] }>> {
  const gmail = await getGmailClient();
  const results = new Map<string, { contact: string; interactions: Interaction[] }>();

  // Calculate date for query
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - daysBack);
  const afterDateStr = afterDate.toISOString().split("T")[0].replace(/-/g, "/");

  // Build query - fetch all emails in timeframe (AI will filter later)
  const query = `after:${afterDateStr}`;

  onProgress?.(0, 100, "Fetching emails from Gmail...");

  // List messages
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 500, // Limit for performance
  });

  const messageIds = listResponse.data.messages || [];
  const totalMessages = messageIds.length;

  if (totalMessages === 0) {
    return results;
  }

  onProgress?.(10, 100, `Found ${totalMessages} emails. Analyzing relevance...`);

  // Fetch full messages in batches
  const batchSize = 10;
  const messages: GmailMessage[] = [];

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize);
    const batchMessages = await Promise.all(
      batch.map(async (msg) => {
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        });
        return parseMessage(fullMessage.data);
      })
    );

    messages.push(...batchMessages);

    const progress = 10 + Math.floor((i / messageIds.length) * 30);
    onProgress?.(progress, 100, `Processing emails (${i + batch.length}/${totalMessages})...`);
  }

  onProgress?.(40, 100, "Filtering emails with AI...");

  // Use AI to filter relevant emails
  const relevanceChecks = await Promise.all(
    messages.map(async (msg) => {
      const participants = [msg.from, ...msg.to, ...msg.cc].filter(Boolean);
      const relevance = await isRelevantToProject(
        "email",
        projectName,
        projectKeywords,
        msg.subject,
        msg.body,
        participants
      );
      return { message: msg, relevance };
    })
  );

  // Filter to only relevant emails with high confidence
  const relevantEmails = relevanceChecks.filter(
    ({ relevance }) => relevance.relevant && relevance.confidence >= 60
  );

  onProgress?.(70, 100, `Found ${relevantEmails.length} relevant emails. Generating summaries...`);

  // Process relevant emails
  for (let i = 0; i < relevantEmails.length; i++) {
    const { message } = relevantEmails[i];

    // Determine contact (sender if inbound, primary recipient if outbound)
    const myEmail = "norman.desilva@gmail.com"; // TODO: Get from auth
    const contact = message.from.toLowerCase() === myEmail.toLowerCase()
      ? message.to[0]
      : message.from;

    if (!contact) continue;

    // Generate AI summary
    const summary = await generateSummary("email", message.subject, message.body);

    // Create interaction
    const interaction: Interaction = {
      id: message.id,
      type: "email",
      date: message.date,
      subject: message.subject,
      summary,
      content: message.body,
      emailId: message.id,
      threadId: message.threadId,
      from: message.from,
      to: message.to,
      cc: message.cc,
    };

    // Add to results
    if (!results.has(contact)) {
      results.set(contact, { contact, interactions: [] });
    }
    results.get(contact)!.interactions.push(interaction);

    const progress = 70 + Math.floor((i / relevantEmails.length) * 30);
    onProgress?.(progress, 100, `Processing contact ${i + 1}/${relevantEmails.length}...`);
  }

  onProgress?.(100, 100, "Gmail sync complete!");

  return results;
}
