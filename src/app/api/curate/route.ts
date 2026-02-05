import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

export async function POST(request: Request) {
  try {
    const { query, source } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Create history entry first
    const historyRef = await db.collection('curate_history').add({
      query: query.trim(),
      status: 'running',
      timestamp: Timestamp.now(),
      results: null,
      error: null,
    });

    // Call external Python API
    const apiUrl = process.env.PYTHON_API_URL || 'https://api.normancdesilva.com';
    
    console.log(`Calling Python API: ${apiUrl}/curate`);
    
    fetch(`${apiUrl}/curate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), source: source || 'all' }),
    })
      .then(res => res.json())
      .then(async (apiResult) => {
        if (apiResult.success && apiResult.result) {
          await db.collection('curate_history').doc(historyRef.id).update({
            status: 'completed',
            results: apiResult.result,
            completed_at: Timestamp.now(),
          });
        } else {
          throw new Error(apiResult.error || 'Unknown error');
        }
      })
      .catch(async (error) => {
        console.error('Curate API error:', error);
        await db.collection('curate_history').doc(historyRef.id).update({
          status: 'failed',
          error: error.message || 'Failed to curate',
          completed_at: Timestamp.now(),
        });
      });

    return NextResponse.json({
      id: historyRef.id,
      status: 'running',
      message: 'Curation started. Check history for results.',
    });
  } catch (error) {
    console.error('Error starting curate:', error);
    return NextResponse.json({ error: 'Failed to start curation' }, { status: 500 });
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
