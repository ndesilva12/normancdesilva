// Google Services API utilities (Drive, Gmail, Contacts)

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink?: string;
  modifiedTime: string;
  createdTime: string;
  owners?: { displayName: string; emailAddress: string }[];
  thumbnailLink?: string;
}

export interface GmailThread {
  id: string;
  historyId: string;
  snippet: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload?: {
    headers?: { name: string; value: string }[];
  };
  labelIds?: string[];
}

export interface EmailPreview {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
}

export interface GoogleContact {
  resourceName: string;
  etag: string;
  names?: { displayName: string; givenName?: string; familyName?: string }[];
  emailAddresses?: { value: string; type?: string }[];
  phoneNumbers?: { value: string; type?: string }[];
  photos?: { url: string }[];
  organizations?: { name: string; title?: string }[];
}

// Get recent Google Drive files (Docs, Sheets, Slides)
export async function getRecentDriveFiles(accessToken: string, limit: number = 10): Promise<DriveFile[]> {
  const mimeTypes = [
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
  ];

  const query = mimeTypes.map(m => `mimeType='${m}'`).join(" or ");

  const params = new URLSearchParams({
    q: query,
    orderBy: "modifiedTime desc",
    pageSize: limit.toString(),
    fields: "files(id,name,mimeType,webViewLink,iconLink,modifiedTime,createdTime,owners,thumbnailLink)",
  });

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Drive files: ${error}`);
  }

  const data = await response.json();
  return data.files || [];
}

// Get recent Gmail messages
export async function getRecentEmails(
  accessToken: string,
  limit: number = 10,
  query?: string
): Promise<EmailPreview[]> {
  // Build query - always filter to inbox unless searching
  // If no query provided, show only inbox (non-archived) emails
  const baseQuery = query ? query : "in:inbox";
  const params = new URLSearchParams({
    maxResults: limit.toString(),
    q: baseQuery,
  });

  // First, get the list of message IDs
  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!listResponse.ok) {
    const error = await listResponse.text();
    throw new Error(`Failed to get email list: ${error}`);
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];

  if (messages.length === 0) {
    return [];
  }

  // Fetch details for each message
  const emailPromises = messages.slice(0, limit).map(async (msg: { id: string }) => {
    const detailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!detailResponse.ok) {
      return null;
    }

    const detail: GmailMessage = await detailResponse.json();
    const headers = detail.payload?.headers || [];

    const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    return {
      id: detail.id,
      threadId: detail.threadId,
      subject: getHeader("Subject") || "(No subject)",
      from: getHeader("From"),
      snippet: detail.snippet,
      date: detail.internalDate,
      isUnread: detail.labelIds?.includes("UNREAD") || false,
    };
  });

  const emails = await Promise.all(emailPromises);
  return emails.filter((e): e is EmailPreview => e !== null);
}

// Get Google Contacts
export async function getGoogleContacts(accessToken: string, limit: number = 50): Promise<GoogleContact[]> {
  const params = new URLSearchParams({
    personFields: "names,emailAddresses,phoneNumbers,photos,organizations",
    pageSize: limit.toString(),
    sortOrder: "LAST_MODIFIED_DESCENDING",
  });

  const response = await fetch(
    `https://people.googleapis.com/v1/people/me/connections?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get contacts: ${error}`);
  }

  const data = await response.json();
  return data.connections || [];
}

// Search contacts
export async function searchGoogleContacts(accessToken: string, query: string, limit: number = 20): Promise<GoogleContact[]> {
  const params = new URLSearchParams({
    query,
    readMask: "names,emailAddresses,phoneNumbers,photos,organizations",
    pageSize: limit.toString(),
  });

  const response = await fetch(
    `https://people.googleapis.com/v1/people:searchContacts?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to search contacts: ${error}`);
  }

  const data = await response.json();
  return data.results?.map((r: { person: GoogleContact }) => r.person) || [];
}

// Helper to get file type label
export function getDriveFileType(mimeType: string): string {
  switch (mimeType) {
    case "application/vnd.google-apps.document":
      return "Doc";
    case "application/vnd.google-apps.spreadsheet":
      return "Sheet";
    case "application/vnd.google-apps.presentation":
      return "Slide";
    default:
      return "File";
  }
}

// Helper to get file type icon
export function getDriveFileIcon(mimeType: string): string {
  switch (mimeType) {
    case "application/vnd.google-apps.document":
      return "📄";
    case "application/vnd.google-apps.spreadsheet":
      return "📊";
    case "application/vnd.google-apps.presentation":
      return "📽️";
    default:
      return "📁";
  }
}

// Helper to format email sender
export function formatEmailSender(from: string): string {
  // Handle undefined/null/empty from field
  if (!from) return "Unknown Sender";
  
  // Extract name from "Name <email@example.com>" format
  const match = from.match(/^(.+?)\s*<.+>$/);
  if (match) {
    return match[1].replace(/"/g, "");
  }
  // If no name, extract just the email
  const emailMatch = from.match(/<(.+)>/);
  if (emailMatch) {
    return emailMatch[1];
  }
  return from;
}

// Build Superhuman URL for a thread
export function getSuperhumanUrl(threadId: string): string {
  return `https://mail.superhuman.com/thread/${threadId}`;
}

// ============================================
// Gmail Full Email & Actions
// ============================================

export interface FullEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  date: string;
  snippet: string;
  body: string;
  bodyHtml?: string;
  isUnread: boolean;
  isStarred: boolean;
  labels: string[];
  attachments: { filename: string; mimeType: string; size: number; attachmentId: string }[];
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyToMessageId?: string;
  threadId?: string;
}

