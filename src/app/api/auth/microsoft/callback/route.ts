import { NextResponse } from "next/server";
import { exchangeMicrosoftCodeForTokens } from "@/lib/microsoft-graph";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?microsoft_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?microsoft_error=no_code", request.url)
    );
  }

  try {
    const tokens = await exchangeMicrosoftCodeForTokens(code);

    // Create response that redirects to home page
    const response = NextResponse.redirect(new URL("/?microsoft_connected=true", request.url));

    // Store tokens in a cookie (httpOnly for security)
    response.cookies.set("microsoft_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Error exchanging Microsoft code:", err);
    return NextResponse.redirect(
      new URL(`/?microsoft_error=${encodeURIComponent(err instanceof Error ? err.message : "auth_failed")}`, request.url)
    );
  }
}
