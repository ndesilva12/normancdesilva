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
export async function getRecentEmails(accessToken: string, limit: number = 10): Promise<EmailPreview[]> {
  // First, get the list of message IDs
  const listResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}`,
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
