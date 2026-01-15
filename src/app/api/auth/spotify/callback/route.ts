import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/tools/spotify?auth_error=" + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/tools/spotify?auth_error=no_code", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    const response = NextResponse.redirect(new URL("/tools/spotify?auth_success=true", request.url));

    response.cookies.set("spotify_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Spotify OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/tools/spotify?auth_error=token_exchange_failed", request.url)
    );
  }
}
