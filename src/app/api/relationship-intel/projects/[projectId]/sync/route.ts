import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/relationship-intel-db";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    console.log(`[sync API] Received projectId: ${projectId}`);

    const { daysBack = 60, freshSync = false } = await request.json().catch(() => ({}));

    // Get project details
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Create sync status document to track progress
    const db = getAdminFirestore();
    if (db) {
      await db.collection('sync_status').doc(projectId).set({
        status: 'syncing',
        startedAt: new Date(),
        projectName: project.name,
        keywords: project.keywords,
        daysBack,
        freshSync,
      });
    }

    // Craft Telegram message for Jimmy
    const telegramMessage = `🔄 Relationship Intel Sync Request

**Project:** ${project.name}
**Project ID:** ${projectId}
**Keywords:** ${project.keywords.join(", ")}
**Timeframe:** Last ${daysBack} days
**Fresh Sync:** ${freshSync ? 'Yes (include previously removed)' : 'No (skip removed contacts)'}

Please analyze my Gmail and Calendar for contacts and interactions related to these keywords.

For each contact, save to Firestore:
- dashboard/relationshipIntel/projects/${projectId}/contacts/{email}
- Include all interactions

When complete, update sync_status/${projectId} with:
- status: 'complete'
- completedAt: timestamp
- contactCount: number of contacts found
- interactionCount: number of interactions

Return a brief summary when done. Thanks!`;

    // Send via clawdbot CLI (assumes clawdbot is in PATH on the server)
    try {
      console.log('[sync API] Sending Telegram message to Jimmy');

      // Escape quotes for shell command
      const escapedMessage = telegramMessage.replace(/"/g, '\\"').replace(/\$/g, '\\$');

      // Send to Norman's phone number
      await execAsync(
        `clawdbot agent --to +15084932857 --message "${escapedMessage}" --timeout 10`
      );

      console.log('[sync API] Telegram message sent successfully');
    } catch (error) {
      console.error('[sync API] Failed to send Telegram message:', error);

      // Update sync status to failed
      if (db) {
        await db.collection('sync_status').doc(projectId).update({
          status: 'failed',
          error: 'Failed to send Telegram message',
          failedAt: new Date(),
        });
      }

      return NextResponse.json(
        { error: "Failed to send sync request via Telegram", details: String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sync request sent to Jimmy via Telegram. The dashboard will poll for completion.",
        status: 'syncing',
        checkTelegram: true,
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
