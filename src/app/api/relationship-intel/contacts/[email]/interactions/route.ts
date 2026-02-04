import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getJimmyAccessToken } from "@/lib/jimmy-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    const authData = await getJimmyAccessToken();
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: authData.token,
    });
    
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    
    // Search for emails to/from this contact
    const query = `from:${email} OR to:${email}`;
    const messages = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 50,
    });

    if (!messages.data.messages) {
      return NextResponse.json({ interactions: [] });
    }

    // Fetch full details for each message
    const interactions = await Promise.all(
      messages.data.messages.map(async (msg) => {
        const fullMsg = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        });

        const headers = fullMsg.data.payload?.headers || [];
        const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "(No Subject)";
        const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
        const to = headers.find((h) => h.name?.toLowerCase() === "to")?.value || "";
        const date = headers.find((h) => h.name?.toLowerCase() === "date")?.value || "";
        
        // Extract snippet
        let snippet = fullMsg.data.snippet || "";
        if (snippet.length > 150) {
          snippet = snippet.substring(0, 150) + "...";
        }

        // Determine if inbound or outbound
        const isInbound = from.toLowerCase().includes(email.toLowerCase());

        return {
          date,
          subject,
          snippet,
          from,
          to,
          isInbound,
        };
      })
    );

    // Sort by date (most recent first)
    interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error("Error fetching interactions:", error);
    return NextResponse.json({ interactions: [] }, { status: 500 });
  }
}
