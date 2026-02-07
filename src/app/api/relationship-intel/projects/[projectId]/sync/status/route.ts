import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;

    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json(
        { error: "Firestore not initialized" },
        { status: 500 }
      );
    }

    const syncDoc = await db.collection('sync_status').doc(projectId).get();

    if (!syncDoc.exists) {
      return NextResponse.json({ status: 'idle' });
    }

    const data = syncDoc.data();

    return NextResponse.json({
      status: data?.status || 'idle',
      startedAt: data?.startedAt?.toDate?.()?.toISOString?.() || null,
      completedAt: data?.completedAt?.toDate?.()?.toISOString?.() || null,
      failedAt: data?.failedAt?.toDate?.()?.toISOString?.() || null,
      contactCount: data?.contactCount || 0,
      interactionCount: data?.interactionCount || 0,
      error: data?.error || null,
      projectName: data?.projectName || null,
    });
  } catch (error) {
    console.error("Error checking sync status:", error);
    return NextResponse.json(
      { error: "Failed to check sync status", details: String(error) },
      { status: 500 }
    );
  }
}
