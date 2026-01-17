import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleAccountsStore, GoogleAccountTokens } from "@/lib/google-calendar";
import { getRecentEmails, EmailPreview } from "@/lib/google-services";

// Extended email type with account info
interface EmailWithAccount extends EmailPreview {
  accountEmail: string;
  accountName?: string;
}

// Helper to refresh tokens if needed
async function getValidTokens(
  account: GoogleAccountTokens,
  accountsStore: GoogleAccountsStore
): Promise<{ tokens: GoogleAccountTokens; updated: boolean }> {
  if (account.expires_at > Date.now() + 60 * 1000) {
    return { tokens: account, updated: false };
  }

  if (!account.refresh_token) {
    throw new Error("Token expired and no refresh token available");
  }

  const refreshed = await refreshAccessToken(account.refresh_token);
  const updatedAccount = { ...account, ...refreshed };
  accountsStore.accounts[account.email] = updatedAccount;
  return { tokens: updatedAccount, updated: true };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const accountParam = searchParams.get("account"); // specific account email
    const all = searchParams.get("all") === "true"; // fetch from all accounts
    const searchQuery = searchParams.get("q") || undefined; // search query

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get("google_accounts");

    // Fallback to legacy single-account cookie
    if (!accountsCookie) {
      const tokensCookie = cookieStore.get("google_tokens");
      if (!tokensCookie) {
        return NextResponse.json({ error: "Not connected to Google" }, { status: 401 });
      }

      // Legacy single account handling
      let tokens = JSON.parse(tokensCookie.value);
      if (tokens.expires_at < Date.now() + 60 * 1000) {
        if (tokens.refresh_token) {
          tokens = await refreshAccessToken(tokens.refresh_token);
        } else {
          return NextResponse.json({ error: "Token expired" }, { status: 401 });
        }
      }

      const emails = await getRecentEmails(tokens.access_token, limit, searchQuery);
      const response = NextResponse.json({ emails, accounts: [] });

      if (tokens.expires_at > Date.now()) {
        response.cookies.set("google_tokens", JSON.stringify(tokens), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }

      return response;
    }

    // Multi-account handling
    const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);
    const accountEmails = Object.keys(accountsStore.accounts);

    if (accountEmails.length === 0) {
      return NextResponse.json({ error: "No accounts connected" }, { status: 401 });
    }

    let tokensUpdated = false;

    // Determine which accounts to fetch from
    let targetAccounts: string[];
    if (all) {
      targetAccounts = accountEmails;
    } else if (accountParam && accountsStore.accounts[accountParam]) {
      targetAccounts = [accountParam];
    } else if (accountsStore.primaryAccount && accountsStore.accounts[accountsStore.primaryAccount]) {
      targetAccounts = [accountsStore.primaryAccount];
    } else {
      targetAccounts = [accountEmails[0]];
    }

    // Fetch emails from all target accounts
    const emailsPromises = targetAccounts.map(async (email) => {
      const account = accountsStore.accounts[email];
      try {
        const { tokens, updated } = await getValidTokens(account, accountsStore);
        if (updated) tokensUpdated = true;

        const accountEmails = await getRecentEmails(
          tokens.access_token,
          all ? Math.ceil(limit / targetAccounts.length) : limit,
          searchQuery
        );

        // Add account info to each email
        return accountEmails.map((e) => ({
          ...e,
          accountEmail: email,
          accountName: account.name,
        })) as EmailWithAccount[];
      } catch (err) {
        console.error(`Failed to fetch emails for ${email}:`, err);
        return [] as EmailWithAccount[];
      }
    });

    const emailsArrays = await Promise.all(emailsPromises);
    let emails: EmailWithAccount[] = emailsArrays.flat();

    // Sort by date (most recent first) if fetching from multiple accounts
    if (all && emails.length > 0) {
      emails.sort((a, b) => parseInt(b.date) - parseInt(a.date));
      emails = emails.slice(0, limit);
    }

    // Build response
    const response = NextResponse.json({
      emails,
      accounts: accountEmails.map((email) => ({
        email,
        name: accountsStore.accounts[email].name,
        picture: accountsStore.accounts[email].picture,
      })),
      primaryAccount: accountsStore.primaryAccount,
      currentAccount: all ? "all" : targetAccounts[0],
    });

    // Update cookies if tokens were refreshed
    if (tokensUpdated) {
      response.cookies.set("google_accounts", JSON.stringify(accountsStore), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
