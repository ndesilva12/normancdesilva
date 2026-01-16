import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Decode return URL from state parameter
  const returnUrl = state ? decodeURIComponent(state) : "/";

  if (error) {
    // Redirect back with error
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

    // Redirect back to the original page or home
    const successUrl = returnUrl.includes("?")
      ? `${returnUrl}&auth_success=true`
      : `${returnUrl}?auth_success=true`;
    const response = NextResponse.redirect(new URL(successUrl, request.url));

    // Store tokens in a secure HTTP-only cookie
    response.cookies.set("google_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
