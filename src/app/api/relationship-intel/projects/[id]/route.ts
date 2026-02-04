import { NextResponse } from 'next/server';
import { getDb } from '../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
