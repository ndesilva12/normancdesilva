import { NextRequest, NextResponse } from "next/server";

// Use the HTTP relay instead of WebSocket
const RELAY_URL = "https://ip-172-31-15-64.tailf5ae1d.ts.net:8443";

export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Forward to the relay
    const response = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, userId }),
    });

    if (!response.ok) {
      throw new Error(`Relay error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Jimmy API error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with Jimmy" },
      { status: 500 }
    );
  }
}
