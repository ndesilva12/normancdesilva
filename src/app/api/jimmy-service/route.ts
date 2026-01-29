// Jimmy's service account Gmail API endpoint
import { NextRequest, NextResponse } from "next/server";
import { getJimmyServiceToken, testJimmyServiceAuth } from "@/lib/jimmy-service-auth";
import { sendEmail, SendEmailParams, getRecentEmails, searchGoogleContacts } from "@/lib/google-services";

export async function GET() {
  try {
    const authTest = await testJimmyServiceAuth();
    return NextResponse.json(authTest);
  } catch (error) {
    return NextResponse.json({
      success: false,
      email: '',
      message: error instanceof Error ? error.message : 'Service account test failed',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, to, subject, emailBody, cc, bcc, search, limit } = body;

    // Get service account token
    const token = await getJimmyServiceToken();
    const email = 'norman.desilva@gmail.com'; // Jimmy acts on behalf of Norman

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

      const result = await sendEmail(token, params, email);
      return NextResponse.json({
        success: true,
        messageId: result.id,
        threadId: result.threadId,
        from: email,
        method: 'service_account',
      });
    }

    if (action === "search-contacts") {
      if (!search) {
        return NextResponse.json({ error: "Search query required" }, { status: 400 });
      }
      
      const contacts = await searchGoogleContacts(token, search);
      return NextResponse.json({ contacts });
    }

    if (action === "get-emails") {
      const emails = await getRecentEmails(token, limit || 10, search);
      return NextResponse.json({ 
        emails,
        account: email,
        method: 'service_account',
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Jimmy service account API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Service account action failed" },
      { status: 500 }
    );
  }
}