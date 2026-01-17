import { NextResponse } from "next/server";

// Debug endpoint to check which environment variables are configured
// Visit /api/debug/env to see which API keys are set
// This does NOT expose the actual values, only whether they are set
export async function GET() {
  const envVars = {
    // AI API Keys
    XAI_API_KEY: !!process.env.XAI_API_KEY,
    GROK_API_KEY: !!process.env.GROK_API_KEY, // Legacy name - should NOT be used
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,

    // Google OAuth
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,

    // Firebase
    NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,

    // Notion
    NOTION_INTEGRATION_TOKEN: !!process.env.NOTION_INTEGRATION_TOKEN,
    NOTION_DATABASE_ID: !!process.env.NOTION_DATABASE_ID,

    // Spotify
    SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
  };

  // Check for common issues
  const issues: string[] = [];

  if (process.env.GROK_API_KEY && !process.env.XAI_API_KEY) {
    issues.push("GROK_API_KEY is set but XAI_API_KEY is not. The code uses XAI_API_KEY - please rename it in Vercel.");
  }

  if (process.env.XAI_API_KEY) {
    const key = process.env.XAI_API_KEY;
    if (key.startsWith(" ") || key.endsWith(" ")) {
      issues.push("XAI_API_KEY has leading or trailing whitespace - please remove it.");
    }
    if (key.length < 20) {
      issues.push("XAI_API_KEY seems too short - please verify it's the complete key.");
    }
  }

  return NextResponse.json({
    configured: envVars,
    issues,
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  });
}
