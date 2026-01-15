import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  refreshAccessToken,
  GoogleTokens,
  CalendarEvent,
} from "@/lib/google-calendar";

async function getValidTokens(): Promise<GoogleTokens | null> {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get("google_tokens");

  if (!tokensCookie) {
    return null;
  }

  try {
    const tokens: GoogleTokens = JSON.parse(tokensCookie.value);

    // Check if token is expired (with 5 min buffer)
    if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
      if (!tokens.refresh_token) {
        return null;
      }

      // Refresh the token
      const newTokens = await refreshAccessToken(tokens.refresh_token);

      // Update the cookie with new tokens
      // Note: We can't set cookies in API routes that return JSON
      // The client should handle token refresh
      return newTokens;
    }

    return tokens;
  } catch {
    return null;
  }
}

// GET - List calendar events
export async function GET(request: Request) {
  const tokens = await getValidTokens();

  if (!tokens) {
    return NextResponse.json({ error: "Not authenticated", needsAuth: true }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get("timeMin") || new Date().toISOString();
  const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const events = await getCalendarEvents(tokens.access_token, timeMin, timeMax);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST - Create calendar event
export async function POST(request: Request) {
  const tokens = await getValidTokens();

  if (!tokens) {
    return NextResponse.json({ error: "Not authenticated", needsAuth: true }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { summary, description, date, time, reminderMinutes } = body;

    if (!summary || !date || !time) {
      return NextResponse.json(
        { error: "Summary, date, and time are required" },
        { status: 400 }
      );
    }

    // Parse date and time
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const event: CalendarEvent = {
      summary,
      description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    // Add reminder if specified
    if (reminderMinutes !== undefined && reminderMinutes >= 0) {
      event.reminders = {
        useDefault: false,
        overrides: [{ method: "popup", minutes: reminderMinutes }],
      };
    }

    const createdEvent = await createCalendarEvent(tokens.access_token, event);
    return NextResponse.json({ event: createdEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create event" },
      { status: 500 }
    );
  }
}

// DELETE - Delete calendar event
export async function DELETE(request: Request) {
  const tokens = await getValidTokens();

  if (!tokens) {
    return NextResponse.json({ error: "Not authenticated", needsAuth: true }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  try {
    await deleteCalendarEvent(tokens.access_token, eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete event" },
      { status: 500 }
    );
  }
}
