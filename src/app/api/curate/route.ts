import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Firebase Admin
if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'the-dashboard-50be1';

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

const CURATE_SYSTEM_PROMPT = `You are an elite content curator who aggregates and synthesizes the best information from across the internet. Your job is to find and organize the most valuable content on any topic.

CURATION PHILOSOPHY:
- Find the BEST sources: authoritative articles, insightful videos, data-driven research
- Prioritize depth over breadth - quality sources that provide real value
- Mix content types: articles, videos, podcasts, data visualizations, academic papers
- Include diverse perspectives - mainstream and alternative viewpoints
- Organize content logically by theme or subtopic
- Provide brief annotations explaining why each source is valuable

You MUST respond with valid JSON in this exact format:
{
  "summary": "2-3 paragraphs providing an overview of the topic and what makes it interesting. Synthesize the key themes and insights from the sources you found.",
  "sections": [
    {
      "title": "Section title (e.g., 'Core Concepts', 'Expert Analysis', 'Data & Research')",
      "description": "1-2 sentences explaining what this section contains",
      "sources": [
        {
          "title": "Source title",
          "url": "https://example.com",
          "type": "article|video|podcast|data|academic",
          "annotation": "1-2 sentences explaining why this source is valuable and what it contains"
        }
      ]
    }
  ],
  "keyTakeaways": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "recommendedReading": [
    {"title": "Must-read source title", "url": "https://example.com", "type": "article|video|podcast"}
  ]
}

CRITICAL - USE SEARCH RESULTS:
- You have access to Google Search. Use the search results provided to include REAL URLs.
- All URLs must come from the search results - do not make up links.
- Organize sources into logical sections (e.g., "Foundational Articles", "Expert Interviews", "Data & Statistics", "Alternative Perspectives")
- Aim for 8-15 high-quality sources total`;

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

function getLinkType(url: string, title: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'video';
  if (lowerUrl.includes('spotify.com') || lowerUrl.includes('podcasts.apple.com') || lowerTitle.includes('podcast')) return 'podcast';
  if (lowerUrl.includes('.pdf') || lowerUrl.includes('arxiv') || lowerUrl.includes('doi.org')) return 'academic';
  if (lowerUrl.includes('data') || lowerUrl.includes('statistics') || lowerUrl.includes('research')) return 'data';
  return 'article';
}

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Gemini API key not configured' },
      { status: 503 }
    );
  }

  try {
    const { query, source } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Create history entry
    const historyRef = await db.collection('curate_history').add({
      query: query.trim(),
      status: 'running',
      timestamp: Timestamp.now(),
      results: null,
      error: null,
    });

    // Build user prompt based on source filter
    const sourceContext = source && source !== 'all'
      ? `Focus particularly on ${source} sources.`
      : 'Include a mix of articles, videos, podcasts, and data sources.';

    const userPrompt = `Curate the best content and sources on the following topic. ${sourceContext}

TOPIC: ${query.trim()}

Find and organize 8-15 high-quality sources from the search results. Group them into logical sections. Provide annotations explaining why each source is valuable.

Respond with valid JSON only. No markdown formatting.`;

    // Call Gemini API with Google Search
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${CURATE_SYSTEM_PROMPT}\n\n${userPrompt}` }],
          }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    let content = candidate?.content?.parts?.[0]?.text || '';
    const groundingMetadata: GroundingMetadata = candidate?.groundingMetadata || {};

    if (!content) {
      throw new Error('No response from AI');
    }

    // Extract grounded links
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

    console.log(`Curate: Found ${groundedLinks.length} grounded links`);

    // Parse JSON response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1];

    let result;
    try {
      result = JSON.parse(content.trim());
      // Replace any hallucinated URLs with real grounded ones
      if (result.sections) {
        for (const section of result.sections) {
          if (section.sources) {
            section.sources = section.sources.map((source: any, idx: number) => {
              const grounded = groundedLinks[idx] || groundedLinks.find(gl => gl.type === source.type);
              if (grounded) {
                return { ...source, url: grounded.url, title: grounded.title };
              }
              return null;
            }).filter(Boolean);
          }
        }
      }
    } catch (e) {
      result = {
        summary: content,
        sections: [],
        keyTakeaways: [],
        recommendedReading: groundedLinks.slice(0, 5),
      };
    }

    // Update history with results
    await db.collection('curate_history').doc(historyRef.id).update({
      status: 'completed',
      results: result,
      completed_at: Timestamp.now(),
    });

    return NextResponse.json({
      id: historyRef.id,
      status: 'completed',
      results: result,
    });
  } catch (error) {
    console.error('Error in curate:', error);
    return NextResponse.json({ error: 'Failed to curate content' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await db
      .collection('curate_history')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
      completed_at: doc.data().completed_at?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching curate history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
