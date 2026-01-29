import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleAccountsStore } from "@/lib/google-calendar";
import { sendEmail, SendEmailParams, getRecentEmails, searchGoogleContacts } from "@/lib/google-services";

// Helper to get valid access token for Jimmy's use
async function getJimmyAccessToken(): Promise<{ token: string; email: string } | null> {
  const cookieStore = await cookies();

  // Try multi-account cookie first
  const accountsCookie = cookieStore.get("google_accounts");
  if (accountsCookie) {
    try {
      const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);
      const primaryEmail = accountsStore.primaryAccount || Object.keys(accountsStore.accounts)[0];
      const account = accountsStore.accounts[primaryEmail];

      if (account) {
        // Refresh token if needed
        if (account.expires_at < Date.now() + 60 * 1000 && account.refresh_token) {
          const refreshed = await refreshAccessToken(account.refresh_token);
          return { token: refreshed.access_token, email: primaryEmail };
        }
        return { token: account.access_token, email: primaryEmail };
      }
    } catch (error) {
      console.error("Error parsing accounts:", error);
    }
  }

  return null;
}

// POST - Send email (for Jimmy)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, to, subject, emailBody, cc, bcc, search, limit } = body;

    const auth = await getJimmyAccessToken();
    if (!auth) {
      return NextResponse.json(
        { error: "Gmail not authenticated. Please ensure Google account is connected in dashboard." },
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
  const auth = await getJimmyAccessToken();
  return NextResponse.json({
    authenticated: !!auth,
    email: auth?.email || null,
  });
}