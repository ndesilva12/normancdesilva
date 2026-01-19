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

// Fetch and extract text content from a URL
async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContactFinder/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Basic HTML to text conversion - strip tags, normalize whitespace
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Limit to first 15000 chars to avoid token limits
    return text.slice(0, 15000);
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

// Try to find and fetch the team/about page from a website
async function fetchTeamPageContent(baseUrl: string): Promise<{ url: string; content: string } | null> {
  // Common paths for team/about pages
  const teamPaths = [
    '/about',
    '/team',
    '/about-us',
    '/our-team',
    '/people',
    '/staff',
    '/leadership',
    '/about/team',
    '/company',
    '/company/team',
    '/who-we-are',
  ];

  // Normalize base URL
  const base = baseUrl.replace(/\/$/, '');

  // First try the homepage
  const homepageContent = await fetchWebsiteContent(base);

  // Try each team path
  for (const path of teamPaths) {
    const fullUrl = `${base}${path}`;
    const content = await fetchWebsiteContent(fullUrl);
    if (content && content.length > 500) {
      // Check if it looks like a team page (has names/titles)
      const hasNames = /(?:CEO|Founder|Director|Manager|President|Partner|Producer|Executive)/i.test(content);
      if (hasNames) {
        console.log(`Found team page at: ${fullUrl}`);
        return { url: fullUrl, content };
      }
    }
  }

  // Return homepage content if no team page found
  if (homepageContent) {
    return { url: base, content: homepageContent };
  }

  return null;
}

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  webSearchQueries?: string[];
}

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

