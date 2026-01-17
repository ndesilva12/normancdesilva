import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken, GoogleAccountsStore, GoogleTokens } from "@/lib/google-calendar";
import { sendEmail, SendEmailParams } from "@/lib/google-services";

// Helper to get valid access token and email
async function getAuthInfo(account?: string): Promise<{ token: string; email: string } | null> {
  const cookieStore = await cookies();

  // Try multi-account cookie first
  const accountsCookie = cookieStore.get("google_accounts");
  if (accountsCookie) {
    try {
      const accountsStore: GoogleAccountsStore = JSON.parse(accountsCookie.value);
      const targetEmail = account || accountsStore.primaryAccount || Object.keys(accountsStore.accounts)[0];
      const targetAccount = accountsStore.accounts[targetEmail];

      if (targetAccount) {
        if (targetAccount.expires_at < Date.now() + 60 * 1000 && targetAccount.refresh_token) {
          const refreshed = await refreshAccessToken(targetAccount.refresh_token);
          return { token: refreshed.access_token, email: targetEmail };
        }
        return { token: targetAccount.access_token, email: targetEmail };
      }
    } catch {
      // Fall through
    }
  }

  // Fallback to legacy token (won't have email)
  const tokensCookie = cookieStore.get("google_tokens");
  if (tokensCookie) {
    try {
      let tokens: GoogleTokens = JSON.parse(tokensCookie.value);
      if (tokens.expires_at < Date.now() + 60 * 1000 && tokens.refresh_token) {
        tokens = await refreshAccessToken(tokens.refresh_token);
      }
      // For legacy tokens, we don't have the email stored
      // The user will need to re-authenticate
      return null;
    } catch {
      // Fall through
    }
  }

  return null;
}

// POST - Send email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, cc, bcc, replyToMessageId, threadId, account } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json({ error: "Recipient (to) is required" }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!emailBody) {
      return NextResponse.json({ error: "Email body is required" }, { status: 400 });
    }

    const auth = await getAuthInfo(account);
    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated. Please re-connect your Google account." },
        { status: 401 }
      );
    }

    const params: SendEmailParams = {
      to,
      subject,
      body: emailBody,
      cc,
      bcc,
      replyToMessageId,
      threadId,
    };

    const result = await sendEmail(auth.token, params, auth.email);

    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
      from: auth.email,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
