// Jimmy's OAuth callback handler
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/jimmy-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Check for OAuth errors
  if (error) {
    return NextResponse.json({
      error: `OAuth error: ${error}`,
      description: "Authentication was denied or failed"
    }, { status: 400 });
  }

  // Check for authorization code
  if (!code) {
    return NextResponse.json({
      error: "No authorization code received",
      description: "OAuth flow was incomplete"
    }, { status: 400 });
  }

  // Verify state parameter
  if (state !== "jimmy-auth-setup") {
    return NextResponse.json({
      error: "Invalid state parameter",
      description: "Possible CSRF attack detected"
    }, { status: 400 });
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${request.nextUrl.origin}/api/jimmy-auth/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Return tokens for manual configuration
    return NextResponse.json({
      success: true,
      message: "Jimmy authentication successful!",
      instructions: [
        "Add these environment variables to your .env.local file:",
        `JIMMY_GMAIL_REFRESH_TOKEN="${tokens.refresh_token}"`,
        `JIMMY_GMAIL_EMAIL="${tokens.email}"`,
        "",
        "Then restart your application for Jimmy to have Gmail access."
      ],
      tokens: {
        email: tokens.email,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expires_at).toISOString(),
      }
    });
  } catch (error) {
    console.error("Jimmy auth callback error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Token exchange failed",
      description: "Failed to complete Jimmy's authentication setup"
    }, { status: 500 });
  }
}