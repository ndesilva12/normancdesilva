import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleTokens } from "@/lib/google-calendar";
import { getGoogleContacts, searchGoogleContacts } from "@/lib/google-services";

// Helper to get tokens and refresh if needed
async function getValidTokens(): Promise<{ tokens: GoogleTokens | null; error?: string; status?: number }> {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get("google_tokens");

  if (!tokensCookie) {
    return { tokens: null, error: "Not connected to Google", status: 401 };
  }

  let tokens: GoogleTokens = JSON.parse(tokensCookie.value);

  // Check if token is expired
  if (tokens.expires_at < Date.now() + 60 * 1000) {
    if (tokens.refresh_token) {
      try {
        tokens = await refreshAccessToken(tokens.refresh_token);
      } catch {
        return { tokens: null, error: "Token refresh failed", status: 401 };
      }
    } else {
      return { tokens: null, error: "Token expired", status: 401 };
    }
  }

  return { tokens };
}

// POST handler for unified search integration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || "";
    const limit = body.limit || 50;

    const { tokens, error, status } = await getValidTokens();
    if (!tokens) {
      return NextResponse.json({ error }, { status: status || 401 });
    }

    let contacts;
    if (query) {
      contacts = await searchGoogleContacts(tokens.access_token, query, limit);
    } else {
      contacts = await getGoogleContacts(tokens.access_token, limit);
    }

    // Format contacts as readable content for the tool result
    const content = contacts.length > 0
      ? contacts.map((c, i: number) => {
          const name = c.names?.[0]?.displayName || "Unknown";
          const email = c.emailAddresses?.[0]?.value;
          const phone = c.phoneNumbers?.[0]?.value;
          const org = c.organizations?.[0]?.name;
          const title = c.organizations?.[0]?.title;

          let result = `**${i + 1}. ${name}**`;
          if (org) result += `\n   ${title ? `${title} at ` : ""}${org}`;
          if (email) result += `\n   Email: ${email}`;
          if (phone) result += `\n   Phone: ${phone}`;
          return result;
        }).join("\n\n")
      : "No contacts found matching your search.";

    const response = NextResponse.json({
      contacts,
      content,
      count: contacts.length
    });

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
    console.error("Error searching contacts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search contacts" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const query = searchParams.get("q");

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

    let contacts;
    if (query) {
      contacts = await searchGoogleContacts(tokens.access_token, query, limit);
    } else {
      contacts = await getGoogleContacts(tokens.access_token, limit);
    }

    const response = NextResponse.json({ contacts });

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
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
