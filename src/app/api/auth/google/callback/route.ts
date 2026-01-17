import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, getGoogleUserInfo, GoogleAccountsStore, GoogleAccountTokens } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Parse state parameter (now contains JSON with returnUrl and addAccount)
  let returnUrl = "/";
  let isAddingAccount = false;

  if (state) {
    try {
      const stateData = JSON.parse(decodeURIComponent(state));
      returnUrl = stateData.returnUrl || "/";
      isAddingAccount = stateData.addAccount || false;
    } catch {
      // Fallback for old-style state (just the returnUrl)
      returnUrl = decodeURIComponent(state);
    }
  }

  if (error) {
    const errorUrl = returnUrl.includes("?")
      ? `${returnUrl}&auth_error=${error}`
      : `${returnUrl}?auth_error=${error}`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }

  if (!code) {
    const errorUrl = returnUrl.includes("?")
      ? `${returnUrl}&auth_error=no_code`
      : `${returnUrl}?auth_error=no_code`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Fetch user info to get email for multi-account storage
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // Create account tokens with user info
    const accountTokens: GoogleAccountTokens = {
      ...tokens,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };

    // Read existing accounts store
    const cookieStore = await cookies();
    const existingAccountsCookie = cookieStore.get("google_accounts");

    let accountsStore: GoogleAccountsStore;

    if (existingAccountsCookie) {
      try {
        accountsStore = JSON.parse(existingAccountsCookie.value);
      } catch {
        accountsStore = { accounts: {} };
      }
    } else {
      accountsStore = { accounts: {} };
    }

    // Add or update the account
    accountsStore.accounts[userInfo.email] = accountTokens;

    // Set primary account if this is the first account or if not adding
    if (!accountsStore.primaryAccount || !isAddingAccount) {
      accountsStore.primaryAccount = userInfo.email;
    }

    // Redirect back to the original page or home
    const successUrl = returnUrl.includes("?")
      ? `${returnUrl}&auth_success=true`
      : `${returnUrl}?auth_success=true`;
    const response = NextResponse.redirect(new URL(successUrl, request.url));

    // Store multi-account data
    response.cookies.set("google_accounts", JSON.stringify(accountsStore), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Also maintain backward compatibility with single account cookie
    // (for calendar, drive, contacts that still use google_tokens)
    response.cookies.set("google_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    const errorUrl = returnUrl.includes("?")
      ? `${returnUrl}&auth_error=token_exchange_failed`
      : `${returnUrl}?auth_error=token_exchange_failed`;
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}
