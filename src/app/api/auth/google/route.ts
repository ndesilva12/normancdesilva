import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get("returnUrl") || undefined;
    const addAccount = searchParams.get("addAccount") === "true";
    const reauthorize = searchParams.get("reauthorize") === "true";

    // If reauthorizing, clear existing tokens to force fresh consent
    if (reauthorize) {
      const cookieStore = await cookies();
      cookieStore.delete("google_tokens");
      cookieStore.delete("google_accounts");
    }

    const authUrl = getGoogleAuthUrl(returnUrl, addAccount);
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
