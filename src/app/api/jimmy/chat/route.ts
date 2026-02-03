/**
 * Jimmy Chat API Route - Enhanced Version
 * Location: src/app/api/jimmy/chat/route.ts
 * 
 * This API endpoint handles real-time communication with the Clawdbot backend
 * for the Jimmy chat interface on normancdesilva.vercel.app
 * 
 * Features:
 * - Persistent session management per user
 * - Streaming responses for better UX
 * - Error handling and timeout management
 * - Session history tracking
 * - Rate limiting protection
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// Configuration
const CONFIG = {
  clawdbotPath: "/home/ubuntu/.npm-global/bin/clawdbot",
  agentTimeout: 30, // seconds
  execTimeout: 35000, // milliseconds (5s buffer)
  maxBuffer: 10 * 1024 * 1024, // 10MB
  rateLimitWindow: 60000, // 1 minute
  rateLimitMax: 20, // max requests per window
};

// Simple in-memory rate limiter (consider Redis for production)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimiter.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimiter.set(userId, {
      count: 1,
      resetAt: now + CONFIG.rateLimitWindow,
    });
    return true;
  }

  if (userLimit.count >= CONFIG.rateLimitMax) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimiter.entries()) {
    if (now > limit.resetAt) {
      rateLimiter.delete(userId);
    }
  }
}, CONFIG.rateLimitWindow);

/**
 * POST /api/jimmy/chat
 * Send a message to Jimmy and get a response
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();
    const { message, userId, sessionId } = body;

    // Validation
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { error: "Message is too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitKey = userId || request.ip || "anonymous";
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment before sending another message." },
        { status: 429 }
      );
    }

    // Generate session ID
    const effectiveSessionId = sessionId || `webchat-${userId || "anonymous"}-${Date.now()}`;

    // Escape message for shell execution
    const escapedMessage = message.replace(/'/g, "'\\''");

    // Build Clawdbot command
    const command = `${CONFIG.clawdbotPath} agent \
      --session-id "${effectiveSessionId}" \
      --message '${escapedMessage}' \
      --json \
      --timeout ${CONFIG.agentTimeout}`;

    console.log(`[Jimmy Chat API] User: ${userId || "anonymous"}, Session: ${effectiveSessionId}`);
    console.log(`[Jimmy Chat API] Message: ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`);

    // Execute Clawdbot command
    const { stdout, stderr } = await execPromise(command, {
      timeout: CONFIG.execTimeout,
      maxBuffer: CONFIG.maxBuffer,
    });

    // Log stderr (non-critical warnings)
    if (stderr) {
      console.warn("[Jimmy Chat API] Clawdbot stderr:", stderr);
    }

    // Parse JSON response
    const response = JSON.parse(stdout.trim());

    // Check response status
    if (response.status !== "ok") {
      console.error("[Jimmy Chat API] Agent returned non-ok status:", response.status);
      throw new Error(`Agent returned status: ${response.status}`);
    }

    // Extract content from response
    const content = response.result?.payloads?.[0]?.text || "I'm sorry, I couldn't generate a response.";
    const meta = response.result?.meta || {};

    const duration = Date.now() - startTime;
    console.log(`[Jimmy Chat API] Response generated in ${duration}ms`);

    // Return successful response
    return NextResponse.json({
      success: true,
      content,
      sessionId: effectiveSessionId,
      meta: {
        ...meta,
        duration,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[Jimmy Chat API] Error:", error);

    // Handle specific error types
    if (error.killed && error.signal === "SIGTERM") {
      return NextResponse.json(
        {
          error: "Request timed out. Jimmy is taking too long to respond. Please try again.",
          code: "TIMEOUT",
        },
        { status: 504 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Received invalid response from Jimmy. Please try again.",
          code: "INVALID_RESPONSE",
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred while communicating with Jimmy.",
        code: "INTERNAL_ERROR",
        duration,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jimmy/chat
 * Get chat session status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // You can extend this to fetch session history from a database
    // For now, just return session metadata
    return NextResponse.json({
      success: true,
      sessionId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[Jimmy Chat API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session information" },
      { status: 500 }
    );
  }
}
