import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleTokens } from "@/lib/google-calendar";

export async function GET() {
  const cookieStore = await cookies();
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
