import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshMicrosoftAccessToken, MicrosoftTokens, getRecentOneNotePages, getOneNoteNotebooks } from "@/lib/microsoft-graph";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || "pages"; // pages or notebooks

    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get("microsoft_tokens");

    if (!tokensCookie) {
      return NextResponse.json({ error: "Not connected to Microsoft" }, { status: 401 });
    }

    let tokens: MicrosoftTokens = JSON.parse(tokensCookie.value);

    // Check if token is expired
    if (tokens.expires_at < Date.now() + 60 * 1000) {
      if (tokens.refresh_token) {
        try {
          tokens = await refreshMicrosoftAccessToken(tokens.refresh_token);
        } catch {
          return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
    }

    let data;
    if (type === "notebooks") {
      data = await getOneNoteNotebooks(tokens.access_token);
    } else {
      data = await getRecentOneNotePages(tokens.access_token, limit);
    }

    const response = NextResponse.json({ [type]: data });

    // Update tokens if refreshed
    if (tokens.expires_at > Date.now()) {
      response.cookies.set("microsoft_tokens", JSON.stringify(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error fetching OneNote data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch notes";
    // Check for common Microsoft Graph API errors
    if (errorMessage.includes("401") || errorMessage.includes("InvalidAuthenticationToken")) {
      return NextResponse.json(
        { error: "Microsoft session expired. Please reconnect." },
        { status: 401 }
      );
    }
    if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
      return NextResponse.json(
        { error: "OneNote access not granted. Please reconnect and approve permissions." },
        { status: 403 }
      );
    }
    if (errorMessage.includes("404") || errorMessage.includes("NotFound")) {
      return NextResponse.json(
        { error: "No OneNote notebooks found. Create a notebook in OneNote first." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
