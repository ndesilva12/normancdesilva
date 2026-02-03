import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
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
      // Use a timeout to prevent hanging (Node.js fetch supports AbortSignal.timeout in newer versions)
    }).catch(err => {
      throw new Error(`Fetch error: ${err.message}`);
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
