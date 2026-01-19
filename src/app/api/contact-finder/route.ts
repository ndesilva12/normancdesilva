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

// Fetch and extract text content from a URL with better parsing
async function fetchWebsiteContent(url: string): Promise<{ text: string; html: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Basic HTML to text conversion - strip tags, normalize whitespace
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    return {
      text: text.slice(0, 20000),
      html: html.slice(0, 50000) // Keep HTML for structured extraction
    };
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

// Extract potential names and titles from HTML using common patterns
function extractPeopleFromHTML(html: string): { name: string; title?: string }[] {
  const people: { name: string; title?: string }[] = [];
  const seenNames = new Set<string>();

  // Common title patterns
  const titles = ['CEO', 'COO', 'CFO', 'CTO', 'CMO', 'President', 'Vice President', 'VP',
    'Director', 'Manager', 'Founder', 'Co-Founder', 'Partner', 'Principal', 'Owner',
    'Producer', 'Executive Producer', 'Creative Director', 'Head of', 'Chief',
    'Editor', 'Writer', 'Designer', 'Lead', 'Senior', 'Managing Director'];

  // Pattern 1: Look for structured person markup (common in about/team pages)
  // Matches: <h3>John Smith</h3><p>CEO</p> or similar
  const structuredPattern = /<(?:h[1-6]|strong|b|span)[^>]*>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/(?:h[1-6]|strong|b|span)>/gi;
  let match;
  while ((match = structuredPattern.exec(html)) !== null) {
    const name = match[1].trim();
    if (name.length > 4 && name.length < 50 && !seenNames.has(name.toLowerCase())) {
      // Check if a title follows nearby
      const after = html.slice(match.index, match.index + 300);
      const titleMatch = titles.find(t => new RegExp(t, 'i').test(after));
      people.push({ name, title: titleMatch });
      seenNames.add(name.toLowerCase());
    }
  }

  // Pattern 2: Look for "Name, Title" or "Name - Title" patterns
  const nameWithTitlePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)[\s,\-–—]+(?:is\s+)?(?:the\s+)?(\b(?:CEO|COO|CFO|CTO|CMO|President|Vice President|VP|Director|Manager|Founder|Co-Founder|Partner|Principal|Owner|Producer|Executive Producer|Creative Director|Head of [A-Za-z]+|Chief [A-Za-z]+ Officer)\b)/gi;
  while ((match = nameWithTitlePattern.exec(html)) !== null) {
    const name = match[1].trim();
    const title = match[2].trim();
    if (name.length > 4 && name.length < 50 && !seenNames.has(name.toLowerCase())) {
      people.push({ name, title });
      seenNames.add(name.toLowerCase());
    }
  }

  // Pattern 3: JSON-LD structured data
  const jsonLdPattern = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      const extractFromObject = (obj: Record<string, unknown>) => {
        if (obj['@type'] === 'Person' && typeof obj.name === 'string') {
          const name = obj.name as string;
          if (!seenNames.has(name.toLowerCase())) {
            people.push({ name, title: obj.jobTitle as string | undefined });
            seenNames.add(name.toLowerCase());
          }
        }
        for (const value of Object.values(obj)) {
          if (Array.isArray(value)) {
            value.forEach(item => {
              if (typeof item === 'object' && item !== null) extractFromObject(item as Record<string, unknown>);
            });
          } else if (typeof value === 'object' && value !== null) {
            extractFromObject(value as Record<string, unknown>);
          }
        }
      };
      if (Array.isArray(jsonData)) {
        jsonData.forEach(item => {
          if (typeof item === 'object' && item !== null) extractFromObject(item as Record<string, unknown>);
        });
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        extractFromObject(jsonData as Record<string, unknown>);
      }
    } catch {
      // JSON parse failed, skip
    }
  }

  return people.slice(0, 20); // Limit to 20 people
}

