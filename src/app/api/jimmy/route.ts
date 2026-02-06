import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import WebSocket from "ws";

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

// Gateway configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'wss://ip-172-31-15-64.tailf5ae1d.ts.net:18789';
const GATEWAY_PASSWORD = process.env.GATEWAY_PASSWORD || 'HowardRoark12!';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || '01c11d12ea993efba6e4796e8e914db50bbab121913da457';

// Helper to connect to Jimmy gateway and send message
function connectToJimmyGateway(query: string, sessionKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('[Jimmy Gateway] Attempting to connect to:', GATEWAY_URL);
    const ws = new WebSocket(GATEWAY_URL);
    let responseReceived = false;
    let timeoutHandle: NodeJS.Timeout;

    // Set a timeout of 35 seconds for the entire operation
    timeoutHandle = setTimeout(() => {
      if (!responseReceived) {
        console.warn('[Jimmy Gateway] Request timeout, closing connection');
        ws.close();
        reject(new Error('Gateway request timeout after 35 seconds'));
      }
    }, 35000);

    ws.on('error', (error: any) => {
      clearTimeout(timeoutHandle);
      console.error('[Jimmy Gateway] WebSocket connection error:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port,
      });
      reject(new Error(`Gateway connection error: ${error.message || 'Unknown error'}`));
    });

    ws.on('open', () => {
      console.log('[Jimmy Gateway] Connected to gateway successfully, sending message');

      // Send the message to Jimmy
      const payload = {
        action: 'send',
        agent: 'code-jimmy',
        message: query,
        sessionKey: sessionKey,
      };
      console.log('[Jimmy Gateway] Sending payload:', payload);
      ws.send(JSON.stringify(payload));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[Jimmy Gateway] Received message:', { type: message.type, content: message.content?.substring(0, 50), done: message.done });

        // Check if this is a response message
        if (message.type === 'message' && message.content) {
          responseReceived = true;
          clearTimeout(timeoutHandle);

          // Close the connection
          ws.close();

          // Resolve with the content
          resolve(message.content);
        }
      } catch (error) {
        console.error('[Jimmy Gateway] Failed to parse message:', error, data.toString());
      }
    });

    ws.on('close', (code, reason) => {
      console.log('[Jimmy Gateway] Connection closed:', { code, reason: reason?.toString() });
      if (!responseReceived) {
        clearTimeout(timeoutHandle);
        reject(new Error(`Gateway connection closed (code: ${code}) without receiving response`));
      }
    });
  });
}

// Use gateway WebSocket to communicate with Jimmy
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
    const sessionKey = `dashboard-${userId || 'anonymous'}`;

    console.log("[Jimmy API] Sending message via gateway:", { userId, convId, queryLength: query.length });

    try {
      // Connect to gateway and get response
      const content = await connectToJimmyGateway(query, sessionKey);

      console.log("[Jimmy API] Response received:", content.substring(0, 100));

      // Save to Firestore
      try {
        if (userId) {
          const conversationRef = db.collection('users').doc(userId).collection('jimmy_conversations').doc(convId);

          // Update conversation with new messages
          await conversationRef.update({
            lastUpdated: Timestamp.now(),
            jimmyMessage: content,
          }).catch(async () => {
            // Create if doesn't exist
            await conversationRef.set({
              conversationId: convId,
              createdAt: Timestamp.now(),
              lastUpdated: Timestamp.now(),
              userMessage: query,
              jimmyMessage: content,
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
        timestamp: new Date().toISOString(),
      });
    } catch (gatewayError: any) {
      console.error("[Jimmy API] Gateway error:", gatewayError);

      // Check if it's a timeout
      if (gatewayError.message?.includes('timeout')) {
        return NextResponse.json(
          { error: "Request timed out. Jimmy is taking too long to respond." },
          { status: 504 }
        );
      }

      // Check if it's a connection error
      if (gatewayError.message?.includes('connection')) {
        return NextResponse.json(
          { error: "Failed to connect to Jimmy gateway. Please try again." },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Error communicating with Jimmy: ${gatewayError.message}` },
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
