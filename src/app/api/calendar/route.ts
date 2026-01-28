import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  refreshAccessToken,
  GoogleTokens,
  GoogleAccountsStore,
  CalendarEvent,
} from "@/lib/google-calendar";

interface AccountWithTokens {
  email: string;
  tokens: GoogleTokens;
}

// Get all connected accounts with valid tokens
async function getAllAccountTokens(): Promise<AccountWithTokens[]> {
  const cookieStore = await cookies();
  const accountsCookie = cookieStore.get("google_accounts");

  if (!accountsCookie) {
    // Fall back to legacy single account
    const tokensCookie = cookieStore.get("google_tokens");
    if (!tokensCookie) return [];

    try {
      const tokens: GoogleTokens = JSON.parse(tokensCookie.value);
      return [{ email: "primary", tokens }];
    } catch {
      return [];
    }
  }

  try {
    const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);
    const validAccounts: AccountWithTokens[] = [];

    for (const [email, account] of Object.entries(accountsStore.accounts)) {
      let tokens = account;

      // Check if token is expired (with 5 min buffer) and refresh if needed
      if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
        if (tokens.refresh_token) {
          try {
            const newTokens = await refreshAccessToken(tokens.refresh_token);
            tokens = { ...tokens, ...newTokens };
          } catch (error) {
            console.error(`Failed to refresh token for ${email}:`, error);
            continue; // Skip this account if refresh fails
          }
        } else {
          continue; // Skip expired accounts without refresh token
        }
      }

      validAccounts.push({ email, tokens });
    }

    return validAccounts;
  } catch {
    return [];
  }
}

// Get primary account tokens (for creating/deleting events)
async function getPrimaryAccountTokens(): Promise<GoogleTokens | null> {
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
      return newTokens;
    }

    return tokens;
  } catch {
    return null;
  }
}

// Extended event type with account info
interface CalendarEventWithAccount extends CalendarEvent {
  accountEmail?: string;
}

// GET - List calendar events from ALL connected accounts
export async function GET(request: Request) {
  const accounts = await getAllAccountTokens();

  if (accounts.length === 0) {
    return NextResponse.json({ error: "Not authenticated", needsAuth: true }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get("timeMin") || new Date().toISOString();
  const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Fetch events from all accounts in parallel
    const eventPromises = accounts.map(async (account) => {
      try {
        const events = await getCalendarEvents(account.tokens.access_token, timeMin, timeMax);
        // Add account email to each event for identification
        return events.map((event: CalendarEventWithAccount) => ({
          ...event,
          accountEmail: account.email,
        }));
      } catch (error) {
        console.error(`Error fetching events for ${account.email}:`, error);
        return []; // Return empty array for failed accounts
      }
    });

    const allEventArrays = await Promise.all(eventPromises);
    const allEvents = allEventArrays.flat();

    // Sort by start time
    allEvents.sort((a: CalendarEventWithAccount, b: CalendarEventWithAccount) => {
      const dateA = new Date(a.start.dateTime || a.start.date || "");
      const dateB = new Date(b.start.dateTime || b.start.date || "");
      return dateA.getTime() - dateB.getTime();
    });

    // Remove duplicates (same event ID can appear if calendars are shared)
    const uniqueEvents = allEvents.filter(
      (event: CalendarEventWithAccount, index: number, self: CalendarEventWithAccount[]) =>
        index === self.findIndex((e) => e.id === event.id)
    );

    return NextResponse.json({
      events: uniqueEvents,
      accountCount: accounts.length,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST - Create calendar event (uses primary account)
export async function POST(request: Request) {
  const tokens = await getPrimaryAccountTokens();

  if (!tokens) {
    return NextResponse.json({ error: "Not authenticated", needsAuth: true }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { summary, description, date, time, endTime, reminderMinutes } = body;

    if (!summary || !date || !time) {
      return NextResponse.json(
        { error: "Summary, date, and time are required" },
        { status: 400 }
      );
    }

    // Parse date and time
    const startDateTime = new Date(`${date}T${time}`);
    let endDateTime: Date;
    if (endTime) {
      endDateTime = new Date(`${date}T${endTime}`);
      // If end time is before start time, assume it's the next day
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
    } else {
      endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
    }

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

// DELETE - Delete calendar event (uses primary account)
export async function DELETE(request: Request) {
  const tokens = await getPrimaryAccountTokens();

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
