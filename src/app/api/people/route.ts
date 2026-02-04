import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Client } from '@notionhq/client';

const NOTION_TOKEN = process.env.NOTION_API_KEY;
const PEOPLE_DATABASE_ID = process.env.NOTION_PEOPLE_DATABASE_ID;

interface Person {
  id: string;
  notionId?: string;
  name: string;
  relationship?: string;
  tags?: string[];
  notes?: string;
  email?: string;
  phone?: string;
  company?: string;
  lastSynced?: number;
  createdAt?: number;
  updatedAt?: number;
}

// Helper to extract property value from Notion page
function extractPropertyValue(property: any): string | string[] | undefined {
  if (!property) return undefined;

  switch (property.type) {
    case 'title':
      return property.title?.[0]?.plain_text || undefined;
    case 'rich_text':
      return property.rich_text?.[0]?.plain_text || undefined;
    case 'select':
      return property.select?.name || undefined;
    case 'multi_select':
      return property.multi_select?.map((s: any) => s.name) || [];
    case 'email':
      return property.email || undefined;
    case 'phone_number':
      return property.phone_number || undefined;
    default:
      return undefined;
  }
}

export async function GET() {
  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get people from Firestore
    const snapshot = await db.collection('people_database')
      .orderBy('name', 'asc')
      .get();

    const people: Person[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Person, 'id'>
    }));

    return NextResponse.json({ people });
  } catch (error: any) {
    console.error('People GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const body = await request.json();

    // Check if this is a sync request
    if (body.sync) {
      // Sync from Notion
      if (!NOTION_TOKEN || !PEOPLE_DATABASE_ID) {
        return NextResponse.json({
          error: 'Notion credentials not configured',
          message: 'Set NOTION_API_KEY and NOTION_PEOPLE_DATABASE_ID in environment'
        }, { status: 400 });
      }

      const notion = new Client({ auth: NOTION_TOKEN });

      // Query the People database in Notion
      const response = await notion.databases.query({
        database_id: PEOPLE_DATABASE_ID,
        page_size: 100,
      });

      const syncedPeople: Person[] = [];

      for (const page of response.results) {
        if (!('properties' in page)) continue;

        const props = page.properties;
        const name = extractPropertyValue(props.Name || props.name || props.Title || props.title) as string;

        if (!name) continue;

        const person: Person = {
          id: page.id.replace(/-/g, ''),
          notionId: page.id,
          name,
          relationship: extractPropertyValue(props.Relationship || props.relationship || props.Type || props.type) as string,
          tags: extractPropertyValue(props.Tags || props.tags) as string[],
          notes: extractPropertyValue(props.Notes || props.notes || props.Description || props.description) as string,
          email: extractPropertyValue(props.Email || props.email) as string,
          phone: extractPropertyValue(props.Phone || props.phone) as string,
          company: extractPropertyValue(props.Company || props.company || props.Organization || props.organization) as string,
          lastSynced: Date.now(),
        };

        // Upsert to Firestore
        await db.collection('people_database').doc(person.id).set(person, { merge: true });
        syncedPeople.push(person);
      }

      return NextResponse.json({
        success: true,
        synced: syncedPeople.length,
        people: syncedPeople
      });
    }

    // Create new person
    const { name, relationship, tags, notes, email, phone, company } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newPerson: Omit<Person, 'id'> = {
      name,
      relationship: relationship || undefined,
      tags: tags || [],
      notes: notes || undefined,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const docRef = await db.collection('people_database').add(newPerson);

    return NextResponse.json({
      person: { id: docRef.id, ...newPerson }
    });
  } catch (error: any) {
    console.error('People POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    updates.updatedAt = Date.now();

    await db.collection('people_database').doc(id).update(updates);

    const doc = await db.collection('people_database').doc(id).get();

    return NextResponse.json({
      person: { id: doc.id, ...doc.data() }
    });
  } catch (error: any) {
    console.error('People PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    await db.collection('people_database').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('People DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
