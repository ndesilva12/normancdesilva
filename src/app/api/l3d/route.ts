import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

const L3D_SYSTEM_PROMPT = `You are a research analyst specializing in recent developments and current events. Your job is to find and synthesize the most important recent information (last 30 days) on any topic.

RESEARCH PHILOSOPHY:
- Focus on RECENT content: news, updates, announcements from the last 30 days
- Prioritize breaking developments, new research, policy changes, industry shifts
- Include multiple perspectives and sources
- Highlight what's changed or evolved recently
- Identify emerging trends and patterns
- Connect recent developments to longer-term context when relevant

You MUST respond with valid JSON in this exact format:
{
  "summary": "2-3 paragraphs summarizing the most important recent developments. What's changed in the last 30 days? What are the key stories?",
  "recentDevelopments": [
    {
      "title": "Development headline",
      "date": "Approximate date (e.g., 'Jan 15' or 'last week')",
      "description": "2-3 sentences explaining this development and why it matters",
      "source": "Source name",
      "url": "https://example.com"
    }
  ],
  "keyTrends": ["Trend 1", "Trend 2", "Trend 3"],
  "whatChanged": ["Change 1", "Change 2"],
  "sources": [
    {"title": "Source title", "url": "https://example.com", "type": "article|video|podcast"}
  ]
}

CRITICAL - USE SEARCH RESULTS:
- You have access to Google Search. Use the search results to find REAL recent content.
- All URLs must come from the search results.
- Focus on content from the last 30 days when possible.
- Include 5-10 recent developments and sources.`;

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

function getLinkType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'video';
  if (lower.includes('spotify.com') || lower.includes('podcasts.apple.com')) return 'podcast';
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
    const { query } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const historyRef = await db.collection('l3d_history').add({
      query: query.trim(),
      status: 'running',
      timestamp: Timestamp.now(),
      results: null,
      error: null,
    });

    const userPrompt = `Research recent developments (last 30 days) on the following topic:

TOPIC: ${query.trim()}

Find and summarize the most important recent news, updates, changes, and developments from the last 30 days. Include 5-10 recent developments with real sources from search results.

Respond with valid JSON only. No markdown formatting.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${L3D_SYSTEM_PROMPT}\n\n${userPrompt}` }],
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
            type: getLinkType(chunk.web.uri),
          });
        }
      }
    }

    console.log(`L3D: Found ${groundedLinks.length} grounded links`);

    // Parse JSON response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1];

    let result;
    try {
      result = JSON.parse(content.trim());
      // Replace hallucinated URLs with real ones
      if (result.recentDevelopments) {
        result.recentDevelopments = result.recentDevelopments.map((dev: any, idx: number) => {
          const grounded = groundedLinks[idx];
          if (grounded) {
            return { ...dev, url: grounded.url, source: grounded.title };
          }
          return null;
        }).filter(Boolean);
      }
      if (result.sources) {
        result.sources = result.sources.map((source: any, idx: number) => {
          const grounded = groundedLinks[idx] || groundedLinks.find(gl => gl.type === source.type);
          if (grounded) {
            return { ...source, url: grounded.url, title: grounded.title };
          }
          return null;
        }).filter(Boolean);
      }
    } catch (e) {
      result = {
        summary: content,
        recentDevelopments: [],
        keyTrends: [],
        whatChanged: [],
        sources: groundedLinks.slice(0, 5),
      };
    }

    await db.collection('l3d_history').doc(historyRef.id).update({
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
    console.error('Error in L3D:', error);
    return NextResponse.json({ error: 'Failed to start L3D research' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await db
      .collection('l3d_history')
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
    console.error('Error fetching L3D history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
