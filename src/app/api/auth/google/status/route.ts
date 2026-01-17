import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleTokens, GoogleAccountsStore } from "@/lib/google-calendar";

export async function GET() {
  const cookieStore = await cookies();

  // Check multi-account cookie first
  const accountsCookie = cookieStore.get("google_accounts");
  if (accountsCookie) {
    try {
      const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);
      const accountEmails = Object.keys(accountsStore.accounts);

      if (accountEmails.length > 0) {
        // Check if primary account token is valid
        const primaryEmail = accountsStore.primaryAccount || accountEmails[0];
        const primaryAccount = accountsStore.accounts[primaryEmail];

        if (primaryAccount.expires_at < Date.now() + 5 * 60 * 1000) {
          if (!primaryAccount.refresh_token) {
            return NextResponse.json({
              connected: true,
              authenticated: false,
              reason: "token_expired",
              accountCount: accountEmails.length,
            });
          }

          // Try to refresh
          try {
            const newTokens = await refreshAccessToken(primaryAccount.refresh_token);
            accountsStore.accounts[primaryEmail] = { ...primaryAccount, ...newTokens };

            const response = NextResponse.json({
              connected: true,
              authenticated: true,
              accountCount: accountEmails.length,
            });

            response.cookies.set("google_accounts", JSON.stringify(accountsStore), {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
              path: "/",
            });

            // Also update legacy cookie
            response.cookies.set("google_tokens", JSON.stringify(newTokens), {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 60 * 24 * 30,
              path: "/",
            });

            return response;
          } catch {
            return NextResponse.json({
              connected: true,
              authenticated: false,
              reason: "refresh_failed",
              accountCount: accountEmails.length,
            });
          }
        }

        return NextResponse.json({
          connected: true,
          authenticated: true,
          accountCount: accountEmails.length,
        });
      }
    } catch {
      // Fall through to legacy cookie check
    }
  }

  // Fallback to legacy single-account cookie
  const tokensCookie = cookieStore.get("google_tokens");

  if (!tokensCookie) {
    return NextResponse.json({ connected: false, authenticated: false });
  }

  try {
    const tokens: GoogleTokens = JSON.parse(tokensCookie.value);

    // Check if token is expired
    if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
      if (!tokens.refresh_token) {
        return NextResponse.json({ connected: false, authenticated: false, reason: "token_expired" });
      }

      // Try to refresh
      try {
        const newTokens = await refreshAccessToken(tokens.refresh_token);

        // Update cookie
        const response = NextResponse.json({ connected: true, authenticated: true });
        response.cookies.set("google_tokens", JSON.stringify(newTokens), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
        return response;
      } catch {
        return NextResponse.json({ connected: false, authenticated: false, reason: "refresh_failed" });
      }
    }

    return NextResponse.json({ connected: true, authenticated: true });
  } catch {
    return NextResponse.json({ connected: false, authenticated: false, reason: "invalid_token" });
  }
}

// POST - Logout (clear tokens)
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("google_tokens");
  return response;
}
