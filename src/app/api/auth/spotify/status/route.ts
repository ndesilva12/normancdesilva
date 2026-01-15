import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, SpotifyTokens } from "@/lib/spotify";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get("spotify_tokens");

    if (!tokensCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const tokens: SpotifyTokens = JSON.parse(tokensCookie.value);

    // Check if token is expired or about to expire (within 5 minutes)
    if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
      if (!tokens.refresh_token) {
        return NextResponse.json({ authenticated: false, reason: "no_refresh_token" });
      }

      try {
        const newTokens = await refreshAccessToken(tokens.refresh_token);

        const response = NextResponse.json({ authenticated: true });
        response.cookies.set("spotify_tokens", JSON.stringify(newTokens), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });

        return response;
      } catch {
        return NextResponse.json({ authenticated: false, reason: "refresh_failed" });
      }
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Error checking Spotify auth status:", error);
    return NextResponse.json({ authenticated: false, reason: "error" });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("spotify_tokens");
  return response;
}
