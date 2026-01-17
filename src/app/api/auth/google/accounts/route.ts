import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleAccountsStore, GoogleTokens, getGoogleUserInfo } from "@/lib/google-calendar";

// GET - List all connected accounts
export async function GET() {
  const cookieStore = await cookies();
  const accountsCookie = cookieStore.get("google_accounts");

  // Check for new multi-account cookie first
  if (accountsCookie) {
    try {
      const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);

      // Return account info without tokens (for security)
      const accounts = Object.entries(accountsStore.accounts).map(([email, account]) => ({
        email,
        name: account.name,
        picture: account.picture,
        isExpired: account.expires_at < Date.now(),
      }));

      return NextResponse.json({
        accounts,
        primaryAccount: accountsStore.primaryAccount,
        connected: accounts.length > 0,
      });
    } catch {
      // Fall through to legacy check
    }
  }

  // Fallback: Check for legacy single-account cookie and migrate it
  const legacyTokensCookie = cookieStore.get("google_tokens");
  if (legacyTokensCookie) {
    try {
      const tokens: GoogleTokens = JSON.parse(legacyTokensCookie.value);

      // Try to get user info to populate the account
      let email = "connected@google.com"; // Fallback
      let name: string | undefined;
      let picture: string | undefined;

      // Refresh token if needed
      let validTokens = tokens;
      if (tokens.expires_at < Date.now() + 60 * 1000 && tokens.refresh_token) {
        try {
          validTokens = await refreshAccessToken(tokens.refresh_token);
        } catch {
          // Continue with possibly expired token
        }
      }

      // Try to fetch user info
      try {
        const userInfo = await getGoogleUserInfo(validTokens.access_token);
        email = userInfo.email;
        name = userInfo.name;
        picture = userInfo.picture;
      } catch {
        // Use fallback email
      }

      // Migrate to new format
      const accountsStore: GoogleAccountsStore = {
        accounts: {
          [email]: {
            ...validTokens,
            email,
            name,
            picture,
          },
        },
        primaryAccount: email,
      };

      const response = NextResponse.json({
        accounts: [{
          email,
          name,
          picture,
          isExpired: validTokens.expires_at < Date.now(),
        }],
        primaryAccount: email,
        connected: true,
        migrated: true, // Indicate this was migrated from legacy
      });

      // Save the migrated data
      response.cookies.set("google_accounts", JSON.stringify(accountsStore), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return response;
    } catch {
      // Fall through to no accounts
    }
  }

  return NextResponse.json({
    accounts: [],
    primaryAccount: null,
    connected: false
  });
}

// POST - Set primary account
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get("google_accounts");

    if (!accountsCookie) {
      return NextResponse.json({ error: "No accounts connected" }, { status: 404 });
    }

    const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);

    if (!accountsStore.accounts[email]) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Update primary account
    accountsStore.primaryAccount = email;

    // Also update the legacy google_tokens cookie for backward compatibility
    const primaryTokens = accountsStore.accounts[email];
    let updatedTokens = primaryTokens;

    // Refresh if expired
    if (primaryTokens.expires_at < Date.now() + 60 * 1000 && primaryTokens.refresh_token) {
      try {
        const refreshed = await refreshAccessToken(primaryTokens.refresh_token);
        updatedTokens = { ...primaryTokens, ...refreshed };
        accountsStore.accounts[email] = updatedTokens;
      } catch (err) {
        console.error("Failed to refresh token:", err);
      }
    }

    const response = NextResponse.json({ success: true, primaryAccount: email });

    response.cookies.set("google_accounts", JSON.stringify(accountsStore), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    response.cookies.set("google_tokens", JSON.stringify({
      access_token: updatedTokens.access_token,
      refresh_token: updatedTokens.refresh_token,
      expires_at: updatedTokens.expires_at,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error setting primary account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set primary account" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an account
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accountsCookie = cookieStore.get("google_accounts");

    if (!accountsCookie) {
      return NextResponse.json({ error: "No accounts connected" }, { status: 404 });
    }

    const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);

    if (!accountsStore.accounts[email]) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Remove the account
    delete accountsStore.accounts[email];

    // Update primary account if the removed one was primary
    const remainingEmails = Object.keys(accountsStore.accounts);
    if (accountsStore.primaryAccount === email) {
      accountsStore.primaryAccount = remainingEmails[0] || undefined;
    }

    const response = NextResponse.json({
      success: true,
      remainingAccounts: remainingEmails.length,
      primaryAccount: accountsStore.primaryAccount,
    });

    if (remainingEmails.length === 0) {
      // Clear all cookies if no accounts left
      response.cookies.delete("google_accounts");
      response.cookies.delete("google_tokens");
    } else {
      response.cookies.set("google_accounts", JSON.stringify(accountsStore), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      // Update legacy cookie to use new primary
      if (accountsStore.primaryAccount) {
        const primaryTokens = accountsStore.accounts[accountsStore.primaryAccount];
        response.cookies.set("google_tokens", JSON.stringify({
          access_token: primaryTokens.access_token,
          refresh_token: primaryTokens.refresh_token,
          expires_at: primaryTokens.expires_at,
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Error removing account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove account" },
      { status: 500 }
    );
  }
}
