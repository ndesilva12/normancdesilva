import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    // Redirect back to home with error
    return NextResponse.redirect(new URL("/?auth_error=" + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=no_code", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Create response that redirects to home
    const response = NextResponse.redirect(new URL("/?auth_success=true", request.url));

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
    return NextResponse.redirect(
      new URL("/?auth_error=token_exchange_failed", request.url)
    );
  }
}
