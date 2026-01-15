import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SpotifyTokens, refreshAccessToken, search, addToQueue } from "@/lib/spotify";

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

// GET: Search for tracks
export async function GET(request: Request) {
  try {
    const result = await getValidAccessToken();
    if (!result) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "track";

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const types = type.split(",") as ("track" | "album" | "artist" | "playlist")[];
    const results = await search(result.token, query, types, 20);

    const response = NextResponse.json(results);

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
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search" },
      { status: 500 }
    );
  }
}

// POST: Add to queue
export async function POST(request: Request) {
  try {
    const result = await getValidAccessToken();
    if (!result) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { uri } = body;

    if (!uri) {
      return NextResponse.json({ error: "URI required" }, { status: 400 });
    }

    await addToQueue(result.token, uri);

    const response = NextResponse.json({ success: true });

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
    console.error("Error adding to queue:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add to queue" },
      { status: 500 }
    );
  }
}