// Try to find and fetch the team/about page from a website
async function fetchTeamPageContent(baseUrl: string): Promise<{ url: string; text: string; html: string; extractedPeople: { name: string; title?: string }[] } | null> {
  // Extensive list of common paths for team/about pages
  const teamPaths = [
    '/about',
    '/team',
    '/about-us',
    '/our-team',
    '/people',
    '/staff',
    '/leadership',
    '/about/team',
    '/about/leadership',
    '/about/people',
    '/company',
    '/company/team',
    '/company/leadership',
    '/company/about',
    '/who-we-are',
    '/meet-the-team',
    '/meet-us',
    '/our-people',
    '/the-team',
    '/crew',
    '/filmmakers',
    '/directors',
    '/executives',
    '/management',
    '/bios',
    '/roster',
    '/talent',
    '/contact',
    '/contact-us',
    '/about/staff',
  ];

  // Normalize base URL
  const base = baseUrl.replace(/\/$/, '');
  const results: { url: string; text: string; html: string; extractedPeople: { name: string; title?: string }[]; score: number }[] = [];

  // First try the homepage
  const homepageResult = await fetchWebsiteContent(base);
  if (homepageResult) {
    const extractedPeople = extractPeopleFromHTML(homepageResult.html);
    const hasTeamIndicators = /(?:CEO|Founder|Director|Manager|President|Partner|Producer|Executive|Our Team|Meet the|Leadership)/i.test(homepageResult.text);
    results.push({
      url: base,
      text: homepageResult.text,
      html: homepageResult.html,
      extractedPeople,
      score: extractedPeople.length * 10 + (hasTeamIndicators ? 5 : 0)
    });
  }

  // Try team paths in parallel (batch of 5 at a time)
  for (let i = 0; i < teamPaths.length; i += 5) {
    const batch = teamPaths.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(async (path) => {
        const fullUrl = `${base}${path}`;
        const content = await fetchWebsiteContent(fullUrl);
        if (content && content.text.length > 300) {
          const extractedPeople = extractPeopleFromHTML(content.html);
          const hasTeamIndicators = /(?:CEO|Founder|Director|Manager|President|Partner|Producer|Executive|Our Team|Meet the|Leadership)/i.test(content.text);
          const hasMultipleNames = (content.text.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/g) || []).length;
          return {
            url: fullUrl,
            text: content.text,
            html: content.html,
            extractedPeople,
            score: extractedPeople.length * 10 + (hasTeamIndicators ? 5 : 0) + Math.min(hasMultipleNames, 10)
          };
        }
        return null;
      })
    );

    for (const result of batchResults) {
      if (result) {
        results.push(result);
        // If we found a page with people extracted, prioritize it
        if (result.extractedPeople.length >= 3) {
          console.log(`Found team page with ${result.extractedPeople.length} people at: ${result.url}`);
          return result;
        }
      }
    }
  }

  // Sort by score and return best result
  results.sort((a, b) => b.score - a.score);
  if (results.length > 0) {
    const best = results[0];
    console.log(`Best page found: ${best.url} with ${best.extractedPeople.length} extracted people`);
    return best;
  }

  return null;
}

