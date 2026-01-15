import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SpotifyTokens, refreshAccessToken, getPlaylists } from "@/lib/spotify";

async function getValidAccessToken(): Promise<{ token: string; newTokens?: SpotifyTokens } | null> {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get("spotify_tokens");

  if (!tokensCookie) {
    return null;
  }

  const tokens: SpotifyTokens = JSON.parse(tokensCookie.value);

  if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
    if (!tokens.refresh_token) {
      return null;
    }
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    return { token: newTokens.access_token, newTokens };
  }

  return { token: tokens.access_token };
}

export async function GET() {
  try {
    const result = await getValidAccessToken();
    if (!result) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const playlists = await getPlaylists(result.token, 50);

    const response = NextResponse.json({ playlists });

    if (result.newTokens) {
      response.cookies.set("spotify_tokens", JSON.stringify(result.newTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error getting playlists:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get playlists" },
      { status: 500 }
    );
  }
}
