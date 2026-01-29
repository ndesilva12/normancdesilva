// Jimmy's independent Gmail authentication system
// Uses Norman's existing OAuth app but manages tokens separately

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Jimmy's required Gmail scopes
const JIMMY_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send", 
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/contacts.readonly",
];

export interface JimmyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  email: string;
}

// Get Jimmy's stored refresh token from environment
function getStoredRefreshToken(): string | null {
  return process.env.JIMMY_GMAIL_REFRESH_TOKEN || null;
}

// Get Jimmy's associated email from environment
function getStoredEmail(): string | null {
  return process.env.JIMMY_GMAIL_EMAIL || null;
}

// Refresh Jimmy's access token
export async function refreshJimmyToken(): Promise<JimmyTokens> {
  const refreshToken = getStoredRefreshToken();
  const email = getStoredEmail();
  
  if (!refreshToken) {
    throw new Error("Jimmy not authenticated. Need to run initial auth setup.");
  }
  
  if (!email) {
    throw new Error("Jimmy email not configured. Need to run initial auth setup.");
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Jimmy's token: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Keep original refresh token
    expires_at: Date.now() + data.expires_in * 1000,
    email: email,
  };
}

// Get valid access token for Jimmy (auto-refresh if needed)
export async function getJimmyAccessToken(): Promise<{ token: string; email: string }> {
  const refreshToken = getStoredRefreshToken();
  const email = getStoredEmail();
  
  if (!refreshToken || !email) {
    throw new Error("Jimmy not authenticated. Run initial setup first.");
  }

  // For now, always refresh to get a fresh token
  // Later we can add expiration checking and conditional refresh
  try {
    const tokens = await refreshJimmyToken();
    return {
      token: tokens.access_token,
      email: tokens.email,
    };
  } catch (error) {
    throw new Error(`Jimmy authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate authorization URL for Jimmy's initial setup
export function getJimmyAuthUrl(baseUrl: string): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Client ID not configured");
  }

  const redirectUri = `${baseUrl}/api/jimmy-auth/callback`;
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: JIMMY_SCOPES.join(" "),
    access_type: "offline", // This ensures we get a refresh token
    prompt: "consent", // Force consent screen to ensure refresh token
    state: "jimmy-auth-setup",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<JimmyTokens> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const data = await response.json();

  if (!data.refresh_token) {
    throw new Error("No refresh token received. Need to revoke app access and try again.");
  }

  // Get user email
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${data.access_token}`,
    },
  });

  const userData = await userResponse.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    email: userData.email,
  };
}