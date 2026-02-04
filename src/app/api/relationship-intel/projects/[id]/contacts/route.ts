import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const projectId = params.id;
    
    const contacts = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT i.id) as interaction_count
      FROM contacts c
      JOIN contact_projects cp ON c.email = cp.contact_email
      LEFT JOIN interactions i ON i.project_id = ?
        AND (i.from_email = c.email OR EXISTS (
          SELECT 1 FROM interaction_participants ip 
          WHERE ip.interaction_id = i.id AND ip.email = c.email
        ))
      WHERE cp.project_id = ?
      GROUP BY c.email
      ORDER BY c.last_seen DESC
    `).all(projectId, projectId);
    
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
