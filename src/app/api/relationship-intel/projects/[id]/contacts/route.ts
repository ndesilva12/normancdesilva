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
      .orderBy('last_seen', 'desc')
      .get();
    
    // Get interaction counts for each contact
    const contacts = await Promise.all(
      contactsSnapshot.docs.map(async (doc) => {
        const contactData = { id: doc.id, ...doc.data() };
        
        // Count interactions where this contact is involved
        const interactionsSnapshot = await db
          .collection('relationship_intel_interactions')
          .where('project_id', '==', projectId)
          .where('participant_emails', 'array-contains', doc.id)
          .get();
        
        return {
          ...contactData,
          interaction_count: interactionsSnapshot.size
        };
      })
    );
    
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
