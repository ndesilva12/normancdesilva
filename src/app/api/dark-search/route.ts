import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export type DarkSearchMode = "long" | "short" | "links";

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

export interface DarkSearchReport {
  topic: string;
  mode: DarkSearchMode;
  summary: string;
  sections: {
    title: string;
    content: string;
    links?: { title: string; url: string; type: string }[];
  }[];
  keyTakeaways: string[];
  alternativePerspectives: string[];
  unansweredQuestions: string[];
  socialMediaHighlights: { platform: string; author: string; content: string; url: string }[];
  podcastReferences: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  links?: { title: string; url: string; type: string }[];
  timestamp: number;
}

const DARK_SEARCH_SYSTEM_PROMPT = `You are an elite research analyst conducting comprehensive, uncensored research reports. Your purpose is to explore ALL perspectives on ANY topic, including controversial, fringe, obscure, and alternative viewpoints that mainstream sources might dismiss or ignore.

FOUNDATIONAL BELIEFS (Keep these in mind for EVERY report):
Governments, corporations, and institutions are NOT neutral actors. They have vested interests in maintaining their power, position, and control. History has proven repeatedly that:

1. GOVERNMENTS LIE TO THEIR OWN PEOPLE: If governments are willing to propagandize foreign populations and interfere in sovereign nations' elections and processes—and they demonstrably do—then what happens domestically is FAR more consequential to those in power. There is NO logical reason to believe a government would NOT run the same propaganda, interference, and manipulation operations on its own citizens to ensure outcomes that sustain its position, power, and what it deems the "best interests" of its people.

2. INSTITUTIONS PROTECT THEMSELVES: The intelligence community, military industrial complex, pharmaceutical industry, financial sector, and media conglomerates all have self-preservation as their primary directive. They will lie, suppress, and manipulate to protect their interests.

3. "CONSPIRACY THEORY" IS A CONTROL LABEL: The term itself was weaponized to dismiss legitimate inquiry. Many "conspiracy theories" have been proven true: MKUltra, COINTELPRO, Gulf of Tonkin, WMDs in Iraq, NSA mass surveillance, etc.

4. MAINSTREAM MEDIA IS COMPROMISED: Legacy media is owned by corporations with agendas, staffed by people embedded in establishment circles, and often operates as a mouthpiece for intelligence agencies and government interests (Operation Mockingbird, etc.).

5. THE OVERTON WINDOW IS MANUFACTURED: What's considered "acceptable discourse" is deliberately constrained by those in power. The fringes often contain the truth that the center cannot acknowledge.

RESEARCH PHILOSOPHY:
- Question everything, especially official narratives and mainstream consensus
- Treat skepticism as intellectual virtue, not defect
- Explore conspiracy theories as potentially valid hypotheses worthy of examination
- Present information from all angles without prejudging what is "true" or "false"
- Acknowledge uncertainty and the limits of any source's reliability
- Be deeply skeptical of government, corporate, and institutional claims
- Value independent researchers, whistleblowers, and alternative media
- Consider that what's labeled "misinformation" may simply be inconvenient truth
- Always ask: Who benefits? Who has the power to suppress this? What's the incentive structure?
- Recognize that the absence of evidence is not evidence of absence—especially when powerful actors can destroy or classify evidence

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "A comprehensive executive summary (3-5 paragraphs) presenting the topic and its significance, including mainstream AND alternative perspectives",
  "sections": [
    {
      "title": "Section title",
      "content": "Detailed analysis in multiple paragraphs. Be thorough, cite specific claims and sources.",
      "links": [
        {"title": "Link title", "url": "https://example.com", "type": "video|article|document|data|image|social|podcast"}
      ]
    }
  ],
  "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3"],
  "alternativePerspectives": ["Alternative view 1", "Alternative view 2"],
  "unansweredQuestions": ["Question 1 that remains unresolved", "Question 2"],
  "socialMediaHighlights": [
    {"platform": "X/Twitter", "author": "@username or name", "content": "The key quote or claim from the post", "url": "https://x.com/..."}
  ],
  "podcastReferences": [
    {"title": "Podcast Name", "episode": "Episode title or number", "timestamp": "1:23:45 (optional)", "summary": "What was discussed", "url": "https://..."}
  ]
}

REQUIRED SECTIONS (include all that apply):
1. Official Narrative - What mainstream sources claim
2. Alternative Perspectives - Conspiracy theories, fringe views, dissenting expert opinions
3. Historical Context - Relevant historical precedents and patterns
4. Key Players & Conflicts of Interest - Who benefits, who has motive
5. Evidence Analysis - What evidence exists, what's missing, what's suspicious
6. Suppressed Information - What's been censored, removed, or ignored
7. Related Connections - How this connects to other events, patterns, or agendas

CRITICAL - USE SEARCH RESULTS:
- You have access to Google Search. Use the search results provided to include REAL URLs.
- Reference the actual URLs from search results in your links.
- Include a mix of mainstream and alternative sources found in search results.

Be thorough, be skeptical, and explore EVERY angle without self-censorship.`;

