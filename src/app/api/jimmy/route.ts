import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const execPromise = promisify(exec);

// Initialize Firebase Admin
if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'the-dashboard-50be1';

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

// Use Clawdbot agent command to communicate with Jimmy
export async function POST(request: NextRequest) {
  try {
    const { query, userId, conversationId } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Use a consistent conversation ID
    const convId = conversationId || `webchat-${userId || 'anonymous'}-${Date.now()}`;

    // Escape single quotes in the message for shell
    const escapedQuery = query.replace(/'/g, "'\\''");

    // Use npx to run clawdbot (installed as npm package @2026.1.24-3)
    // npx automatically finds the binary in node_modules/.bin
    const command = `npx clawdbot agent --session-id "${convId}" --message '${escapedQuery}' --json --timeout 30`;

    console.log("[Jimmy API] Sending message to Clawdbot:", { userId, convId, queryLength: query.length });

    try {
      const { stdout, stderr } = await execPromise(command, {
        timeout: 35000, // 35 second timeout (5s more than agent timeout)
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (stderr) {
        console.error("[Jimmy API] Clawdbot stderr:", stderr);
      }

      // Parse the JSON response
      try {
        const response = JSON.parse(stdout.trim());

        // Check if the response was successful
        if (response.status !== "ok") {
          throw new Error(`Agent returned status: ${response.status}`);
        }

        // Extract the text from the first payload
        const content = response.result?.payloads?.[0]?.text || "No response from Jimmy";

        console.log("[Jimmy API] Response received:", content.substring(0, 100));

        // Save to Firestore
        try {
          if (userId) {
            const conversationRef = db.collection('users').doc(userId).collection('jimmy_conversations').doc(convId);

            // Update conversation with new messages
            await conversationRef.update({
              lastUpdated: Timestamp.now(),
              messages: response.result?.payloads || [],
            }).catch(async () => {
              // Create if doesn't exist
              await conversationRef.set({
                conversationId: convId,
                createdAt: Timestamp.now(),
                lastUpdated: Timestamp.now(),
                userMessage: query,
                assistantMessage: content,
                messages: response.result?.payloads || [],
                status: 'completed',
              });
            });
          }
        } catch (firestoreError) {
          console.error("[Jimmy API] Failed to save to Firestore:", firestoreError);
          // Don't fail the request if Firestore fails
        }

        return NextResponse.json({
          content: content,
          conversationId: convId,
          meta: response.result?.meta,
          timestamp: new Date().toISOString(),
        });
      } catch (parseError) {
        console.error("[Jimmy API] Failed to parse response:", parseError);
        console.error("[Jimmy API] Raw output:", stdout);

        return NextResponse.json(
          { error: "Received invalid response from Jimmy" },
          { status: 500 }
        );
      }
    } catch (execError: any) {
      console.error("[Jimmy API] Clawdbot exec error:", execError);
      console.error("[Jimmy API] Error details:", {
        message: execError.message,
        code: execError.code,
        signal: execError.signal,
        killed: execError.killed,
        stdout: execError.stdout?.toString?.(),
        stderr: execError.stderr?.toString?.(),
      });

      // Check if it's a timeout
      if (execError.killed && execError.signal === 'SIGTERM') {
        return NextResponse.json(
          { error: "Request timed out. Jimmy is taking too long to respond." },
          { status: 504 }
        );
      }

      // Check if clawdbot command was not found
      if (execError.code === 127 || execError.message?.includes('not found')) {
        return NextResponse.json(
          { error: "ClawdBot command not found. Please verify the installation path and that SSH tunnel is active if required." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Error communicating with Jimmy: ${execError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Jimmy API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to communicate with Jimmy" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch conversation history
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('jimmy_conversations')
      .orderBy('lastUpdated', 'desc')
      .limit(limit)
      .get();

    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as any)?.toDate?.()?.toISOString?.() || null,
      lastUpdated: (doc.data().lastUpdated as any)?.toDate?.()?.toISOString?.() || null,
    }));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[Jimmy API] Error fetching history:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch conversation history" },
      { status: 500 }
    );
  }
}
