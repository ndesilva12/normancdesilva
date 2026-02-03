import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCalendarList,
  refreshAccessToken,
  GoogleTokens,
  CalendarListEntry,
} from "@/lib/google-calendar";

// GET - List all calendars the user has access to
export async function GET() {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get("google_tokens");

  if (!tokensCookie) {
    return NextResponse.json(
      { error: "Not authenticated", needsAuth: true },
      { status: 401 }
    );
  }

  try {
    let tokens: GoogleTokens = JSON.parse(tokensCookie.value);

    // Check if token is expired (with 5 min buffer) and refresh if needed
    if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
      if (!tokens.refresh_token) {
        return NextResponse.json(
          { error: "Token expired", needsAuth: true },
          { status: 401 }
        );
      }
      tokens = await refreshAccessToken(tokens.refresh_token);
    }

    const calendars = await getCalendarList(tokens.access_token);

    // Sort: primary first, then alphabetically
    calendars.sort((a: CalendarListEntry, b: CalendarListEntry) => {
      if (a.primary) return -1;
      if (b.primary) return 1;
      return (a.summary || "").localeCompare(b.summary || "");
    });

    return NextResponse.json(
      { calendars },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching calendar list:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch calendars" },
      { status: 500 }
    );
  }
}
