import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SpotifyTokens,
  refreshAccessToken,
  getPlaybackState,
  play,
  pause,
  skipToNext,
  skipToPrevious,
  setVolume,
  setShuffle,
  setRepeat,
  seek,
  getDevices,
  transferPlayback,
} from "@/lib/spotify";

async function getValidAccessToken(): Promise<{ token: string; newTokens?: SpotifyTokens } | null> {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get("spotify_tokens");

  if (!tokensCookie) {
    return null;
  }

  const tokens: SpotifyTokens = JSON.parse(tokensCookie.value);

  // Check if token needs refresh
  if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
    if (!tokens.refresh_token) {
      return null;
    }
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    return { token: newTokens.access_token, newTokens };
  }

  return { token: tokens.access_token };
}

// GET: Get current playback state
export async function GET() {
  try {
    const result = await getValidAccessToken();
    if (!result) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [playbackState, devices] = await Promise.all([
      getPlaybackState(result.token),
      getDevices(result.token),
    ]);

    const response = NextResponse.json({ playback: playbackState, devices });

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
    console.error("Error getting playback state:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get playback state" },
      { status: 500 }
    );
  }
}

// POST: Control playback
export async function POST(request: Request) {
  try {
    const result = await getValidAccessToken();
    if (!result) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "play":
        await play(result.token, params);
        break;
      case "pause":
        await pause(result.token);
        break;
      case "next":
        await skipToNext(result.token);
        break;
      case "previous":
        await skipToPrevious(result.token);
        break;
      case "volume":
        await setVolume(result.token, params.volume);
        break;
      case "shuffle":
        await setShuffle(result.token, params.state);
        break;
      case "repeat":
        await setRepeat(result.token, params.state);
        break;
      case "seek":
        await seek(result.token, params.position_ms);
        break;
      case "transfer":
        await transferPlayback(result.token, params.device_id, params.play);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

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
    console.error("Error controlling playback:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to control playback" },
      { status: 500 }
    );
  }
}
