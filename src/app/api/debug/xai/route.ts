import { NextResponse } from "next/server";

// Debug endpoint to test XAI/Grok API key
export async function GET() {
  const XAI_API_KEY = process.env.XAI_API_KEY;

  if (!XAI_API_KEY) {
    return NextResponse.json({
      success: false,
      error: "XAI_API_KEY is not set in environment variables",
      keyPresent: false,
    });
  }

  // Check key format (should start with certain prefix typically)
  const keyInfo = {
    length: XAI_API_KEY.length,
    prefix: XAI_API_KEY.substring(0, 4) + "...",
    hasWhitespace: XAI_API_KEY !== XAI_API_KEY.trim(),
  };

  // Try to make a simple API call
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          { role: "user", content: "Say 'API key is working' and nothing else." },
        ],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `API returned ${response.status}: ${errorText}`,
        keyPresent: true,
        keyInfo,
        httpStatus: response.status,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No content";

    return NextResponse.json({
      success: true,
      message: "XAI API key is working!",
      response: content,
      keyPresent: true,
      keyInfo,
      model: data.model,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      keyPresent: true,
      keyInfo,
    });
  }
}