// Query Gemini API with Google Search grounding for verified links
async function queryGemini(prompt: string): Promise<{ content: string; groundedLinks: { title: string; url: string }[] }> {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an expert OSINT researcher. Always respond with valid JSON.\n\n${prompt}`,
              },
            ],
          },
        ],
        tools: [
          {
            google_search: {},
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
  const candidate = data.candidates?.[0];
  const content = candidate?.content?.parts?.[0]?.text || "";
  const groundingMetadata: GroundingMetadata = candidate?.groundingMetadata || {};

  // Extract real URLs from grounding metadata
  const groundedLinks: { title: string; url: string }[] = [];
  if (groundingMetadata.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      if (chunk.web?.uri && chunk.web?.title) {
        groundedLinks.push({
          title: chunk.web.title,
          url: chunk.web.uri,
        });
      }
    }
  }

  console.log(`Contact Finder (Gemini): Found ${groundedLinks.length} grounded links from Google Search`);

  return { content, groundedLinks };
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

// Check if URL is a valid, usable link (not a redirect/tracking URL)
function isValidUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  // Filter out Google/Vertex AI redirect URLs and tracking links
  if (lowerUrl.includes('vertexaisearch.cloud.google.com')) return false;
  if (lowerUrl.includes('google.com/url')) return false;
  if (lowerUrl.includes('googleapis.com')) return false;
  if (lowerUrl.includes('/redirect')) return false;
  return true;
}

// Enrich contacts with grounded links - ONLY verify existing URL contacts, don't add new ones
// Priority: Keep AI-generated emails, social handles, and contact info intact
function enrichContactsWithGroundedLinks(
  results: ContactResult[],
  groundedLinks: { title: string; url: string }[]
): ContactResult[] {
  // Filter to only valid, usable URLs
  const validGroundedLinks = groundedLinks.filter(gl => isValidUrl(gl.url));

  if (validGroundedLinks.length === 0) return results;

  console.log(`Contact Finder: Using ${validGroundedLinks.length} valid grounded links (filtered from ${groundedLinks.length})`);

  return results.map(result => {
    const enrichedContacts = result.contacts.map(contact => {
      // ONLY verify website/form contacts - leave emails, phones, social handles alone
      // The AI's email guesses and social handles are valuable even if unverified
      if (contact.type === "website" || contact.type === "form") {
        // Try to find a matching grounded link
        const matchingLink = validGroundedLinks.find(gl => {
          const lowerTitle = gl.title.toLowerCase();
          const lowerUrl = gl.url.toLowerCase();
          const resultName = result.name.toLowerCase();
          const resultOrg = (result.organization || "").toLowerCase();

          // Match by organization or person name in the URL/title
          const nameMatch = resultName.split(" ")[0];
          const orgMatch = resultOrg.split(" ")[0];

          return (
            (nameMatch.length > 2 && (lowerTitle.includes(nameMatch) || lowerUrl.includes(nameMatch))) ||
            (orgMatch.length > 2 && (lowerTitle.includes(orgMatch) || lowerUrl.includes(orgMatch)))
          );
        });

        if (matchingLink) {
          return {
            ...contact,
            value: matchingLink.url,
            source: `Verified: ${matchingLink.title}`,
            confidence: "high" as const,
          };
        }
      }

      // Return all other contacts unchanged - emails, phones, social handles, etc.
      return contact;
    });

    return {
      ...result,
      contacts: enrichedContacts,
    };
  });
}

// Get fallback AI sources in priority order
function getFallbackSources(primary: AISource): AISource[] {
  const fallbacks: AISource[] = [];
  const allSources: AISource[] = ["gemini", "grok", "claude", "chatgpt"]; // Gemini first for grounding

  // Add other sources as fallbacks, checking if API key is available
  for (const source of allSources) {
    if (source === primary) continue;
    if (source === "gemini" && GEMINI_API_KEY) fallbacks.push(source);
    if (source === "grok" && XAI_API_KEY) fallbacks.push(source);
    if (source === "claude" && ANTHROPIC_API_KEY) fallbacks.push(source);
    if (source === "chatgpt" && OPENAI_API_KEY) fallbacks.push(source);
  }

  return fallbacks;
}

// Step 1: Use Gemini to find the company website URL
async function findCompanyWebsite(query: string): Promise<{ url: string; domain: string } | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `What is the official website URL for "${query}"? Return ONLY the URL, nothing else. Example: https://example.com` }],
            },
          ],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";
    const groundingMetadata = candidate?.groundingMetadata || {};

    // Try to extract URL from grounding chunks first (most reliable)
    if (groundingMetadata.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && isValidUrl(chunk.web.uri)) {
          const url = chunk.web.uri;
          const domain = new URL(url).hostname.replace('www.', '');
          console.log(`Found company website via grounding: ${url}`);
          return { url, domain };
        }
      }
    }

    // Try to extract URL from response text
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch && isValidUrl(urlMatch[0])) {
      const url = urlMatch[0].replace(/[.,;:!?)]+$/, ''); // Remove trailing punctuation
      const domain = new URL(url).hostname.replace('www.', '');
      return { url, domain };
    }

    return null;
  } catch (error) {
    console.error("Failed to find company website:", error);
    return null;
  }
}

// Generate prompt with actual website content included
function getEnhancedTargetPrompt(query: string, websiteUrl: string, websiteContent: string): string {
  return `You are an expert OSINT researcher. I need to find contacts at a company.

TARGET: ${query}
VERIFIED WEBSITE: ${websiteUrl}

ACTUAL CONTENT FROM THE COMPANY WEBSITE (extracted team/about page):
---
${websiteContent}
---

Based on the ACTUAL WEBSITE CONTENT above, extract:
1. Real names and titles of people who work there
2. Any email addresses or email format patterns you can see
3. Any contact information visible

DO NOT make up fictional people. Only include people whose names appear in the website content above.

For each real person found, you can SPECULATE their email using the company domain and common email formats (firstname.lastname@, firstname@, etc.), but mark it as speculative.

OUTPUT FORMAT (JSON):
{
  "results": [
    {
      "name": "[Company Name] - Official Website",
      "title": "Verified Company Domain",
      "organization": "[Company Name]",
      "contacts": [{ "type": "website", "value": "${websiteUrl}", "confidence": "high", "source": "Verified", "notes": "Official website" }],
      "personalizationHooks": [],
      "reasoning": "Verified company website",
      "additionalNotes": "Email format: [pattern if found]"
    },
    {
      "name": "Real Person Name FROM WEBSITE CONTENT",
      "title": "Their Title FROM WEBSITE CONTENT",
      "organization": "[Company]",
      "contacts": [
        { "type": "email", "value": "speculated.email@domain.com", "confidence": "speculative", "source": "Speculated from name + domain", "notes": "Format: firstname.lastname@domain" }
      ],
      "personalizationHooks": ["Any facts about them from the website content"],
      "reasoning": "Found on company website at ${websiteUrl}",
      "additionalNotes": ""
    }
  ],
  "summary": "Found X real people on company website. Email format: [pattern]. Domain: [domain]"
}

Respond with valid JSON only.`;
}