// Search for company employees using external sources via Gemini grounding
async function searchExternalSources(companyName: string, domain: string): Promise<string> {
  if (!GEMINI_API_KEY) return '';

  const searchQuery = `Find real employees who work at "${companyName}". Search LinkedIn, company press releases, news articles, IMDb (if entertainment), and business databases. Return actual names and job titles of people who verifiably work there.

IMPORTANT: Only return names of REAL people you find in search results. Include where you found each person (LinkedIn, news article, etc.)

List the people you find with their titles and sources.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: searchQuery }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!response.ok) return '';

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`External source search found: ${text.slice(0, 200)}...`);
    return text;
  } catch (error) {
    console.error("External source search failed:", error);
    return '';
  }
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

// Generate prompt with actual website content and extracted people
function getEnhancedTargetPrompt(
  query: string,
  websiteUrl: string,
  websiteContent: string,
  extractedPeople: { name: string; title?: string }[],
  externalSourceResults: string
): string {
  const domain = new URL(websiteUrl).hostname.replace('www.', '');

  const extractedPeopleText = extractedPeople.length > 0
    ? `\n\nPEOPLE ALREADY EXTRACTED FROM WEBSITE HTML (these are REAL - verified from HTML structure):\n${extractedPeople.map(p => `- ${p.name}${p.title ? ` (${p.title})` : ''}`).join('\n')}`
    : '';

  const externalSourceText = externalSourceResults
    ? `\n\nEMPLOYEES FOUND FROM EXTERNAL SOURCES (LinkedIn, news, databases):\n---\n${externalSourceResults}\n---`
    : '';

  return `You are an expert OSINT researcher. I need to find contacts at a company.

TARGET: ${query}
VERIFIED WEBSITE: ${websiteUrl}
DOMAIN: ${domain}
${extractedPeopleText}
${externalSourceText}

ACTUAL CONTENT FROM THE COMPANY WEBSITE (team/about page):
---
${websiteContent.slice(0, 12000)}
---

YOUR TASK:
1. Use the EXTRACTED PEOPLE list above as your primary source - these are VERIFIED from the HTML
2. If external source results found additional people, include them (with source citation)
3. Look through the website content for any additional names you can find
4. For each REAL person, speculate their email using ${domain}

CRITICAL RULES:
- The people in "PEOPLE ALREADY EXTRACTED" are REAL - include all of them
- Only add additional people if you can cite WHERE you found them
- DO NOT invent fictional people like "Jane Smith" or "John Doe"
- You CAN speculate emails for REAL people using the domain ${domain}

OUTPUT FORMAT (JSON):
{
  "results": [
    {
      "name": "${query} - Official Website",
      "title": "Verified Company Domain",
      "organization": "${query}",
      "contacts": [{ "type": "website", "value": "${websiteUrl}", "confidence": "high", "source": "Verified", "notes": "Official website - domain: ${domain}" }],
      "personalizationHooks": [],
      "reasoning": "Verified company website",
      "additionalNotes": "Use this domain for emails: ${domain}"
    },
    {
      "name": "[REAL Person Name]",
      "title": "[Their Title]",
      "organization": "${query}",
      "contacts": [
        { "type": "email", "value": "firstname.lastname@${domain}", "confidence": "speculative", "source": "Speculated using name + verified domain", "notes": "Format: firstname.lastname@${domain}" }
      ],
      "personalizationHooks": ["[Real fact about them if found]"],
      "reasoning": "Found on company website / Found via LinkedIn / Found in extracted HTML",
      "additionalNotes": ""
    }
  ],
  "summary": "Found X real people. Domain: ${domain}. Email format: [pattern]"
}

Respond with valid JSON only. Include ALL people from the extracted list.`;
}

// Main search function with website scraping for target searches
async function runSearch(
  query: string,
  searchType: SearchType,
  aiSource: AISource
): Promise<{ results: ContactResult[]; summary: string; actualSource?: AISource }> {

  // For target searches, try to actually fetch the company website first
  if (searchType === "target") {
    console.log(`Target search for: ${query} - attempting multi-strategy approach...`);

    // Step 1: Find the company website
    const website = await findCompanyWebsite(query);

    if (website) {
      console.log(`Found website: ${website.url} (domain: ${website.domain})`);

      // Step 2: Fetch and parse the team/about page
      const teamPage = await fetchTeamPageContent(website.url);

      // Step 3: If we didn't find enough people from website, search external sources
      let externalResults = '';
      const extractedPeople = teamPage?.extractedPeople || [];

      if (extractedPeople.length < 2) {
        console.log(`Only found ${extractedPeople.length} people from website, searching external sources...`);
        externalResults = await searchExternalSources(query, website.domain);
      }

      // Step 4: Build comprehensive prompt with all data sources
      if (teamPage || externalResults) {
        const websiteContent = teamPage?.text || '';
        console.log(`Building enhanced prompt with: ${extractedPeople.length} extracted people, ${websiteContent.length} chars content, ${externalResults.length > 0 ? 'external results' : 'no external results'}`);

        const enhancedPrompt = getEnhancedTargetPrompt(
          query,
          website.url,
          websiteContent,
          extractedPeople,
          externalResults
        );

        // Use Gemini for this enhanced prompt
        try {
          const { content } = await queryGemini(enhancedPrompt);
          const parsed = parseAIResponse(content);

          // If we extracted people but AI didn't return them, create results directly
          if (parsed.results.length <= 1 && extractedPeople.length > 0) {
            console.log(`AI returned few results but we have ${extractedPeople.length} extracted people - creating direct results`);
            const domain = website.domain;
            const directResults: ContactResult[] = [
              {
                name: `${query} - Official Website`,
                title: 'Verified Company Domain',
                organization: query,
                contacts: [{ type: 'website', value: website.url, confidence: 'high', source: 'Verified', notes: `Domain: ${domain}` }],
                personalizationHooks: [],
                reasoning: 'Verified company website',
                additionalNotes: `Use ${domain} for emails`
              },
              ...extractedPeople.map(person => ({
                name: person.name,
                title: person.title,
                organization: query,
                contacts: [{
                  type: 'email' as const,
                  value: `${person.name.toLowerCase().split(' ').join('.')}@${domain}`,
                  confidence: 'speculative' as const,
                  source: 'Speculated from name + verified domain',
                  notes: `Format: firstname.lastname@${domain}`
                }],
                personalizationHooks: [],
                reasoning: `Extracted from company website at ${teamPage?.url || website.url}`,
                additionalNotes: ''
              }))
            ];
            return {
              results: directResults,
              summary: `Found ${extractedPeople.length} people from company website. Domain: ${domain}`,
              actualSource: 'gemini'
            };
          }

          return {
            results: parsed.results,
            summary: `${parsed.summary} (Multi-strategy: website parsing + ${externalResults ? 'external search' : 'AI analysis'})`,
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
