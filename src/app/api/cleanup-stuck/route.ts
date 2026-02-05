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

// Cleanup endpoint to mark stuck searches as failed
export async function POST() {
  try {
    const collections = ['curate_history', 'l3d_history', 'deep_search_history', 'dark_search_history'];
    const results: Record<string, number> = {};
    
    // Find all "running" searches older than 10 minutes
    const tenMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000));
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName)
        .where('status', '==', 'running')
        .where('timestamp', '<', tenMinutesAgo)
        .get();
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'failed',
          error: 'Search timed out (likely from previous deployment)',
          completed_at: Timestamp.now(),
        });
      });
      
      if (snapshot.size > 0) {
        await batch.commit();
      }
      
      results[collectionName] = snapshot.size;
    }
    
    return NextResponse.json({ 
      success: true, 
      cleaned: results,
      message: 'Stuck searches marked as failed'
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      error: 'Cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
