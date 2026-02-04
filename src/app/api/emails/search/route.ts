import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleAccountsStore, GoogleTokens } from "@/lib/google-calendar";

// Helper to get valid access token
async function getAccessToken(account?: string): Promise<string | null> {
  const cookieStore = await cookies();

  // Try multi-account cookie first
  const accountsCookie = cookieStore.get("google_accounts");
  if (accountsCookie) {
    try {
      const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);
      const targetEmail = account || accountsStore.primaryAccount || Object.keys(accountsStore.accounts)[0];
      const targetAccount = accountsStore.accounts[targetEmail];

      if (targetAccount) {
        // Refresh if needed
        if (targetAccount.expires_at < Date.now() + 60 * 1000 && targetAccount.refresh_token) {
          const refreshed = await refreshAccessToken(targetAccount.refresh_token);
          return refreshed.access_token;
        }
        return targetAccount.access_token;
      }
    } catch {
      // Fall through
    }
  }

  // Fallback to legacy token
  const tokensCookie = cookieStore.get("google_tokens");
  if (tokensCookie) {
    try {
      let tokens: GoogleTokens = JSON.parse(tokensCookie.value);
      if (tokens.expires_at < Date.now() + 60 * 1000 && tokens.refresh_token) {
        tokens = await refreshAccessToken(tokens.refresh_token);
      }
      return tokens.access_token;
    } catch {
      // Fall through
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const maxResults = parseInt(searchParams.get("maxResults") || "50");
    const account = searchParams.get("account") || undefined;

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken(account);
    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Search emails directly here
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      q: query,
    });

    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listResponse.ok) {
      const error = await listResponse.text();
      throw new Error(`Failed to search emails: ${error}`);
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    if (messageIds.length === 0) {
      return NextResponse.json({ messages: [], count: 0 });
    }

    // Fetch details for each message
    const emailPromises = messageIds.map(async (msg: { id: string }) => {
      const detailResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!detailResponse.ok) return null;

      const detail = await detailResponse.json();
      const headers = detail.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      const parseAddresses = (headerValue: string): string[] => {
        if (!headerValue) return [];
        return headerValue
          .split(",")
          .map(addr => {
            const match = addr.match(/<(.+?)>/);
            return match ? match[1] : addr.trim();
          })
          .filter(Boolean);
      };

      return {
        id: detail.id,
        subject: getHeader("Subject") || "(No subject)",
        snippet: detail.snippet,
        date: new Date(parseInt(detail.internalDate)).toISOString(),
        from: getHeader("From"),
        to: parseAddresses(getHeader("To")),
        cc: parseAddresses(getHeader("Cc")),
      };
    });

    const messages = (await Promise.all(emailPromises)).filter(Boolean);
    return NextResponse.json({ messages, count: messages.length });
  } catch (error: any) {
    console.error("Email search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search emails" },
      { status: 500 }
    );
  }
}
