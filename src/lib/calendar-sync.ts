// Google Calendar API integration for Relationship Intel

import { google } from "googleapis";
import { promises as fs } from "fs";
import { Interaction } from "@/types/relationship-intel";
import { generateSummary, isRelevantToProject } from "./clawdbot-ai";

const TOKEN_PATH = "/home/ubuntu/.config/google/token_norman_desilva_gmail_com.json";

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  attendees: string[];
  start: Date;
  end: Date;
}

/**
 * Get authenticated Calendar client
 */
async function getCalendarClient() {
  try {
    const tokenData = await fs.readFile(TOKEN_PATH, "utf-8");
    const tokens = JSON.parse(tokenData);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    return google.calendar({ version: "v3", auth: oauth2Client });
  } catch (error) {
    console.error("Failed to initialize Calendar client:", error);
    throw new Error("Calendar authentication failed");
  }
}

/**
 * Parse Calendar event
 */
function parseEvent(event: any): CalendarEvent {
  const attendees = (event.attendees || [])
    .map((a: any) => a.email)
    .filter((email: string) => email && email.toLowerCase() !== "norman.desilva@gmail.com");

  return {
    id: event.id,
    summary: event.summary || "(No title)",
    description: event.description || "",
    attendees,
    start: new Date(event.start.dateTime || event.start.date),
    end: new Date(event.end.dateTime || event.end.date),
  };
}

/**
 * Sync Google Calendar for a project with AI filtering
 */
export async function syncCalendarForProject(
  projectName: string,
  projectKeywords: string[],
  daysBack: number = 60,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Map<string, { contact: string; interactions: Interaction[] }>> {
  const calendar = await getCalendarClient();
  const results = new Map<string, { contact: string; interactions: Interaction[] }>();

  // Calculate time range
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - daysBack);

  onProgress?.(0, 100, "Fetching events from Google Calendar...");

  // Fetch events
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    maxResults: 500,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = (response.data.items || [])
    .map(parseEvent)
    .filter(event => event.attendees.length > 0); // Only events with other people

  const totalEvents = events.length;

  if (totalEvents === 0) {
    return results;
  }

  onProgress?.(20, 100, `Found ${totalEvents} events. Analyzing relevance...`);

  // Use AI to filter relevant events
  const relevanceChecks = await Promise.all(
    events.map(async (event, index) => {
      const relevance = await isRelevantToProject(
        "event",
        projectName,
        projectKeywords,
        event.summary,
        event.description,
        event.attendees
      );

      if (index % 10 === 0) {
        const progress = 20 + Math.floor((index / totalEvents) * 40);
        onProgress?.(progress, 100, `Analyzing event ${index + 1}/${totalEvents}...`);
      }

      return { event, relevance };
    })
  );

  // Filter to only relevant events with high confidence
  const relevantEvents = relevanceChecks.filter(
    ({ relevance }) => relevance.relevant && relevance.confidence >= 60
  );

  onProgress?.(60, 100, `Found ${relevantEvents.length} relevant events. Generating summaries...`);

  // Process relevant events
  for (let i = 0; i < relevantEvents.length; i++) {
    const { event } = relevantEvents[i];

    // Generate AI summary
    const summary = await generateSummary(
      "event",
      event.summary,
      event.description || event.summary
    );

    // Create interaction for each attendee
    for (const attendee of event.attendees) {
      const interaction: Interaction = {
        id: `${event.id}-${attendee}`,
        type: "event",
        date: event.start,
        subject: event.summary,
        summary,
        content: event.description || event.summary,
        eventId: event.id,
        attendees: event.attendees,
      };

      // Add to results
      if (!results.has(attendee)) {
        results.set(attendee, { contact: attendee, interactions: [] });
      }
      results.get(attendee)!.interactions.push(interaction);
    }

    const progress = 60 + Math.floor((i / relevantEvents.length) * 40);
    onProgress?.(progress, 100, `Processing event ${i + 1}/${relevantEvents.length}...`);
  }

  onProgress?.(100, 100, "Calendar sync complete!");

  return results;
}
