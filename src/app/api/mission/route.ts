import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

export async function GET() {
  try {
    const snapshot = await db.collection('missions').orderBy('order').get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, links } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get current max order for 'created' status
    const createdSnapshot = await db
      .collection('missions')
      .where('status', '==', 'created')
      .orderBy('order', 'desc')
      .limit(1)
      .get();

    const maxOrder = createdSnapshot.empty ? 0 : createdSnapshot.docs[0].data().order;

    const newItem = {
      title: title.trim(),
      description: description?.trim() || '',
      links: links || [],
      status: 'created',
      order: maxOrder + 1,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const docRef = await db.collection('missions').add(newItem);

    return NextResponse.json({
      id: docRef.id,
      ...newItem,
    });
  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
  }
}
