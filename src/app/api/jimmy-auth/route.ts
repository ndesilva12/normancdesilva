// Jimmy's authentication setup endpoint
import { NextRequest, NextResponse } from "next/server";
import { getJimmyAuthUrl } from "@/lib/jimmy-auth";

export async function GET(request: NextRequest) {
  try {
    const baseUrl = request.nextUrl.origin;
    const authUrl = getJimmyAuthUrl(baseUrl);
    
    return NextResponse.json({
      success: true,
      authUrl: authUrl,
      instructions: [
        "1. Visit the authUrl to authenticate Jimmy",
        "2. Sign in with norman.desilva@gmail.com", 
        "3. Grant all requested permissions",
        "4. You'll be redirected back with tokens",
        "5. Copy the refresh token to your .env.local file"
      ]
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to generate auth URL"
    }, { status: 500 });
  }
}