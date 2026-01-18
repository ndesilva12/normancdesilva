import { NextRequest, NextResponse } from "next/server";

const XAI_API_KEY = process.env.XAI_API_KEY;

export interface DeepSearchReport {
  topic: string;
  briefOverview: string;
  sections: {
    title: string;
    content: string;
    links?: { title: string; url: string; type: string }[];
  }[];
  hiddenMechanics: string[];
  counterintuitiveInsights: string[];
  expertDebates: string[];
  underreportedAngles: string[];
  timestamp: number;
}

const DEEP_SEARCH_SYSTEM_PROMPT = `You are an elite research analyst writing for EXPERTS who are already deeply familiar with the topic. Your audience has PhD-level understanding of the basics - they don't need introductions or fundamentals explained.

CRITICAL INSTRUCTION: The reader already knows the basics. They want to learn the 10% of information that 90% of people don't know.

RESEARCH PHILOSOPHY:
- Assume the reader is already an expert on the fundamentals
- Focus on nuances, edge cases, and overlooked details that even educated people miss
- Reveal how things ACTUALLY work behind the scenes vs. the simplified public narrative
- Explore the interesting fringes and edges of the topic
- Uncover the mechanics, incentives, and dynamics that insiders understand
- Share counterintuitive findings that challenge conventional wisdom
- Discuss ongoing debates among genuine experts in the field
- Highlight what's changed recently that most people haven't caught up with

CONTENT RATIO:
- 10% brief context (2-3 sentences maximum for basics)
- 90% advanced nuances, insider knowledge, and expert-level insights

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "briefOverview": "2-3 sentences ONLY covering basics for context. Then immediately pivot to what makes this topic fascinating at a deeper level.",
  "sections": [
    {
      "title": "Section title focusing on a specific nuance or advanced aspect",
      "content": "Deep, nuanced analysis. Be specific. Name names, cite specifics, explain mechanisms. This is for experts.",
      "links": [
        {"title": "Link title", "url": "https://example.com", "type": "video|article|document|data|image"}
      ]
    }
  ],
  "hiddenMechanics": ["How X actually works behind the scenes that most don't realize", "The real mechanism/incentive/dynamic at play"],
  "counterintuitiveInsights": ["Finding that challenges conventional wisdom", "What experts know that contradicts popular belief"],
  "expertDebates": ["Current disagreement among experts on X", "Unresolved question that specialists argue about"],
  "underreportedAngles": ["Aspect that deserves more attention", "Connection most people miss"]
}

SECTION TOPICS TO COVER (adapt to the topic):
1. The Nuanced Reality - What the simplified narrative misses
2. Hidden Mechanics - How it actually works behind the scenes
3. Edge Cases & Exceptions - Where the conventional rules break down
4. Historical Context Most Miss - The backstory that changes understanding
5. Current Expert Debates - What specialists actually argue about
6. Recent Developments - What's changed that most haven't caught up with
7. The Interesting Fringes - Unusual aspects, edge phenomena, weird cases
8. Insider Perspectives - What practitioners/insiders know that outsiders don't

LINK TYPES TO INCLUDE:
- video: Expert talks, academic lectures, insider interviews
- article: Academic papers, specialist publications, deep-dive journalism
- document: Primary sources, technical documents, research papers
- data: Datasets, statistics, empirical research
- image: Diagrams, technical illustrations, data visualizations

For links, prioritize:
- Academic sources (JSTOR, Google Scholar, university publications)
- Expert blogs and substacks from specialists in the field
- Long-form investigative journalism
- Primary source documents
- Technical/industry publications
- Conference talks and academic lectures

Write for someone who will be BORED by basics and DELIGHTED by nuance. Every sentence should teach them something they didn't know or make them see something familiar in a new light.`;

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

    const userPrompt = `Generate an expert-level deep research report on the following topic. The reader is ALREADY an expert on the basics - they want the nuances, hidden mechanics, and insights that even educated people typically miss.

TOPIC: ${query.trim()}

Remember:
1. SKIP lengthy introductions - 2-3 sentences of context maximum
2. 90% of content should be advanced nuances and insider knowledge
3. Focus on how things ACTUALLY work vs. the simplified narrative
4. Include counterintuitive findings and ongoing expert debates
5. Every section should teach something most educated people don't know
6. Be specific - name names, cite mechanisms, explain dynamics
7. Include links to academic sources, expert content, and primary documents

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
          { role: "system", content: DEEP_SEARCH_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
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
    let report: Partial<DeepSearchReport>;
    try {
      report = JSON.parse(content.trim());
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content);
      // Return the raw content as a fallback
      return NextResponse.json({
        report: {
          topic: query,
          briefOverview: content,
          sections: [],
          hiddenMechanics: [],
          counterintuitiveInsights: [],
          expertDebates: [],
          underreportedAngles: [],
          timestamp: Date.now(),
        },
      });
    }

    // Add metadata
    const fullReport: DeepSearchReport = {
      topic: query,
      briefOverview: report.briefOverview || "",
      sections: report.sections || [],
      hiddenMechanics: report.hiddenMechanics || [],
      counterintuitiveInsights: report.counterintuitiveInsights || [],
      expertDebates: report.expertDebates || [],
      underreportedAngles: report.underreportedAngles || [],
      timestamp: Date.now(),
    };

    return NextResponse.json({ report: fullReport });
  } catch (error) {
    console.error("Deep Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