// Main search function with website scraping for target searches
async function runSearch(
  query: string,
  searchType: SearchType,
  aiSource: AISource
): Promise<{ results: ContactResult[]; summary: string; actualSource?: AISource }> {

  // For target searches, try to actually fetch the company website first
  if (searchType === "target") {
    console.log(`Target search for: ${query} - attempting to fetch actual website...`);

    // Step 1: Find the company website
    const website = await findCompanyWebsite(query);

    if (website) {
      console.log(`Found website: ${website.url}`);

      // Step 2: Fetch the team/about page
      const teamPage = await fetchTeamPageContent(website.url);

      if (teamPage && teamPage.content.length > 200) {
        console.log(`Fetched team page content (${teamPage.content.length} chars) from: ${teamPage.url}`);

        // Step 3: Send the actual website content to the LLM
        const enhancedPrompt = getEnhancedTargetPrompt(query, website.url, teamPage.content);

        // Use Gemini for this enhanced prompt
        try {
          const { content } = await queryGemini(enhancedPrompt);
          const parsed = parseAIResponse(content);

          // The results now come from ACTUAL website content
          return {
            results: parsed.results,
            summary: `${parsed.summary} (Extracted from actual website content at ${teamPage.url})`,
            actualSource: "gemini",
          };
        } catch (error) {
          console.error("Enhanced search failed, falling back to standard search:", error);
        }
      }
    }
  }

  // Standard search (for individual searches or if website fetch failed)
  const prompt =
    searchType === "individual" ? getIndividualSearchPrompt(query) : getTargetSearchPrompt(query);

  // Query function for a given source
  const querySource = async (source: AISource): Promise<{ content: string; groundedLinks: { title: string; url: string }[] }> => {
    switch (source) {
      case "grok":
        return { content: await queryGrok(prompt), groundedLinks: [] };
      case "chatgpt":
        return { content: await queryChatGPT(prompt), groundedLinks: [] };
      case "claude":
        return { content: await queryClaude(prompt), groundedLinks: [] };
      case "gemini":
        return await queryGemini(prompt);
      default:
        throw new Error(`Unknown AI source: ${source}`);
    }
  };

  // Try primary source first
  try {
    const { content, groundedLinks } = await querySource(aiSource);
    const parsed = parseAIResponse(content);

    // Enrich contacts with grounded links (only useful for Gemini)
    const enrichedResults = enrichContactsWithGroundedLinks(parsed.results, groundedLinks);

    return { results: enrichedResults, summary: parsed.summary, actualSource: aiSource };
  } catch (primaryError) {
    console.error(`Primary AI source ${aiSource} failed:`, primaryError);

    // Try fallback sources
    const fallbacks = getFallbackSources(aiSource);
    for (const fallbackSource of fallbacks) {
      try {
        console.log(`Trying fallback AI source: ${fallbackSource}`);
        const { content, groundedLinks } = await querySource(fallbackSource);
        const parsed = parseAIResponse(content);
        const enrichedResults = enrichContactsWithGroundedLinks(parsed.results, groundedLinks);
        return { results: enrichedResults, summary: parsed.summary, actualSource: fallbackSource };
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
