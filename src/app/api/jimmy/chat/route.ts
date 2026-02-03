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
    
    // Call the Clawdbot API on the EC2 instance
    const response = await fetch('http://3.128.31.231/clawdbot-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add API key or token here if set up
      },
      body: JSON.stringify({ message }),
      timeout: 10000, // 10 seconds timeout
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      role: "assistant",
      content: data.response || "Response from Jimmy received.",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error communicating with Jimmy:", error);
    return NextResponse.json({ error: "Failed to communicate with Jimmy", details: String(error) }, { status: 500 });
  }
}
