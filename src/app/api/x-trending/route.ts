import { NextResponse } from "next/server";

export interface TrendingTopic {
  topic: string;
  description?: string;
  searchUrl: string;
}

export async function GET() {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "XAI_API_KEY not configured. Please add it to your environment variables." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          {
            role: "system",
            content: `You are Grok, an AI with real-time access to X (formerly Twitter). Your task is to provide current trending topics.
Return ONLY a JSON array of trending topics. Each item should have:
- "topic": the trending topic or hashtag (string)
- "description": a brief 1-sentence description of why it's trending (string)

Return exactly 15-20 topics. Format: [{"topic": "...", "description": "..."}, ...]
Do not include any markdown formatting, code blocks, or explanations - just the raw JSON array.`
          },
          {
            role: "user",
            content: "What are the current trending topics on X right now? Include a mix of news, entertainment, sports, and general trends."
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("xAI API error:", response.status, errorData);
      throw new Error(`xAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response from Grok
    let topics: TrendingTopic[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        topics = parsed.map((item: { topic: string; description?: string }) => ({
          topic: item.topic,
          description: item.description,
          searchUrl: `https://x.com/search?q=${encodeURIComponent(item.topic)}&src=typed_query`,
        }));
      }
    } catch (parseError) {
      console.error("Failed to parse Grok response:", parseError);
      // If JSON parsing fails, try to extract topics from plain text
      const lines = content.split("\n").filter((line: string) => line.trim());
      topics = lines.slice(0, 20).map((line: string) => {
        const cleaned = line.replace(/^[\d.\-\*]+\s*/, "").trim();
        return {
          topic: cleaned,
          description: undefined,
          searchUrl: `https://x.com/search?q=${encodeURIComponent(cleaned)}&src=typed_query`,
        };
      });
    }

    return NextResponse.json({ topics, source: "xai" });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trending topics" },
      { status: 500 }
    );
  }
}
