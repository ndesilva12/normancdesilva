import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshMicrosoftAccessToken, MicrosoftTokens } from "@/lib/microsoft-graph";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get("microsoft_tokens");

    if (!tokensCookie) {
      return NextResponse.json({ connected: false });
    }

    const tokens: MicrosoftTokens = JSON.parse(tokensCookie.value);

    // Check if token is expired or about to expire (within 5 minutes)
    if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
      if (tokens.refresh_token) {
        // Try to refresh the token
        try {
          const newTokens = await refreshMicrosoftAccessToken(tokens.refresh_token);

          const response = NextResponse.json({
            connected: true,
            accessToken: newTokens.access_token,
          });

          response.cookies.set("microsoft_tokens", JSON.stringify(newTokens), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          });

          return response;
        } catch {
          // Refresh failed, clear tokens
          const response = NextResponse.json({ connected: false });
          response.cookies.delete("microsoft_tokens");
          return response;
        }
      } else {
        // No refresh token, clear tokens
        const response = NextResponse.json({ connected: false });
        response.cookies.delete("microsoft_tokens");
        return response;
      }
    }

    return NextResponse.json({
      connected: true,
      accessToken: tokens.access_token,
    });
  } catch (error) {
    console.error("Error checking Microsoft status:", error);
    return NextResponse.json({ connected: false });
  }
}

// Disconnect Microsoft account
export async function POST() {
  const response = NextResponse.json({ disconnected: true });
  response.cookies.delete("microsoft_tokens");
  return response;
}
