import { NextResponse } from 'next/server';
import { getDb } from '../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    
    const projectDoc = await db
      .collection('relationship_intel_projects')
      .doc(id)
      .get();
    
    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const data = projectDoc.data();
    
    return NextResponse.json({
      id: projectDoc.id,
      name: data?.name,
      description: data?.description,
      keywords: Array.isArray(data?.keywords) ? data.keywords.join(',') : '',
      last_sync: data?.last_sync,
      contact_count: data?.contact_count || 0,
      interaction_count: data?.interaction_count || 0,
      created_at: data?.created_at
    });
  } catch (error: any) {
    console.error('Project API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
