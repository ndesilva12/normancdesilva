import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

interface MissionItem {
  id?: string;
  title: string;
  description?: string;
  links?: string[];
  status: 'created' | 'processing' | 'filed';
  createdAt: number;
  movedToProcessingAt?: number;
  filedAt?: number;
  order: number;
}

export async function GET() {
  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const snapshot = await db.collection('mission_items')
      .orderBy('order', 'asc')
      .get();

    const items: MissionItem[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<MissionItem, 'id'>
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Mission GET error:', error);
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
    const { title, description, links } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get the highest order number for created items
    const existingSnapshot = await db.collection('mission_items')
      .where('status', '==', 'created')
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    const highestOrder = existingSnapshot.empty ? 0 : (existingSnapshot.docs[0].data().order || 0);

    const newItem: Omit<MissionItem, 'id'> = {
      title,
      description: description || '',
      links: links || [],
      status: 'created',
      createdAt: Date.now(),
      order: highestOrder + 1,
    };

    const docRef = await db.collection('mission_items').add(newItem);

    return NextResponse.json({
      item: { id: docRef.id, ...newItem }
    });
  } catch (error: any) {
    console.error('Mission POST error:', error);
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
    const { id, title, description, links, status, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const docRef = db.collection('mission_items').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const currentData = doc.data() as MissionItem;
    const updates: Partial<MissionItem> = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (links !== undefined) updates.links = links;
    if (order !== undefined) updates.order = order;

    if (status !== undefined && status !== currentData.status) {
      updates.status = status;
      if (status === 'processing' && currentData.status === 'created') {
        updates.movedToProcessingAt = Date.now();
      } else if (status === 'filed') {
        updates.filedAt = Date.now();
      }
    }

    await docRef.update(updates);

    return NextResponse.json({
      item: { id, ...currentData, ...updates }
    });
  } catch (error: any) {
    console.error('Mission PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await db.collection('mission_items').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mission DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
