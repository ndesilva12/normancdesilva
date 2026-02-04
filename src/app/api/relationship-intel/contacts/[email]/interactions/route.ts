import { NextResponse } from 'next/server';
import { getDb } from '../../../../relationship-intel/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const db = getDb();
    
    let query = db
      .collection('relationship_intel_interactions')
      .where('participant_emails', 'array-contains', decodeURIComponent(email))
      .orderBy('date', 'desc')
      .limit(100);
    
    if (projectId) {
      query = query.where('project_id', '==', projectId);
    }
    
    const snapshot = await query.get();
    
    const interactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(interactions);
  } catch (error: any) {
    console.error('Interactions API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
