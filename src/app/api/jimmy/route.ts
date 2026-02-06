import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

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

// Helper to find clawdbot executable
function findClawdbot(): { command: string; args: string[] } {
  const { existsSync } = require('fs');

  // Check for the real npm package location first
  const jsPath = '/home/ubuntu/.npm-global/lib/node_modules/clawdbot/dist/entry.js';
  if (existsSync(jsPath)) {
    console.log(`[Jimmy API] Found clawdbot JS at: ${jsPath}`);
    return { command: 'node', args: [jsPath] };
  }

  // Check for symlink
  const symlinkPath = '/home/ubuntu/.npm-global/bin/clawdbot';
  if (existsSync(symlinkPath)) {
    console.log(`[Jimmy API] Found clawdbot symlink at: ${symlinkPath}`);
    return { command: symlinkPath, args: [] };
  }

  // Fallback to root npm global
  const rootPath = '/root/.npm-global/bin/clawdbot';
  if (existsSync(rootPath)) {
    console.log(`[Jimmy API] Found clawdbot at root: ${rootPath}`);
    return { command: rootPath, args: [] };
  }

  // Last resort: try system paths
  const systemPaths = ['/usr/local/bin/clawdbot', '/usr/bin/clawdbot'];
  for (const path of systemPaths) {
    if (existsSync(path)) {
      console.log(`[Jimmy API] Found clawdbot at: ${path}`);
      return { command: path, args: [] };
    }
  }

  // If nothing found, return node + js path as best attempt
  console.warn(`[Jimmy API] Could not find clawdbot, attempting with node + ${jsPath}`);
  return { command: 'node', args: [jsPath] };
}

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

    // Find the clawdbot executable
    const { command, args: initialArgs } = findClawdbot();

    console.log("[Jimmy API] Sending message to Clawdbot:", { userId, convId, queryLength: query.length, command, initialArgs });

    try {
      // Use spawn instead of exec to avoid shell issues
      const spawnPromise = new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timeout = setTimeout(() => {
          timedOut = true;
          process.kill(proc.pid!);
        }, 35000);

        const proc = spawn(command, [
          ...initialArgs,
          'agent',
          '--session-id',
          convId,
          '--message',
          query,
          '--json',
          '--timeout',
          '30',
        ], {
          cwd: '/home/ubuntu',
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        proc.stdout!.on('data', (data) => {
          stdout += data.toString();
        });

        proc.stderr!.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          clearTimeout(timeout);
          if (timedOut) {
            reject(new Error('Process timeout'));
          } else if (code !== 0) {
            reject(new Error(`Process exited with code ${code}: ${stderr}`));
          } else {
            resolve({ stdout, stderr });
          }
        });

        proc.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      const { stdout, stderr } = await spawnPromise;

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
          { error: "ClawdBot command not found at /home/ubuntu/.npm-global/bin/clawdbot. Please verify installation." },
          { status: 500 }
        );
      }

      // Check if it's a permission issue
      if (execError.code === 13 || execError.message?.includes('Permission denied')) {
        return NextResponse.json(
          { error: "Permission denied accessing ClawdBot. Check file permissions on /home/ubuntu/.npm-global/bin/clawdbot" },
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
