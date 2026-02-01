import { NextResponse } from "next/server";
import {
  getPlaybackStateCookie,
  playCookie,
  pauseCookie,
  skipToNextCookie,
  skipToPreviousCookie,
  setVolumeCookie,
  setShuffleCookie,
  setRepeatCookie,
  seekCookie,
  getDevicesCookie,
  transferPlaybackCookie,
} from "@/lib/spotify-cookies";

// GET: Get current playback state
export async function GET() {
  try {
    const [playbackState, devices] = await Promise.all([
      getPlaybackStateCookie(),
      getDevicesCookie(),
    ]);

    return NextResponse.json({ playback: playbackState, devices });
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
    const body = await request.json();
    const { action, ...params } = body;

    let result;
    switch (action) {
      case "play":
        result = await playCookie(params.context_uri, params.uris);
        break;
      case "pause":
        result = await pauseCookie();
        break;
      case "next":
        result = await skipToNextCookie();
        break;
      case "previous":
        result = await skipToPreviousCookie();
        break;
      case "volume":
        result = await setVolumeCookie(params.volume);
        break;
      case "shuffle":
        result = await setShuffleCookie(params.state);
        break;
      case "repeat":
        result = await setRepeatCookie(params.state);
        break;
      case "seek":
        result = await seekCookie(params.position_ms);
        break;
      case "transfer":
        result = await transferPlaybackCookie(params.device_id, params.play);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: "Spotify API error", status: result.status },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error controlling playback:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to control playback" },
      { status: 500 }
    );
  }
}
