// Temporary update for debugging

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Log the attempt to communicate for debugging
    console.log("Attempting to send message to Jimmy:", message);
    
    // Here you would typically call the Clawdbot API or command
    // For now, return a placeholder response to confirm the API route is working
    return NextResponse.json({
      role: "assistant",
      content: "This is a placeholder response from Jimmy. The actual connection to Clawdbot needs to be configured.",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error communicating with Jimmy:", error);
    return NextResponse.json({ error: "Failed to communicate with Jimmy", details: String(error) }, { status: 500 });
  }
}