// Helper to decode base64url
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return atob(base64);
  }
}

// Helper to extract body from email parts
function extractBody(payload: any): { text: string; html?: string } {
  let text = "";
  let html: string | undefined;

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/html") {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text = decodeBase64Url(part.body.data);
      } else if (part.mimeType === "text/html" && part.body?.data) {
        html = decodeBase64Url(part.body.data);
      } else if (part.parts) {
        const nested = extractBody(part);
        if (nested.text) text = nested.text;
        if (nested.html) html = nested.html;
      }
    }
  }

  return { text, html };
}

// Helper to extract attachments
function extractAttachments(payload: any): FullEmail["attachments"] {
  const attachments: FullEmail["attachments"] = [];

  function processPayload(p: any) {
    if (p.filename && p.body?.attachmentId) {
      attachments.push({
        filename: p.filename,
        mimeType: p.mimeType,
        size: p.body.size || 0,
        attachmentId: p.body.attachmentId,
      });
    }
    if (p.parts) {
      p.parts.forEach(processPayload);
    }
  }

  processPayload(payload);
  return attachments;
}

// Get full email content
export async function getFullEmail(accessToken: string, messageId: string): Promise<FullEmail> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get email: ${error}`);
  }

  const data = await response.json();
  const headers = data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const { text, html } = extractBody(data.payload);
  const attachments = extractAttachments(data.payload);

  return {
    id: data.id,
    threadId: data.threadId,
    subject: getHeader("Subject") || "(No subject)",
    from: getHeader("From"),
    to: getHeader("To"),
    cc: getHeader("Cc") || undefined,
    bcc: getHeader("Bcc") || undefined,
    date: data.internalDate,
    snippet: data.snippet,
    body: text || (html ? "See HTML content" : ""),
    bodyHtml: html,
    isUnread: data.labelIds?.includes("UNREAD") || false,
    isStarred: data.labelIds?.includes("STARRED") || false,
    labels: data.labelIds || [],
    attachments,
  };
}

// Mark email as read
export async function markEmailAsRead(accessToken: string, messageId: string): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["UNREAD"],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to mark as read: ${error}`);
  }
}

// Mark email as unread
export async function markEmailAsUnread(accessToken: string, messageId: string): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addLabelIds: ["UNREAD"],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to mark as unread: ${error}`);
  }
}

// Archive email (remove from inbox)
export async function archiveEmail(accessToken: string, messageId: string): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["INBOX"],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to archive: ${error}`);
  }
}

// Move email to trash
export async function trashEmail(accessToken: string, messageId: string): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to trash: ${error}`);
  }
}

// Star/unstar email
export async function toggleStarEmail(accessToken: string, messageId: string, star: boolean): Promise<void> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        star
          ? { addLabelIds: ["STARRED"] }
          : { removeLabelIds: ["STARRED"] }
      ),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to ${star ? "star" : "unstar"}: ${error}`);
  }
}

// Helper to create RFC 2822 email message
function createEmailMessage(params: SendEmailParams, fromEmail: string): string {
  const boundary = `boundary_${Date.now()}`;

  let message = "";
  message += `From: ${fromEmail}\r\n`;
  message += `To: ${params.to}\r\n`;
  if (params.cc) message += `Cc: ${params.cc}\r\n`;
  if (params.bcc) message += `Bcc: ${params.bcc}\r\n`;
  message += `Subject: ${params.subject}\r\n`;

  // Note: We rely on threadId for threading rather than In-Reply-To/References headers
  // The Gmail API handles threading automatically when threadId is provided in the request body

  message += `MIME-Version: 1.0\r\n`;
  message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
  message += `\r\n`;

  // Plain text version
  message += `--${boundary}\r\n`;
  message += `Content-Type: text/plain; charset="UTF-8"\r\n`;
  message += `\r\n`;
  message += `${params.body}\r\n`;

  // HTML version (simple conversion)
  message += `--${boundary}\r\n`;
  message += `Content-Type: text/html; charset="UTF-8"\r\n`;
  message += `\r\n`;
  message += `<html><body><p>${params.body.replace(/\n/g, "<br>")}</p></body></html>\r\n`;

  message += `--${boundary}--\r\n`;

  return message;
}

// Helper to encode to base64url
function encodeBase64Url(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Send email
export async function sendEmail(
  accessToken: string,
  params: SendEmailParams,
  fromEmail: string
): Promise<{ id: string; threadId: string }> {
  const rawMessage = createEmailMessage(params, fromEmail);
  const encodedMessage = encodeBase64Url(rawMessage);

  const body: any = { raw: encodedMessage };
  if (params.threadId) {
    body.threadId = params.threadId;
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  const data = await response.json();
  return { id: data.id, threadId: data.threadId };
}

// Note: Email search and calendar events are handled directly in API routes
// to avoid module resolution issues with token management
