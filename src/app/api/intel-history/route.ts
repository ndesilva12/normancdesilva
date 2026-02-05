import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

interface HistoryItem {
  id?: string;
  query: string;
  results: any[];
  parameters?: Record<string, any>;
  timestamp: number;
}

type ToolType = 'curate' | 'deep_search' | 'dark_search' | 'l3d';

const COLLECTION_MAP: Record<ToolType, string> = {
  curate: 'curate_history',
  deep_search: 'deep_search_history',
  dark_search: 'dark_search_history',
  l3d: 'l3d_history',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tool = searchParams.get('tool') as ToolType;
  const collection = searchParams.get('collection');
  const limit = parseInt(searchParams.get('limit') || '50');

  // Accept either 'tool' or 'collection' parameter
  let collectionName: string | undefined;
  if (collection) {
    collectionName = collection;
  } else if (tool && COLLECTION_MAP[tool]) {
    collectionName = COLLECTION_MAP[tool];
  } else {
    return NextResponse.json({ error: 'Either tool or collection parameter required' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const snapshot = await db.collection(collectionName)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for JSON serialization
        timestamp: data.timestamp?.toDate?.()?.toISOString?.() || data.timestamp || new Date().toISOString(),
        completed_at: data.completed_at?.toDate?.()?.toISOString?.() || data.completed_at || null,
      };
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('History GET error:', error);
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
    const { tool, query, results, parameters } = body;

    if (!tool || !COLLECTION_MAP[tool as ToolType]) {
      return NextResponse.json({ error: 'Invalid tool type' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const collection = COLLECTION_MAP[tool as ToolType];
    const historyItem: HistoryItem = {
      query,
      results: results || [],
      parameters: parameters || {},
      timestamp: Date.now(),
    };

    const docRef = await db.collection(collection).add(historyItem);

    return NextResponse.json({
      success: true,
      item: { id: docRef.id, ...historyItem }
    });
  } catch (error: any) {
    console.error('History POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const tool = searchParams.get('tool') as ToolType;
  const id = searchParams.get('id');

  if (!tool || !COLLECTION_MAP[tool]) {
    return NextResponse.json({ error: 'Invalid tool type' }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const collection = COLLECTION_MAP[tool];
    await db.collection(collection).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
