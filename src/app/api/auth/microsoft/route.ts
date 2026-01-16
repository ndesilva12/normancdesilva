import { NextResponse } from "next/server";
import { getMicrosoftAuthUrl } from "@/lib/microsoft-graph";

export async function GET() {
  try {
    const authUrl = getMicrosoftAuthUrl();
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating Microsoft auth URL:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
