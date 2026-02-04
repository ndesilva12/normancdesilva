import { NextResponse } from 'next/server';
import { getDb } from '../../../../relationship-intel/lib/db';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;

interface EmailData {
  subject: string;
  snippet: string;
  date: string;
  direction: string;
}

interface MeetingData {
  summary: string;
  start: string;
  attendees?: string[];
}

async function generateSummary(
  contactName: string,
  contactEmail: string,
  emails: EmailData[],
  meetings: MeetingData[]
): Promise<{ fullHistorySummary: string; recentSummary: string }> {
  // Build context from interactions
  const emailContext = emails.slice(0, 30).map(e =>
    `[${new Date(parseInt(e.date)).toLocaleDateString()}] ${e.direction === 'inbound' ? 'From' : 'To'} them: "${e.subject}" - ${e.snippet.slice(0, 200)}`
  ).join('\n');

  const meetingContext = meetings.slice(0, 20).map(m =>
    `[${new Date(m.start).toLocaleDateString()}] Meeting: "${m.summary}"`
  ).join('\n');

  // Get recent interactions (last 3 months)
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recentEmails = emails.filter(e => parseInt(e.date) > threeMonthsAgo);
  const recentMeetings = meetings.filter(m => new Date(m.start).getTime() > threeMonthsAgo);

  const recentEmailContext = recentEmails.slice(0, 10).map(e =>
    `[${new Date(parseInt(e.date)).toLocaleDateString()}] ${e.direction === 'inbound' ? 'From' : 'To'} them: "${e.subject}" - ${e.snippet.slice(0, 200)}`
  ).join('\n');

  const recentMeetingContext = recentMeetings.slice(0, 5).map(m =>
    `[${new Date(m.start).toLocaleDateString()}] Meeting: "${m.summary}"`
  ).join('\n');

  const fullPrompt = `You are analyzing the relationship history between the user (Norman) and a contact named ${contactName} (${contactEmail}).

Based on the following email and meeting history, provide a comprehensive relationship summary.

EMAIL HISTORY:
${emailContext || 'No email history available'}

MEETING HISTORY:
${meetingContext || 'No meeting history available'}

Write a 2-3 paragraph summary that covers:
1. How Norman knows this person and the nature of their relationship
2. Key topics they've discussed or collaborated on
3. The overall tone and frequency of their interactions
4. Any notable patterns or important context for the relationship

Be concise but insightful. Write in a professional, helpful tone as if briefing Norman before a meeting with this person.`;

  const recentPrompt = `Summarize the recent interactions (last 3 months) between Norman and ${contactName} (${contactEmail}).

RECENT EMAILS:
${recentEmailContext || 'No recent emails'}

RECENT MEETINGS:
${recentMeetingContext || 'No recent meetings'}

Provide a brief 1-2 paragraph summary of:
1. What they've been discussing recently
2. Any pending items or follow-ups needed
3. The current state of the relationship

Be direct and actionable.`;

  // Call AI API
  let fullHistorySummary = '';
  let recentSummary = '';

  try {
    if (ANTHROPIC_API_KEY) {
      // Use Claude for summaries
      const [fullResponse, recentResponse] = await Promise.all([
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [{ role: 'user', content: fullPrompt }],
          }),
        }),
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 512,
            messages: [{ role: 'user', content: recentPrompt }],
          }),
        }),
      ]);

      if (fullResponse.ok) {
        const data = await fullResponse.json();
        fullHistorySummary = data.content[0].text;
      }

      if (recentResponse.ok) {
        const data = await recentResponse.json();
        recentSummary = data.content[0].text;
      }
    } else if (XAI_API_KEY) {
      // Use Grok as fallback
      const [fullResponse, recentResponse] = await Promise.all([
        fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'grok-3-mini',
            messages: [
              { role: 'system', content: 'You are a professional assistant helping summarize relationship histories.' },
              { role: 'user', content: fullPrompt },
            ],
            temperature: 0.3,
          }),
        }),
        fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'grok-3-mini',
            messages: [
              { role: 'system', content: 'You are a professional assistant helping summarize recent interactions.' },
              { role: 'user', content: recentPrompt },
            ],
            temperature: 0.3,
          }),
        }),
      ]);

      if (fullResponse.ok) {
        const data = await fullResponse.json();
        fullHistorySummary = data.choices[0].message.content;
      }

      if (recentResponse.ok) {
        const data = await recentResponse.json();
        recentSummary = data.choices[0].message.content;
      }
    }
  } catch (err) {
    console.error('AI summary generation error:', err);
  }

  return {
    fullHistorySummary: fullHistorySummary || 'No summary available. Try adding more interaction history.',
    recentSummary: recentSummary || 'No recent activity to summarize.',
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);
    const body = await request.json();

    const { contactName, emails, meetings } = body;

    if (!contactName) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 });
    }

    const db = getDb();

    // Generate AI summaries
    const summaries = await generateSummary(
      contactName,
      decodedEmail,
      emails || [],
      meetings || []
    );

    // Store in Firestore
    await db.collection('relationship_summaries').doc(decodedEmail).set({
      contactEmail: decodedEmail,
      contactName,
      fullHistorySummary: summaries.fullHistorySummary,
      recentSummary: summaries.recentSummary,
      lastUpdated: Date.now(),
      emailCount: (emails || []).length,
      meetingCount: (meetings || []).length,
    });

    return NextResponse.json({
      success: true,
      summary: summaries,
    });
  } catch (error: any) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    const db = getDb();
    const summaryDoc = await db.collection('relationship_summaries').doc(decodedEmail).get();

    if (!summaryDoc.exists) {
      return NextResponse.json({ summary: null });
    }

    const data = summaryDoc.data();
    return NextResponse.json({
      summary: {
        fullHistorySummary: data?.fullHistorySummary,
        recentSummary: data?.recentSummary,
        lastUpdated: data?.lastUpdated,
      }
    });
  } catch (error: any) {
    console.error('Summary fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
