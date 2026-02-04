import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleAccountsStore, GoogleTokens } from "@/lib/google-calendar";

// Helper to get valid access token
async function getAccessToken(account?: string): Promise<string | null> {
  const cookieStore = await cookies();

  // Try multi-account cookie first
  const accountsCookie = cookieStore.get("google_accounts");
  if (accountsCookie) {
    try {
      const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);
      const targetEmail = account || accountsStore.primaryAccount || Object.keys(accountsStore.accounts)[0];
      const targetAccount = accountsStore.accounts[targetEmail];

      if (targetAccount) {
        // Refresh if needed
        if (targetAccount.expires_at < Date.now() + 60 * 1000 && targetAccount.refresh_token) {
          const refreshed = await refreshAccessToken(targetAccount.refresh_token);
          return refreshed.access_token;
        }
        return targetAccount.access_token;
      }
    } catch {
      // Fall through
    }
  }

  // Fallback to legacy token
  const tokensCookie = cookieStore.get("google_tokens");
  if (tokensCookie) {
    try {
      let tokens: GoogleTokens = JSON.parse(tokensCookie.value);
      if (tokens.expires_at < Date.now() + 60 * 1000 && tokens.refresh_token) {
        tokens = await refreshAccessToken(tokens.refresh_token);
      }
      return tokens.access_token;
    } catch {
      // Fall through
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const attendee = searchParams.get("attendee");
    const account = searchParams.get("account") || undefined;

    if (!attendee) {
      return NextResponse.json(
        { error: "Query parameter 'attendee' is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken(account);
    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch events from the past year
    const timeMin = new Date();
    timeMin.setFullYear(timeMin.getFullYear() - 1);
    
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 3); // Include upcoming meetings

    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: "250",
      orderBy: "startTime",
      singleEvents: "true",
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get calendar events: ${error}`);
    }

    const data = await response.json();
    const events = data.items || [];

    // Filter events where the attendee is present
    const meetings = events
      .filter((event: any) =>
        event.attendees?.some((a: any) =>
          a.email?.toLowerCase() === attendee.toLowerCase()
        )
      )
      .map((event: any) => ({
        id: event.id,
        title: event.summary || "(no title)",
        date: event.start?.dateTime || event.start?.date || "",
        attendees: event.attendees?.map((a: any) => a.email || a.displayName || "").filter(Boolean) || [],
        notes: event.description,
      }));

    return NextResponse.json({ meetings, count: meetings.length });
  } catch (error: any) {
    console.error("Calendar meetings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
