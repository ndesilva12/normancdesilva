import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Client } from '@notionhq/client';

const NOTION_TOKEN = process.env.NOTION_API_KEY;
const RECOMMENDATIONS_DATABASE_ID = process.env.NOTION_RECOMMENDATIONS_DATABASE_ID;

interface Recommendation {
  id: string;
  notionId?: string;
  type: string;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  status: 'pending' | 'completed' | 'archived';
  createdAt: number;
  completedAt?: number;
}

function extractPropertyValue(property: any): string | string[] | undefined {
  if (!property) return undefined;

  switch (property.type) {
    case 'title':
      return property.title?.[0]?.plain_text || undefined;
    case 'rich_text':
      return property.rich_text?.[0]?.plain_text || undefined;
    case 'select':
      return property.select?.name || undefined;
    case 'multi_select':
      return property.multi_select?.map((s: any) => s.name) || [];
    case 'url':
      return property.url || undefined;
    case 'checkbox':
      return property.checkbox ? 'completed' : 'pending';
    default:
      return undefined;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    let query = db.collection('recommendations').orderBy('createdAt', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(100).get();

    const recommendations: Recommendation[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Recommendation, 'id'>
    }));

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('Recommendations GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const body = await request.json();

    // Sync from Notion
    if (body.sync) {
      if (!NOTION_TOKEN || !RECOMMENDATIONS_DATABASE_ID) {
        return NextResponse.json({
          error: 'Notion credentials not configured',
          message: 'Set NOTION_API_KEY and NOTION_RECOMMENDATIONS_DATABASE_ID'
        }, { status: 400 });
      }

      const notion = new Client({ auth: NOTION_TOKEN });

      const response = await notion.databases.query({
        database_id: RECOMMENDATIONS_DATABASE_ID,
        page_size: 100,
      });

      const synced: Recommendation[] = [];

      for (const page of response.results) {
        if (!('properties' in page)) continue;

        const props = page.properties;
        const title = extractPropertyValue(props.Name || props.name || props.Title || props.title) as string;

        if (!title) continue;

        const statusValue = extractPropertyValue(props.Done || props.done || props.Completed || props.completed);
        const typeValue = extractPropertyValue(props.Type || props.type || props.Category || props.category) as string;

        const recommendation: Recommendation = {
          id: page.id.replace(/-/g, ''),
          notionId: page.id,
          type: typeValue || 'other',
          title,
          description: extractPropertyValue(props.Description || props.description || props.Notes || props.notes) as string,
          source: extractPropertyValue(props.Source || props.source || props.From || props.from) as string,
          url: extractPropertyValue(props.URL || props.url || props.Link || props.link) as string,
          status: statusValue === 'completed' ? 'completed' : 'pending',
          createdAt: new Date(page.created_time).getTime(),
        };

        await db.collection('recommendations').doc(recommendation.id).set(recommendation, { merge: true });
        synced.push(recommendation);
      }

      return NextResponse.json({
        success: true,
        synced: synced.length,
        recommendations: synced
      });
    }

    // Create new recommendation
    const { type, title, description, source, url } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    const newRecommendation: Omit<Recommendation, 'id'> = {
      type,
      title,
      description: description || undefined,
      source: source || undefined,
      url: url || undefined,
      status: 'pending',
      createdAt: Date.now(),
    };

    const docRef = await db.collection('recommendations').add(newRecommendation);

    return NextResponse.json({
      recommendation: { id: docRef.id, ...newRecommendation }
    });
  } catch (error: any) {
    console.error('Recommendations POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    const updateData: any = { ...updates };

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = Date.now();
      }
    }

    await db.collection('recommendations').doc(id).update(updateData);

    const doc = await db.collection('recommendations').doc(id).get();

    return NextResponse.json({
      recommendation: { id: doc.id, ...doc.data() }
    });
  } catch (error: any) {
    console.error('Recommendations PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    await db.collection('recommendations').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Recommendations DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
