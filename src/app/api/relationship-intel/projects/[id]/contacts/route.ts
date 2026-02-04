import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const db = getDb();
    
    // Get all contacts for this project
    const contactsSnapshot = await db
      .collection('relationship_intel_contacts')
      .where('projects', 'array-contains', projectId)
      .get();
    
    // Get interaction counts for each contact
    const contacts = await Promise.all(
      contactsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Count interactions where this contact is involved
        const interactionsSnapshot = await db
          .collection('relationship_intel_interactions')
          .where('project_id', '==', projectId)
          .where('participant_emails', 'array-contains', doc.id)
          .get();
        
        return {
          email: doc.id,
          name: data.name,
          first_seen: data.first_seen,
          last_seen: data.last_seen,
          notes: data.notes || null,
          status: data.status || null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          projects: Array.isArray(data.projects) ? data.projects : [],
          updated_at: data.updated_at,
          interaction_count: interactionsSnapshot.size
        };
      })
    );
    
    // Sort by last_seen descending
    contacts.sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0));
    
    return NextResponse.json(contacts);
  } catch (error: any) {
    console.error('Contacts API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
