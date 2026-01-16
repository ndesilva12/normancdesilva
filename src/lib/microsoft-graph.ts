// Microsoft Graph OAuth and API utilities (OneNote)

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || "common";
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || "http://localhost:3000/api/auth/microsoft/callback";

const SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "Notes.Read",
];

export interface MicrosoftTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface OneNoteNotebook {
  id: string;
  displayName: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  links?: {
    oneNoteClientUrl?: { href: string };
    oneNoteWebUrl?: { href: string };
  };
}

export interface OneNoteSection {
  id: string;
  displayName: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  links?: {
    oneNoteClientUrl?: { href: string };
    oneNoteWebUrl?: { href: string };
  };
}

export interface OneNotePage {
  id: string;
  title: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  links?: {
    oneNoteClientUrl?: { href: string };
    oneNoteWebUrl?: { href: string };
  };
  parentSection?: {
    id: string;
    displayName: string;
  };
}

// Generate OAuth URL for user authorization
export function getMicrosoftAuthUrl(): string {
  if (!MICROSOFT_CLIENT_ID) {
    throw new Error("Microsoft Client ID not configured");
  }

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    redirect_uri: MICROSOFT_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    response_mode: "query",
  });

  return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeMicrosoftCodeForTokens(code: string): Promise<MicrosoftTokens> {
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: MICROSOFT_REDIRECT_URI,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

// Refresh access token
export async function refreshMicrosoftAccessToken(refreshToken: string): Promise<MicrosoftTokens> {
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
    throw new Error("Microsoft OAuth credentials not configured");
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

// Get recent OneNote pages
export async function getRecentOneNotePages(accessToken: string, limit: number = 10): Promise<OneNotePage[]> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/onenote/pages?$orderby=lastModifiedDateTime desc&$top=${limit}&$expand=parentSection($select=id,displayName)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to get OneNote pages (${response.status})`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || errorData.error?.code || errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.value || [];
}

// Get all notebooks
export async function getOneNoteNotebooks(accessToken: string): Promise<OneNoteNotebook[]> {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/onenote/notebooks?$orderby=lastModifiedDateTime desc",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get notebooks: ${error}`);
  }

  const data = await response.json();
  return data.value || [];
}

// Get sections in a notebook
export async function getOneNoteSections(accessToken: string, notebookId: string): Promise<OneNoteSection[]> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/onenote/notebooks/${notebookId}/sections`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get sections: ${error}`);
  }

  const data = await response.json();
  return data.value || [];
}

// Get pages in a section
export async function getOneNotePagesBySection(accessToken: string, sectionId: string): Promise<OneNotePage[]> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages?$orderby=lastModifiedDateTime desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get pages: ${error}`);
  }

  const data = await response.json();
  return data.value || [];
}