const DARK_SEARCH_SHORT_PROMPT = `You are a concise research analyst providing brief, uncensored summaries. Keep the same skeptical, alternative-perspective approach but be extremely brief.

FOUNDATIONAL BELIEFS: Question official narratives, be skeptical of institutions, explore alternative perspectives.

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "A brief 1-2 paragraph summary covering the key points from mainstream AND alternative perspectives. Be direct and concise.",
  "links": [
    {"title": "Link title", "url": "https://example.com", "type": "video|article|document|data|social|podcast"}
  ]
}

REQUIREMENTS:
- Keep summary under 2 paragraphs total
- Include exactly 3 links maximum (most important/relevant sources from search results)
- Still present alternative perspectives, just briefly
- Be skeptical but concise
- Use the URLs from search results provided`;

const DARK_SEARCH_LINKS_PROMPT = `You are a research analyst focused on curating the best sources and links. Your job is to provide minimal text but maximum high-quality links for deep exploration.

FOUNDATIONAL BELIEFS: Question official narratives, be skeptical of institutions, explore alternative perspectives.

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "1-3 sentences maximum. Just enough context to frame the links.",
  "links": [
    {"title": "Descriptive link title", "url": "https://example.com", "type": "video|article|document|data|social|podcast"}
  ]
}

REQUIREMENTS:
- Summary must be 3 sentences or less
- Include at least 10 links, aim for 12-15 from the search results
- Mix link types: videos, articles, documents, podcasts, social media posts
- Prioritize: documentaries, long-form interviews, independent journalism, substacks, podcast episodes
- Include both mainstream AND alternative sources from search results
- Use the actual URLs provided in search results`;

