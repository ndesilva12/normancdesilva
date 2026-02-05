import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
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

export async function POST(request: Request) {
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

    const scriptPath = '/home/ubuntu/clawd/skills/last30days-lite/research.py';
    const workingDir = '/home/ubuntu/clawd/skills/last30days-lite';

    const process = spawn('python3', [scriptPath, query], {
      cwd: workingDir,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', async (code) => {
      try {
        if (code === 0) {
          let results = null;
          try {
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              results = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            console.error('Failed to parse results:', e);
          }

          await db.collection('l3d_history').doc(historyRef.id).update({
            status: 'completed',
            results: results || { output: stdout },
            completed_at: Timestamp.now(),
          });
        } else {
          await db.collection('l3d_history').doc(historyRef.id).update({
            status: 'failed',
            error: stderr || stdout || 'Unknown error',
            completed_at: Timestamp.now(),
          });
        }
      } catch (error) {
        console.error('Error updating history:', error);
      }
    });

    return NextResponse.json({
      id: historyRef.id,
      status: 'running',
      message: 'L3D research started. Check history for results.',
    });
  } catch (error) {
    console.error('Error starting L3D:', error);
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
