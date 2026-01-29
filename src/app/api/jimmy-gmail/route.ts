import { NextRequest, NextResponse } from "next/server";
import { sendEmail, SendEmailParams, getRecentEmails, searchGoogleContacts } from "@/lib/google-services";
import { getJimmyAccessToken } from "@/lib/jimmy-auth";

// POST - Send email (for Jimmy)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, to, subject, emailBody, cc, bcc, search, limit } = body;

    const auth = await getJimmyAccessToken();
    if (!auth) {
      return NextResponse.json(
        { error: "Jimmy not authenticated. Please run Jimmy auth setup first." },
        { status: 401 }
      );
    }

    if (action === "send") {
      // Validate required fields for sending
      if (!to || !subject || !emailBody) {
        return NextResponse.json(
          { error: "Missing required fields: to, subject, emailBody" },
          { status: 400 }
        );
      }

      const params: SendEmailParams = {
        to,
        subject,
        body: emailBody,
        cc,
        bcc,
      };

      const result = await sendEmail(auth.token, params, auth.email);
      return NextResponse.json({
        success: true,
        messageId: result.id,
        threadId: result.threadId,
        from: auth.email,
      });
    }

    if (action === "search-contacts") {
      if (!search) {
        return NextResponse.json({ error: "Search query required" }, { status: 400 });
      }
      
      const contacts = await searchGoogleContacts(auth.token, search);
      return NextResponse.json({ contacts });
    }

    if (action === "get-emails") {
      const emails = await getRecentEmails(auth.token, limit || 10, search);
      return NextResponse.json({ 
        emails,
        account: auth.email 
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Jimmy Gmail API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gmail action failed" },
      { status: 500 }
    );
  }
}

// GET - Check authentication status  
export async function GET() {
  try {
    const auth = await getJimmyAccessToken();
    return NextResponse.json({
      authenticated: true,
      email: auth.email,
      status: "Jimmy has valid Gmail access"
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      email: null,
      status: error instanceof Error ? error.message : "Authentication failed",
      setup_needed: true
    });
  }
}