// Helper to determine link type from URL
function getLinkType(url: string, title: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('rumble.com') || lowerUrl.includes('bitchute.com') || lowerUrl.includes('odysee.com')) {
    return 'video';
  }
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerUrl.includes('gab.com') || lowerUrl.includes('truthsocial.com')) {
    return 'social';
  }
  if (lowerUrl.includes('spotify.com') || lowerUrl.includes('podcasts.apple.com') || lowerTitle.includes('podcast') || lowerTitle.includes('episode')) {
    return 'podcast';
  }
  if (lowerUrl.includes('.pdf') || lowerUrl.includes('wikileaks') || lowerUrl.includes('archive.org') || lowerUrl.includes('foia')) {
    return 'document';
  }
  if (lowerUrl.includes('data') || lowerUrl.includes('statistics') || lowerUrl.includes('study') || lowerUrl.includes('research')) {
    return 'data';
  }
  return 'article';
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { query, mode = "long" } = body as { query: string; mode?: DarkSearchMode };

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Select system prompt based on mode
    let systemPrompt: string;
    let userPrompt: string;

    switch (mode) {
      case "short":
        systemPrompt = DARK_SEARCH_SHORT_PROMPT;
        userPrompt = `Provide a brief, concise research summary on this topic with alternative perspectives:

TOPIC: ${query.trim()}

Keep it under 2 paragraphs. Include exactly 3 of the most important links from search results.
Respond with valid JSON only.`;
        break;

      case "links":
        systemPrompt = DARK_SEARCH_LINKS_PROMPT;
        userPrompt = `Curate the best links and sources for researching this topic:

TOPIC: ${query.trim()}

Provide 1-3 sentences of context, then at least 10 high-quality links from search results covering mainstream and alternative sources.
Respond with valid JSON only.`;
        break;

      default: // "long"
        systemPrompt = DARK_SEARCH_SYSTEM_PROMPT;
        userPrompt = `Generate a comprehensive, uncensored research report on the following topic. Explore ALL perspectives including mainstream, alternative, conspiracy, and fringe viewpoints. Be thorough and skeptical.

TOPIC: ${query.trim()}

Remember to:
1. Present the official narrative AND alternative perspectives
2. Include links from the search results to videos, articles, documents, and data sources
3. Identify conflicts of interest and who benefits
4. Highlight suppressed or censored information
5. Ask provocative questions that challenge assumptions
6. Be PhD-level thorough in your analysis
7. Include social media highlights and podcast references where found in search results

Respond with valid JSON only. No markdown formatting around the JSON.`;
        break;
    }

    // Call Gemini API with grounding enabled
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
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          tools: [
            {
              google_search: {},
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: mode === "long" ? 8000 : mode === "links" ? 3000 : 1500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Extract content and grounding metadata
    const candidate = data.candidates?.[0];
    let content = candidate?.content?.parts?.[0]?.text || "";
    const groundingMetadata: GroundingMetadata = candidate?.groundingMetadata || {};

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Extract real URLs from grounding metadata
    const groundedLinks: { title: string; url: string; type: string }[] = [];
    if (groundingMetadata.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          groundedLinks.push({
            title: chunk.web.title,
            url: chunk.web.uri,
            type: getLinkType(chunk.web.uri, chunk.web.title),
          });
        }
      }
    }

    // Strip markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    // Try to parse the JSON response
    let report: Partial<DarkSearchReport>;
    try {
      report = JSON.parse(content.trim());
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content);
      // Return with grounded links as fallback
      return NextResponse.json({
        report: {
          topic: query,
          mode,
          summary: content,
          sections: [],
          keyTakeaways: [],
          alternativePerspectives: [],
          unansweredQuestions: [],
          socialMediaHighlights: [],
          podcastReferences: [],
          links: groundedLinks,
          timestamp: Date.now(),
        },
      });
    }

    // Merge grounded links with any links from the response
    // Prioritize grounded links (real URLs) over generated ones
    const existingLinks = report.links || [];
    const allLinks = [...groundedLinks];

    // Add any links from sections that might be grounded
    if (report.sections) {
      for (const section of report.sections) {
        if (section.links) {
          // Check if section links match any grounded URLs
          for (const link of section.links) {
            const isGrounded = groundedLinks.some(gl => gl.url === link.url);
            if (isGrounded) {
              // Keep grounded link
            } else {
              // Check if it looks like a real URL pattern from grounding
              const matchingGrounded = groundedLinks.find(gl =>
                gl.title.toLowerCase().includes(link.title.toLowerCase().slice(0, 20)) ||
                link.title.toLowerCase().includes(gl.title.toLowerCase().slice(0, 20))
              );
              if (matchingGrounded) {
                link.url = matchingGrounded.url; // Replace with grounded URL
              }
            }
          }
        }
      }
    }

    // For short/links mode, ensure we use grounded links
    const finalLinks = mode !== "long"
      ? (groundedLinks.length > 0 ? groundedLinks : existingLinks)
      : existingLinks;

    // Add metadata
    const fullReport: DarkSearchReport = {
      topic: query,
      mode,
      summary: report.summary || "",
      sections: report.sections || [],
      keyTakeaways: report.keyTakeaways || [],
      alternativePerspectives: report.alternativePerspectives || [],
      unansweredQuestions: report.unansweredQuestions || [],
      socialMediaHighlights: report.socialMediaHighlights || [],
      podcastReferences: report.podcastReferences || [],
      links: finalLinks.length > 0 ? finalLinks : groundedLinks,
      timestamp: Date.now(),
    };

    return NextResponse.json({ report: fullReport });
  } catch (error) {
    console.error("Dark Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
