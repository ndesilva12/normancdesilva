import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleTokens } from "@/lib/google-calendar";
import { getRecentDriveFiles } from "@/lib/google-services";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get("google_tokens");

    if (!tokensCookie) {
      return NextResponse.json({ error: "Not connected to Google" }, { status: 401 });
    }

    let tokens: GoogleTokens = JSON.parse(tokensCookie.value);

    // Check if token is expired
    if (tokens.expires_at < Date.now() + 60 * 1000) {
      if (tokens.refresh_token) {
        try {
          tokens = await refreshAccessToken(tokens.refresh_token);
        } catch {
          return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
    }

    const files = await getRecentDriveFiles(tokens.access_token, limit);

    const response = NextResponse.json({ files });

    // Update tokens if refreshed
    if (tokens.expires_at > Date.now()) {
      response.cookies.set("google_tokens", JSON.stringify(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error fetching Drive files:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch files" },
      { status: 500 }
    );
  }
}
