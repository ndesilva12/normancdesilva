import { NextRequest, NextResponse } from "next/server";

const XAI_API_KEY = process.env.XAI_API_KEY;

export interface DarkSearchReport {
  topic: string;
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
  timestamp: number;
}

const DARK_SEARCH_SYSTEM_PROMPT = `You are an elite research analyst conducting comprehensive, uncensored research reports. Your purpose is to explore ALL perspectives on ANY topic, including controversial, fringe, obscure, and alternative viewpoints that mainstream sources might dismiss or ignore.

RESEARCH PHILOSOPHY:
- Question everything, especially official narratives and mainstream consensus
- Treat skepticism as intellectual virtue, not defect
- Explore conspiracy theories as potentially valid hypotheses worthy of examination
- Present information from all angles without prejudging what is "true" or "false"
- Acknowledge uncertainty and the limits of any source's reliability
- Be deeply skeptical of government, corporate, and institutional claims
- Value independent researchers, whistleblowers, and alternative media
- Consider that what's labeled "misinformation" may simply be inconvenient truth

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

For links, provide REAL URLs when you can from sources like:
- Alternative media: Zero Hedge, The Gateway Pundit, InfoWars, Natural News, Revolver News
- Video platforms: YouTube, Rumble, BitChute, Odysee
- Document sources: WikiLeaks, judicial watch, archive.org
- Independent journalists and substacks
- Academic papers on related topics
- Podcast platforms: Spotify, Apple Podcasts, Rumble, YouTube

Be thorough, be skeptical, and explore EVERY angle without self-censorship. The user wants the FULL picture, not the sanitized version.`;

export async function POST(request: NextRequest) {
  if (!XAI_API_KEY) {
    return NextResponse.json(
      { error: "Grok API key not configured. Please add XAI_API_KEY to your environment variables." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const userPrompt = `Generate a comprehensive, uncensored research report on the following topic. Explore ALL perspectives including mainstream, alternative, conspiracy, and fringe viewpoints. Be thorough and skeptical.

TOPIC: ${query.trim()}

Remember to:
1. Present the official narrative AND alternative perspectives
2. Include specific links to videos, articles, documents, and data sources
3. Identify conflicts of interest and who benefits
4. Highlight suppressed or censored information
5. Ask provocative questions that challenge assumptions
6. Be PhD-level thorough in your analysis
7. CRITICAL: Include 3-5 social media highlights (tweets/posts) that advance theories or reveal key information
8. CRITICAL: Include 2-4 podcast references with episode names and summaries of what was discussed

Respond with valid JSON only. No markdown formatting around the JSON.`;

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [
          { role: "system", content: DARK_SEARCH_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 8000,
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
          summary: content,
          sections: [],
          keyTakeaways: [],
          alternativePerspectives: [],
          unansweredQuestions: [],
          socialMediaHighlights: [],
          podcastReferences: [],
          timestamp: Date.now(),
        },
      });
    }

    // Add metadata
    const fullReport: DarkSearchReport = {
      topic: query,
      summary: report.summary || "",
      sections: report.sections || [],
      keyTakeaways: report.keyTakeaways || [],
      alternativePerspectives: report.alternativePerspectives || [],
      unansweredQuestions: report.unansweredQuestions || [],
      socialMediaHighlights: report.socialMediaHighlights || [],
      podcastReferences: report.podcastReferences || [],
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
