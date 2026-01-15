import { CompanyAnalysis, CompanySearchResult } from "@/types/company";

const GROK_API_KEY = process.env.GROK_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface AIResponse {
  content: string;
}

async function callGrok(prompt: string): Promise<AIResponse> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-2-latest",
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

async function callAI(prompt: string): Promise<AIResponse> {
  // Prefer Grok, fallback to Claude
  if (GROK_API_KEY) {
    return callGrok(prompt);
  } else if (ANTHROPIC_API_KEY) {
    return callClaude(prompt);
  } else {
    throw new Error("No AI API key configured");
  }
}

export async function analyzeCompany(companyName: string): Promise<CompanyAnalysis> {
  const prompt = `Analyze the political leanings and corporate governance of "${companyName}".

Research and provide factual information about this company's:
- Political donations and PAC contributions
- Public policy positions
- Executive statements on political issues
- Lobbying activities
- Corporate governance policies on taxes, regulations, free speech, trade, and government spending

Respond with a JSON object in this exact format:
{
  "companyName": "Full official company name",
  "ticker": "Stock ticker or null if private",
  "industry": "Primary industry",
  "description": "Brief company description (2-3 sentences)",
  "overallLeaning": "One of: Far Left, Left, Center-Left, Center, Center-Right, Right, Far Right",
  "confidenceScore": 0-100 based on data availability,
  "positions": [
    {"topic": "Issue name", "stance": "Brief stance", "description": "Detailed explanation"}
  ],
  "affiliates": [
    {"name": "Affiliate name", "relationship": "Type of relationship", "description": "Details"}
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

Provide 3-5 items for each array. Be factual and cite real events where possible. If information is limited, indicate lower confidence score.`;

  const response = await callAI(prompt);

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

  const response = await callAI(prompt);

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
