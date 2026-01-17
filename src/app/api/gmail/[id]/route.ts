import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleAccountsStore, GoogleTokens } from "@/lib/google-calendar";
import { getFullEmail } from "@/lib/google-services";

// Helper to get valid access token
async function getAccessToken(account?: string): Promise<{ token: string; email: string } | null> {
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
          return { token: refreshed.access_token, email: targetEmail };
        }
        return { token: targetAccount.access_token, email: targetEmail };
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
      return { token: tokens.access_token, email: "unknown" };
    } catch {
      // Fall through
    }
  }

  return null;
}

// GET - Get full email content
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const account = searchParams.get("account") || undefined;

    const auth = await getAccessToken(account);
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = await getFullEmail(auth.token, id);

    return NextResponse.json({ email, account: auth.email });
  } catch (error) {
    console.error("Error getting email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get email" },
      { status: 500 }
    );
  }
}
