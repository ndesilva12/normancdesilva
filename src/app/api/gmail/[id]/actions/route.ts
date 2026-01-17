import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleAccountsStore, GoogleTokens } from "@/lib/google-calendar";
import {
  markEmailAsRead,
  markEmailAsUnread,
  archiveEmail,
  trashEmail,
  toggleStarEmail,
} from "@/lib/google-services";

type EmailAction = "read" | "unread" | "archive" | "trash" | "star" | "unstar";

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

// POST - Perform action on email
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, account } = body as { action: EmailAction; account?: string };

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const validActions: EmailAction[] = ["read", "unread", "archive", "trash", "star", "unstar"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken(account);
    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Perform the action
    switch (action) {
      case "read":
        await markEmailAsRead(accessToken, id);
        break;
      case "unread":
        await markEmailAsUnread(accessToken, id);
        break;
      case "archive":
        await archiveEmail(accessToken, id);
        break;
      case "trash":
        await trashEmail(accessToken, id);
        break;
      case "star":
        await toggleStarEmail(accessToken, id, true);
        break;
      case "unstar":
        await toggleStarEmail(accessToken, id, false);
        break;
    }

    return NextResponse.json({ success: true, action, messageId: id });
  } catch (error) {
    console.error("Error performing email action:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform action" },
      { status: 500 }
    );
  }
}
