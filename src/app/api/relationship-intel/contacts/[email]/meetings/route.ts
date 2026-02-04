import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getJimmyAccessToken } from "@/lib/jimmy-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    const authData = await getJimmyAccessToken();
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: authData.token,
    });
    
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    // Search for calendar events with this attendee
    const now = new Date();
    const past = new Date();
    past.setMonth(past.getMonth() - 6); // Last 6 months
    const future = new Date();
    future.setMonth(future.getMonth() + 6); // Next 6 months

    const events = await calendar.events.list({
      calendarId: "primary",
      timeMin: past.toISOString(),
      timeMax: future.toISOString(),
      q: email, // Search for email in event
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });

    if (!events.data.items) {
      return NextResponse.json({ meetings: [] });
    }

    const meetings = events.data.items
      .filter((event) => {
        // Only include events where this email is an attendee
        const attendees = event.attendees || [];
        return attendees.some((a) => a.email?.toLowerCase() === email.toLowerCase());
      })
      .map((event) => {
        const start = event.start?.dateTime || event.start?.date || "";
        const startDate = new Date(start);
        const isPast = startDate < now;
        
        return {
          date: start,
          title: event.summary || "(No Title)",
          time: startDate.toLocaleTimeString("en-US", { 
            hour: "numeric", 
            minute: "2-digit",
            hour12: true 
          }),
          isPast,
        };
      });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ meetings: [] }, { status: 500 });
  }
}
