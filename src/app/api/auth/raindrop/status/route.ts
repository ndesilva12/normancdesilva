import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("raindrop_access_token")?.value;

  // Also check for test token in env
  const testToken = process.env.RAINDROP_TOKEN;

  return NextResponse.json({
    connected: !!(accessToken || testToken),
    hasOAuthToken: !!accessToken,
    hasTestToken: !!testToken,
  });
}
