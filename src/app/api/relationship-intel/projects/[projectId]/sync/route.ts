import { NextRequest, NextResponse } from "next/server";
import { getProject, createOrUpdateContact, addInteraction } from "@/lib/relationship-intel-db";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { Interaction } from "@/types/relationship-intel";

// Clawdbot proxy configuration
const CLAWDBOT_PROXY_URL = process.env.CLAWDBOT_PROXY_URL || 'http://localhost:8080';

// Helper to call Clawdbot via HTTP proxy
async function callClawdbot(message: string, sessionKey: string = 'relationship-intel', timeoutSeconds: number = 120): Promise<string> {
  console.log('[sync API] Calling Clawdbot proxy:', CLAWDBOT_PROXY_URL);

  const response = await fetch(`${CLAWDBOT_PROXY_URL}/api/clawdbot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sessionKey,
      timeout: timeoutSeconds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Unknown proxy error');
  }

  return data.response;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    console.log(`[sync API] Received projectId: ${projectId}`);

    const { daysBack = 60 } = await request.json().catch(() => ({}));

    // Get project details
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const results = {
      gmailProcessed: 0,
      calendarProcessed: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      interactionsAdded: 0,
      errors: [] as string[],
    };

    // Craft message for Clawdbot to fetch and filter Gmail/Calendar data
    const clawdbotMessage = `I need you to analyze my Gmail and Google Calendar for the project "${project.name}".

Project Keywords: ${project.keywords.join(", ")}
Time Range: Last ${daysBack} days

Please search my Gmail and Calendar for all emails and events related to these keywords. For each relevant interaction:

1. Extract the contact's email address and name
2. Determine if it's an email or calendar event
3. Extract the subject/title, date, and a brief summary
4. Include relevant metadata (email ID, thread ID for emails; event ID for calendar events)

Return the results in this exact JSON format:
{
  "contacts": [
    {
      "email": "person@example.com",
      "name": "Person Name",
      "interactions": [
        {
          "type": "email" or "event",
          "date": "ISO 8601 date",
          "subject": "Email subject or event title",
          "summary": "Brief summary",
          "content": "Full content or description",
          "emailId": "email ID if email",
          "threadId": "thread ID if email",
          "eventId": "event ID if calendar event",
          "from": "sender email if email",
          "to": ["recipient emails"] if email,
          "attendees": ["attendee emails"] if event
        }
      ]
    }
  ]
}

Focus only on substantive interactions (no automated emails, spam, or calendar holds). Be selective - only include interactions that clearly relate to the project keywords.`;

    console.log('[sync API] Sending request to Clawdbot');

    // Send to Clawdbot and get response
    let clawdbotResponse: string;
    try {
      clawdbotResponse = await callClawdbot(clawdbotMessage, `relationship-intel-${projectId}`, 120);
      console.log('[sync API] Received response from Clawdbot:', clawdbotResponse.substring(0, 200));
    } catch (error) {
      console.error('[sync API] Clawdbot proxy failed:', error);
      return NextResponse.json(
        { error: "Failed to connect to Clawdbot proxy", details: String(error) },
        { status: 503 }
      );
    }

    // Parse Clawdbot response to extract JSON
    let parsedData: any;
    try {
      // Try to extract JSON from the response (Clawdbot might wrap it in text)
      const jsonMatch = clawdbotResponse.match(/\{[\s\S]*"contacts"[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the entire response
        parsedData = JSON.parse(clawdbotResponse);
      }
    } catch (error) {
      console.error('[sync API] Failed to parse Clawdbot response:', error);
      results.errors.push(`Failed to parse Clawdbot response: ${error}`);
      parsedData = { contacts: [] };
    }

    // Process contacts and interactions from Clawdbot
    const contacts = parsedData?.contacts || [];
    console.log(`[sync API] Processing ${contacts.length} contacts from Clawdbot`);

    for (const contact of contacts) {
      try {
        const { email, name, interactions = [] } = contact;

        if (!email || !interactions.length) continue;

        // Determine first and last contact dates
        const dates = interactions.map((i: any) => new Date(i.date));
        const lastContact = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
        const firstContact = new Date(Math.min(...dates.map((d: Date) => d.getTime())));

        // Create or update contact
        await createOrUpdateContact(projectId, email, {
          email,
          name: name || email.split("@")[0],
          tags: [],
          lastContact,
          firstContact,
          interactionCount: interactions.length,
        });

        results.contactsUpdated++;

        // Add each interaction
        for (const interaction of interactions) {
          try {
            const normalizedInteraction: Interaction = {
              id: interaction.emailId || interaction.eventId || `${email}-${interaction.date}`,
              type: interaction.type,
              date: new Date(interaction.date),
              subject: interaction.subject,
              summary: interaction.summary || interaction.content?.substring(0, 150),
              content: interaction.content,
              ...(interaction.type === 'email' && {
                emailId: interaction.emailId,
                threadId: interaction.threadId,
                from: interaction.from,
                to: interaction.to,
                cc: interaction.cc,
              }),
              ...(interaction.type === 'event' && {
                eventId: interaction.eventId,
                attendees: interaction.attendees,
              }),
            };

            await addInteraction(projectId, email, normalizedInteraction);
            results.interactionsAdded++;

            if (interaction.type === 'email') {
              results.gmailProcessed++;
            } else if (interaction.type === 'event') {
              results.calendarProcessed++;
            }
          } catch (error) {
            console.error(`Failed to add interaction for ${email}:`, error);
            results.errors.push(`Interaction for ${email}: ${error}`);
          }
        }
      } catch (error) {
        console.error(`Failed to process contact ${contact.email}:`, error);
        results.errors.push(`Contact ${contact.email}: ${error}`);
      }
    }

    // Update project's updatedAt timestamp
    try {
      const db = getAdminFirestore();
      if (db) {
        await db
          .collection(`dashboard/relationshipIntel/projects`)
          .doc(projectId)
          .collection("metadata")
          .doc("info")
          .update({ updatedAt: new Date() });
      }
    } catch (error) {
      console.error("Failed to update project timestamp:", error);
    }

    console.log('[sync API] Sync completed:', results);

    return NextResponse.json(
      {
        success: true,
        message: "Sync completed",
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/relationship-intel/projects/[projectId]/sync:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
