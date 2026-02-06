import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/relationship-intel-db";
import { syncGmailForProject } from "@/lib/gmail-sync";
import { syncCalendarForProject } from "@/lib/calendar-sync";
import { createOrUpdateContact, addInteraction } from "@/lib/relationship-intel-db";
import { db } from "@/lib/firebase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
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

    // Sync Gmail
    try {
      const gmailResults = await syncGmailForProject(
        project.name,
        project.keywords,
        daysBack
      );

      for (const [email, { interactions }] of gmailResults.entries()) {
        try {
          // Extract name from email (basic heuristic)
          const name = email.split("@")[0]
            .split(".")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

          // Create or update contact
          await createOrUpdateContact(projectId, email, {
            email,
            name,
            tags: [],
            lastContact: interactions[0].date,
            firstContact: interactions[interactions.length - 1].date,
            interactionCount: interactions.length,
          });

          // Add interactions
          for (const interaction of interactions) {
            await addInteraction(projectId, email, interaction);
            results.interactionsAdded++;
          }

          results.contactsUpdated++;
          results.gmailProcessed++;
        } catch (error) {
          console.error(`Failed to process email contact ${email}:`, error);
          results.errors.push(`Email contact ${email}: ${error}`);
        }
      }
    } catch (error) {
      console.error("Gmail sync failed:", error);
      results.errors.push(`Gmail sync: ${error}`);
    }

    // Sync Calendar
    try {
      const calendarResults = await syncCalendarForProject(
        project.name,
        project.keywords,
        daysBack
      );

      for (const [email, { interactions }] of calendarResults.entries()) {
        try {
          // Extract name from email
          const name = email.split("@")[0]
            .split(".")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

          // Create or update contact
          await createOrUpdateContact(projectId, email, {
            email,
            name,
            tags: [],
            lastContact: interactions[0].date,
            firstContact: interactions[interactions.length - 1].date,
            interactionCount: interactions.length,
          });

          // Add interactions
          for (const interaction of interactions) {
            await addInteraction(projectId, email, interaction);
            results.interactionsAdded++;
          }

          results.contactsUpdated++;
          results.calendarProcessed++;
        } catch (error) {
          console.error(`Failed to process calendar contact ${email}:`, error);
          results.errors.push(`Calendar contact ${email}: ${error}`);
        }
      }
    } catch (error) {
      console.error("Calendar sync failed:", error);
      results.errors.push(`Calendar sync: ${error}`);
    }

    // Update project's updatedAt timestamp
    try {
      await db
        .collection(`dashboard/relationshipIntel/projects`)
        .doc(projectId)
        .collection("metadata")
        .doc("info")
        .update({ updatedAt: new Date() });
    } catch (error) {
      console.error("Failed to update project timestamp:", error);
    }

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
