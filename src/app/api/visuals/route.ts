import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, mode, action } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Handle image search (existing images)
    if (action === "search") {
      // Return URLs for image search engines
      const searchUrls = {
        google: `https://www.google.com/search?q=${encodeURIComponent(prompt)}&tbm=isch`,
        bing: `https://www.bing.com/images/search?q=${encodeURIComponent(prompt)}`,
        unsplash: `https://unsplash.com/s/photos/${encodeURIComponent(prompt.replace(/\s+/g, "-"))}`,
        pexels: `https://www.pexels.com/search/${encodeURIComponent(prompt)}/`,
      };

      return NextResponse.json({ searchUrls, action: "search" });
    }

    // Handle image generation
    if (action === "generate") {
      if (!OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "Image generation API not configured", isConfigError: true },
          { status: 503 }
        );
      }

      // Modify prompt based on mode
      let enhancedPrompt = prompt;
      if (mode === "data") {
        enhancedPrompt = `Create a clean, professional data visualization or infographic showing: ${prompt}. Use clear labels, modern design, and make it easy to understand.`;
      } else if (mode === "imagine") {
        enhancedPrompt = `Create an imaginative, creative, and visually stunning image of: ${prompt}. Be artistic and creative with the interpretation.`;
      }

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate image";

        try {
          const errorData = await response.json();
          console.error("OpenAI API error:", errorData);

          // Extract specific error message from OpenAI response
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          const errorText = await response.text().catch(() => "Unknown error");
          console.error("OpenAI API error (text):", errorText);
        }

        if (response.status === 401) {
          return NextResponse.json(
            { error: "OpenAI API key is invalid or missing", isConfigError: true },
            { status: 503 }
          );
        }

        if (response.status === 400) {
          return NextResponse.json(
            { error: errorMessage || "Invalid request - your prompt may contain content that cannot be generated" },
            { status: 400 }
          );
        }

        if (response.status === 429) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please try again in a moment." },
            { status: 429 }
          );
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: response.status || 500 }
        );
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      const revisedPrompt = data.data?.[0]?.revised_prompt;

      if (!imageUrl) {
        return NextResponse.json(
          { error: "No image generated" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        imageUrl,
        revisedPrompt,
        action: "generate",
        mode,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Visuals API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
