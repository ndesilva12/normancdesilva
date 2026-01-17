import { CompanyAnalysis, CompanySearchResult } from "@/types/company";

const XAI_API_KEY = process.env.XAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface AIResponse {
  content: string;
}

// Simple in-memory cache for AI responses (reduces API calls)
const responseCache = new Map<string, { response: AIResponse; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

function getCachedResponse(cacheKey: string): AIResponse | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }
  return null;
}

function setCachedResponse(cacheKey: string, response: AIResponse): void {
  responseCache.set(cacheKey, { response, timestamp: Date.now() });
  // Clean old entries if cache gets too large
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
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
      if (errorMsg.includes("401") || errorMsg.includes("403") || errorMsg.includes("invalid")) {
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

async function callGrok(prompt: string): Promise<AIResponse> {
  return retryWithBackoff(async () => {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-2",
        messages: [
          {
            role: "system",
            content: "You are a research analyst specializing in corporate political analysis. You provide factual, balanced analysis based on publicly available information. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok API error response:", errorText);
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  });
}

async function callClaude(prompt: string): Promise<AIResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return { content: data.content[0].text };
}

async function callAI(prompt: string, cacheKey?: string): Promise<AIResponse> {
  // Check cache first
  if (cacheKey) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log("Returning cached AI response");
      return cached;
    }
  }

  let response: AIResponse;

  // Try Grok first, fallback to Claude if Grok fails
  if (XAI_API_KEY) {
    try {
      response = await callGrok(prompt);
    } catch (grokError) {
      console.error("Grok failed, trying Claude fallback:", grokError);
      if (ANTHROPIC_API_KEY) {
        response = await callClaude(prompt);
      } else {
        throw grokError;
      }
    }
  } else if (ANTHROPIC_API_KEY) {
    response = await callClaude(prompt);
  } else {
    throw new Error("No AI API key configured");
  }

  // Cache the response
  if (cacheKey) {
    setCachedResponse(cacheKey, response);
  }

  return response;
}

export async function analyzeCompany(companyName: string): Promise<CompanyAnalysis> {
  const prompt = `Analyze the political leanings and corporate governance of "${companyName}".

Research and provide factual information about this company's:
- Political donations and PAC contributions
- Public policy positions
- Executive statements on political issues
- Lobbying activities
- Corporate governance policies on taxes, regulations, free speech, trade, and government spending
- Subsidiaries (companies owned)
- Key business partnerships and affiliates

Respond with a JSON object in this exact format:
{
  "companyName": "Full official company name",
  "ticker": "Stock ticker or null if private",
  "industry": "Primary industry",
  "description": "Brief company description (2-3 sentences)",
  "overallLeaning": "One of: Far Left, Left, Center-Left, Center, Center-Right, Right, Far Right",
  "confidenceScore": 0-100 based on data availability,
  "economicScore": -100 to 100 (left/right economic axis: -100=far left, 0=center, 100=far right),
  "governmentScore": -100 to 100 (government involvement axis: -100=libertarian/less govt, 0=moderate, 100=authoritarian/more govt),
  "positions": [
    {"topic": "Issue name", "stance": "Brief stance", "description": "Detailed explanation"}
  ],
  "subsidiaries": [
    {"name": "Subsidiary name", "industry": "Industry", "description": "Brief description", "acquisitionYear": "YYYY or null"}
  ],
  "affiliates": [
    {"name": "Partner/affiliate name", "relationship": "Type of partnership", "description": "Details about the business relationship and synergy"}
  ],
  "newsItems": [
    {"headline": "News headline", "source": "Publication", "date": "YYYY-MM", "summary": "Brief summary", "sentiment": "positive/negative/neutral"}
  ],
  "donations": [
    {"recipient": "Recipient name", "amount": "$X,XXX", "date": "YYYY", "party": "Democrat/Republican/Other/PAC"}
  ],
  "publicStatements": [
    {"speaker": "Name", "role": "Title", "statement": "Quote", "date": "YYYY-MM", "topic": "Topic"}
  ],
  "revenueAllocation": [
    {"category": "Category name", "percentage": 0-100, "description": "How funds are used"}
  ],
  "lobbyingActivities": [
    {"issue": "Issue lobbied", "amount": "$X,XXX", "year": "YYYY", "description": "Details"}
  ]
}

IMPORTANT REQUIREMENTS:
1. For "subsidiaries" array: Provide an EXTENSIVE LIST of at least 20-50 companies owned by this parent company. Include ALL known subsidiaries, acquisitions, owned brands, and controlled entities. This should be a comprehensive inventory.
2. For "affiliates" array: Provide an EXTENSIVE LIST of at least 20-50 business partners, joint ventures, strategic alliances, major suppliers, distribution partners, technology partners, and associated companies. Be thorough and comprehensive.
3. For other arrays (newsItems, donations, publicStatements, etc.): Provide 3-5 items each.
4. Be factual and cite real events where possible.
5. If information is limited, indicate lower confidence score.`;

  // Use company name as cache key
  const cacheKey = `company-analysis-${companyName.toLowerCase().replace(/\s+/g, "-")}`;
  const response = await callAI(prompt, cacheKey);

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response.content;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const analysis = JSON.parse(jsonStr.trim()) as CompanyAnalysis;
    return analysis;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Failed to parse company analysis");
  }
}

export async function searchCompaniesAI(query: string): Promise<CompanySearchResult[]> {
  const prompt = `Given the search query "${query}", suggest up to 10 publicly known companies that match this query.

Consider:
- Direct name matches
- Industry/sector matches
- Related companies or subsidiaries
- Companies known for this topic

Respond with a JSON array:
[
  {"name": "Company Name", "ticker": "TICK or null", "industry": "Industry", "description": "Brief description"}
]

Only include real, verifiable companies.`;

  // Use query as cache key
  const cacheKey = `company-search-${query.toLowerCase().replace(/\s+/g, "-")}`;
  const response = await callAI(prompt, cacheKey);

  try {
    let jsonStr = response.content;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    return JSON.parse(jsonStr.trim()) as CompanySearchResult[];
  } catch (error) {
    console.error("Failed to parse search results:", error);
    return [];
  }
}
