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

// Query Grok API
async function queryGrok(prompt: string): Promise<string> {
  if (!XAI_API_KEY) throw new Error("Grok API key not configured");

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

// Main search function
async function runSearch(
  query: string,
  searchType: SearchType,
  aiSource: AISource
): Promise<{ results: ContactResult[]; summary: string }> {
  const prompt =
    searchType === "individual" ? getIndividualSearchPrompt(query) : getTargetSearchPrompt(query);

  let response: string;

  switch (aiSource) {
    case "grok":
      response = await queryGrok(prompt);
      break;
    case "chatgpt":
      response = await queryChatGPT(prompt);
      break;
    case "claude":
      response = await queryClaude(prompt);
      break;
    case "gemini":
      response = await queryGemini(prompt);
      break;
    default:
      throw new Error(`Unknown AI source: ${aiSource}`);
  }

  return parseAIResponse(response);
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
    const { results, summary } = await runSearch(query, searchType, aiSource);

    // Create the search result object
    const searchResult: SearchResult = {
      id: generateId(),
      query,
      searchType,
      aiSource,
      results,
      summary,
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
