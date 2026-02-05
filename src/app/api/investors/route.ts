import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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
    const snapshot = await db.collection('investors').orderBy('created_at', 'desc').get();
    const investors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ investors });
  } catch (error) {
    console.error('Error fetching investors:', error);
    return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newInvestor = {
      name: data.name.trim(),
      firm: data.firm?.trim() || '',
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      checkSize: data.checkSize?.trim() || null,
      focus: data.focus?.trim() || null,
      notes: data.notes?.trim() || null,
      status: 'cold',
      lastContact: null,
      nextAction: null,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const docRef = await db.collection('investors').add(newInvestor);

    return NextResponse.json({
      id: docRef.id,
      ...newInvestor,
    });
  } catch (error) {
    console.error('Error creating investor:', error);
    return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 });
  }
}
