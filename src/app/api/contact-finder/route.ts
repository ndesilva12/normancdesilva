import { NextResponse } from "next/server";
import {
  SearchType,
  AISource,
  SearchResult,
  ContactResult,
  AI_CONFIGS,
  getIndividualSearchPrompt,
  getTargetSearchPrompt,
  CONTACT_FINDER_DISCLAIMER,
} from "@/lib/contact-finder";

// API Keys
const XAI_API_KEY = process.env.XAI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Generate unique ID
function generateId(): string {
  return `cf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMsg = lastError.message.toLowerCase();

      // Don't retry on auth errors or invalid requests
      if (errorMsg.includes("401") || errorMsg.includes("403") || errorMsg.includes("not configured")) {
        throw lastError;
      }

      // Check if it's a rate limit error (429) or server error (5xx)
      if (errorMsg.includes("429") || errorMsg.includes("rate") || errorMsg.includes("5")) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

// Query Grok API with retry
async function queryGrok(prompt: string): Promise<string> {
  if (!XAI_API_KEY) throw new Error("Grok API key not configured");

  return retryWithBackoff(async () => {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_CONFIGS.grok.model,
        messages: [
          {
            role: "system",
            content: "You are an expert OSINT researcher. Always respond with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  });
}

// Query ChatGPT API
async function queryChatGPT(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("ChatGPT API key not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_CONFIGS.chatgpt.model,
      messages: [
        {
          role: "system",
          content: "You are an expert OSINT researcher. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ChatGPT API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Query Claude API
async function queryClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error("Claude API key not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_CONFIGS.claude.model,
      max_tokens: 4096,
      system: "You are an expert OSINT researcher. Always respond with valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0]?.text || "";
}

// Query Gemini API
async function queryGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIGS.gemini.model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert OSINT researcher. Always respond with valid JSON.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Parse AI response to extract JSON
function parseAIResponse(response: string): { results: ContactResult[]; summary: string } {
  // Try to extract JSON from the response
  let jsonStr = response;

  // Look for JSON in code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Try to find JSON object directly
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      results: parsed.results || [],
      summary: parsed.summary || "Search completed. Review results below.",
    };
  } catch {
    // If parsing fails, create a basic result from the text
    return {
      results: [
        {
          name: "Search Results",
          contacts: [],
          reasoning: response,
          additionalNotes: "Unable to parse structured results. Raw response provided.",
        },
      ],
      summary: "Search completed but results could not be fully structured.",
    };
  }
}

// Get fallback AI sources in priority order
function getFallbackSources(primary: AISource): AISource[] {
  const fallbacks: AISource[] = [];
  const allSources: AISource[] = ["grok", "claude", "chatgpt", "gemini"];

  // Add other sources as fallbacks, checking if API key is available
  for (const source of allSources) {
    if (source === primary) continue;
    if (source === "grok" && XAI_API_KEY) fallbacks.push(source);
    if (source === "claude" && ANTHROPIC_API_KEY) fallbacks.push(source);
    if (source === "chatgpt" && OPENAI_API_KEY) fallbacks.push(source);
    if (source === "gemini" && GEMINI_API_KEY) fallbacks.push(source);
  }

  return fallbacks;
}

// Main search function with fallback
async function runSearch(
  query: string,
  searchType: SearchType,
  aiSource: AISource
): Promise<{ results: ContactResult[]; summary: string; actualSource?: AISource }> {
  const prompt =
    searchType === "individual" ? getIndividualSearchPrompt(query) : getTargetSearchPrompt(query);

  // Query function for a given source
  const querySource = async (source: AISource): Promise<string> => {
    switch (source) {
      case "grok":
        return await queryGrok(prompt);
      case "chatgpt":
        return await queryChatGPT(prompt);
      case "claude":
        return await queryClaude(prompt);
      case "gemini":
        return await queryGemini(prompt);
      default:
        throw new Error(`Unknown AI source: ${source}`);
    }
  };

  // Try primary source first
  try {
    const response = await querySource(aiSource);
    const parsed = parseAIResponse(response);
    return { ...parsed, actualSource: aiSource };
  } catch (primaryError) {
    console.error(`Primary AI source ${aiSource} failed:`, primaryError);

    // Try fallback sources
    const fallbacks = getFallbackSources(aiSource);
    for (const fallbackSource of fallbacks) {
      try {
        console.log(`Trying fallback AI source: ${fallbackSource}`);
        const response = await querySource(fallbackSource);
        const parsed = parseAIResponse(response);
        return { ...parsed, actualSource: fallbackSource };
      } catch (fallbackError) {
        console.error(`Fallback AI source ${fallbackSource} failed:`, fallbackError);
      }
    }

    // If all sources fail, throw the original error
    throw primaryError;
  }
}

// POST - Run a new search
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, searchType, aiSource, userId } = body as {
      query: string;
      searchType: SearchType;
      aiSource: AISource;
      userId: string;
    };

    if (!query || !searchType || !aiSource || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: query, searchType, aiSource, userId" },
        { status: 400 }
      );
    }

    // Validate search type
    if (searchType !== "individual" && searchType !== "target") {
      return NextResponse.json(
        { error: "Invalid searchType. Must be 'individual' or 'target'" },
        { status: 400 }
      );
    }

    // Validate AI source
    if (!["grok", "chatgpt", "claude", "gemini"].includes(aiSource)) {
      return NextResponse.json(
        { error: "Invalid aiSource. Must be 'grok', 'chatgpt', 'claude', or 'gemini'" },
        { status: 400 }
      );
    }

    // Run the search
    const { results, summary, actualSource } = await runSearch(query, searchType, aiSource);

    // Create the search result object
    const searchResult: SearchResult = {
      id: generateId(),
      query,
      searchType,
      aiSource: actualSource || aiSource, // Use the actual source that worked
      results,
      summary: actualSource && actualSource !== aiSource
        ? `${summary} (Note: Fallback to ${actualSource} was used due to ${aiSource} unavailability)`
        : summary,
      disclaimer: CONTACT_FINDER_DISCLAIMER,
      createdAt: new Date().toISOString(),
      userId,
    };

    return NextResponse.json(searchResult);
  } catch (error) {
    console.error("Contact finder error:", error);
    const errorMessage = error instanceof Error ? error.message : "Search failed";

    // Check for specific API key errors
    if (errorMessage.includes("API key not configured")) {
      return NextResponse.json(
        { error: errorMessage, code: "API_KEY_MISSING" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
