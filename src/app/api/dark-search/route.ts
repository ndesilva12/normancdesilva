import { NextRequest, NextResponse } from "next/server";

const XAI_API_KEY = process.env.XAI_API_KEY;

export type DarkSearchMode = "long" | "short" | "links";

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
    {"platform": "X/Twitter", "author": "@username or name", "content": "The key quote or claim from the post that advances the theory or reveals important information", "url": "https://x.com/..."}
  ],
  "podcastReferences": [
    {"title": "Podcast Name", "episode": "Episode title or number", "timestamp": "1:23:45 (optional)", "summary": "What was discussed and why it's relevant - key claims, revelations, or theories presented", "url": "https://..."}
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

LINK TYPES TO INCLUDE:
- video: YouTube, Rumble, BitChute, Odysee documentaries and interviews
- article: News articles, blog posts, independent journalism
- document: PDFs, official documents, leaked files, FOIA releases
- data: Statistics, datasets, scientific papers, studies
- image: Infographics, charts, photos, visual evidence
- social: X/Twitter posts, threads, Gab posts, Truth Social posts
- podcast: Podcast episodes, audio interviews, radio shows

SOCIAL MEDIA HIGHLIGHTS (CRITICAL):
- Include 3-5 notable tweets/posts from X, Gab, Truth Social that discuss key theories
- Prioritize posts that: reveal insider information, connect dots, cite sources, or advance the theory
- Include posts from independent researchers, journalists, whistleblowers, and thought leaders
- Quote the actual content of the post so the reader can evaluate it
- These should lead to MORE information, data, and theory exploration

PODCAST REFERENCES (CRITICAL):
- Include 2-4 relevant podcast episodes that deeply discuss this topic
- Reference specific episodes from: Joe Rogan Experience, Tim Pool, Tucker Carlson, Glenn Greenwald, Breaking Points, The Megyn Kelly Show, Lex Fridman, Dark Horse Podcast, Jimmy Dore Show, Kim Iversen, Matt Taibbi, etc.
- Provide the episode name/number and approximate timestamp if discussing a specific segment
- Summarize what key information or theory was presented in that episode
- Podcasts are often where the REAL discussions happen that mainstream media won't cover

CRITICAL - LINKS MUST BE REAL:
- You have access to live web search. USE IT to find REAL, VERIFIED, CURRENTLY ACCESSIBLE URLs.
- NEVER make up or hallucinate URLs. Every link MUST be from your web search results.
- If you cannot verify a URL exists, DO NOT include it.
- Prefer recently indexed content that is likely still accessible.
- Sources to search: Zero Hedge, The Gateway Pundit, Revolver News, YouTube, Rumble, BitChute, Odysee, WikiLeaks, archive.org, Substack, Spotify podcasts, etc.

Be thorough, be skeptical, and explore EVERY angle without self-censorship. The user wants the FULL picture, not the sanitized version.`;

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
- Include exactly 3 links maximum (most important/relevant sources)
- Still present alternative perspectives, just briefly
- Be skeptical but concise
- CRITICAL: Use your web search to find REAL, VERIFIED URLs only. Never hallucinate links.`;

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
- Include at least 10 links, aim for 12-15
- Mix link types: videos, articles, documents, podcasts, social media posts
- Prioritize: documentaries, long-form interviews, leaked documents, independent journalism, substacks, podcast episodes
- Include both mainstream AND alternative sources
- Each link should lead to substantial content worth exploring
- CRITICAL: Use your web search to find REAL, VERIFIED, CURRENTLY ACCESSIBLE URLs only. Never hallucinate or make up links. Every URL must come from your search results.`;

export async function POST(request: NextRequest) {
  if (!XAI_API_KEY) {
    return NextResponse.json(
      { error: "Grok API key not configured. Please add XAI_API_KEY to your environment variables." },
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
    let maxTokens: number;

    switch (mode) {
      case "short":
        systemPrompt = DARK_SEARCH_SHORT_PROMPT;
        userPrompt = `Provide a brief, concise research summary on this topic with alternative perspectives:

TOPIC: ${query.trim()}

Keep it under 2 paragraphs. Include exactly 3 of the most important links.
IMPORTANT: Use your web search to find REAL, currently accessible URLs. Do not make up links.
Respond with valid JSON only.`;
        maxTokens = 1500;
        break;

      case "links":
        systemPrompt = DARK_SEARCH_LINKS_PROMPT;
        userPrompt = `Curate the best links and sources for researching this topic:

TOPIC: ${query.trim()}

Provide 1-3 sentences of context, then at least 10 high-quality links covering mainstream and alternative sources.
CRITICAL: Search the web and only include REAL, VERIFIED, CURRENTLY ACCESSIBLE URLs. Every link must come from your search results - never make up or hallucinate URLs.
Respond with valid JSON only.`;
        maxTokens = 3000;
        break;

      default: // "long"
        systemPrompt = DARK_SEARCH_SYSTEM_PROMPT;
        userPrompt = `Generate a comprehensive, uncensored research report on the following topic. Explore ALL perspectives including mainstream, alternative, conspiracy, and fringe viewpoints. Be thorough and skeptical.

TOPIC: ${query.trim()}

Remember to:
1. Present the official narrative AND alternative perspectives
2. Search the web and include REAL, VERIFIED links to videos, articles, documents, and data sources
3. Identify conflicts of interest and who benefits
4. Highlight suppressed or censored information
5. Ask provocative questions that challenge assumptions
6. Be PhD-level thorough in your analysis
7. CRITICAL: Include 3-5 social media highlights (tweets/posts) that advance theories or reveal key information
8. CRITICAL: Include 2-4 podcast references with episode names and summaries of what was discussed
9. CRITICAL: ALL URLs must come from your web search results - never hallucinate or make up links

Respond with valid JSON only. No markdown formatting around the JSON.`;
        maxTokens = 8000;
        break;
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: maxTokens,
        search_parameters: {
          mode: "on",
          return_citations: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Grok API error:", errorText);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
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
      // Return the raw content as a fallback
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
          links: [],
          timestamp: Date.now(),
        },
      });
    }

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
      links: report.links || [],
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
