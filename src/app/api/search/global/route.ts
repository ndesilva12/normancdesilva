import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

interface SearchResult {
  id: string;
  type: 'contact' | 'interaction' | 'mission' | 'curate' | 'deep_search' | 'dark_search' | 'recommendation' | 'person';
  title: string;
  subtitle?: string;
  snippet?: string;
  url?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase();
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const db = getAdminFirestore();
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const results: SearchResult[] = [];

    // Search contacts
    try {
      const contactsSnapshot = await db.collection('relationship_intel_contacts').limit(100).get();
      contactsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const searchableText = [
          data.name,
          data.email || doc.id,
          data.company,
          data.position,
          data.notes,
          ...(data.tags || []),
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(query)) {
          results.push({
            id: doc.id,
            type: 'contact',
            title: data.name || doc.id,
            subtitle: data.email || doc.id,
            snippet: data.company ? `${data.position || ''} at ${data.company}` : undefined,
            url: `/relationship-intel?contact=${encodeURIComponent(doc.id)}`,
            timestamp: data.last_seen,
            metadata: { tags: data.tags },
          });
        }
      });
    } catch (err) {
      console.error('Error searching contacts:', err);
    }

    // Search interactions
    try {
      const interactionsSnapshot = await db.collection('relationship_intel_interactions')
        .orderBy('date', 'desc')
        .limit(50)
        .get();

      interactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const searchableText = [
          data.subject,
          data.title,
          data.snippet,
          data.from_name,
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(query)) {
          results.push({
            id: doc.id,
            type: 'interaction',
            title: data.subject || data.title || 'Interaction',
            subtitle: data.type === 'email' ? 'Email' : 'Meeting',
            snippet: data.snippet?.slice(0, 100),
            url: `/relationship-intel`,
            timestamp: data.date,
          });
        }
      });
    } catch (err) {
      console.error('Error searching interactions:', err);
    }

    // Search mission items
    try {
      const missionSnapshot = await db.collection('mission_items').limit(50).get();
      missionSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const searchableText = [
          data.title,
          data.description,
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(query)) {
          results.push({
            id: doc.id,
            type: 'mission',
            title: data.title || 'Mission Item',
            subtitle: `Status: ${data.status}`,
            snippet: data.description?.slice(0, 100),
            url: '/mission',
            timestamp: data.createdAt,
            metadata: { status: data.status },
          });
        }
      });
    } catch (err) {
      console.error('Error searching mission items:', err);
    }

    // Search curate history
    try {
      const curateSnapshot = await db.collection('curate_history')
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();

      curateSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.query?.toLowerCase().includes(query)) {
          results.push({
            id: doc.id,
            type: 'curate',
            title: data.query || 'Curate Search',
            subtitle: 'Curate History',
            snippet: `${data.results?.length || 0} results`,
            url: '/tools/curate',
            timestamp: data.timestamp,
          });
        }
      });
    } catch (err) {
      console.error('Error searching curate history:', err);
    }

    // Search deep search history
    try {
      const deepSnapshot = await db.collection('deep_search_history')
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();

      deepSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.query?.toLowerCase().includes(query)) {
          results.push({
            id: doc.id,
            type: 'deep_search',
            title: data.query || 'Deep Search',
            subtitle: 'Deep Search History',
            url: '/tools/deep-search',
            timestamp: data.timestamp,
          });
        }
      });
    } catch (err) {
      console.error('Error searching deep search history:', err);
    }

    // Search dark search history
    try {
      const darkSnapshot = await db.collection('dark_search_history')
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();

      darkSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.query?.toLowerCase().includes(query)) {
          results.push({
            id: doc.id,
            type: 'dark_search',
            title: data.query || 'Dark Search',
            subtitle: 'Dark Search History',
            url: '/tools/dark-search',
            timestamp: data.timestamp,
          });
        }
      });
    } catch (err) {
      console.error('Error searching dark search history:', err);
    }

    // Search recommendations
    try {
      const recommendationsSnapshot = await db.collection('recommendations').limit(50).get();
      recommendationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const searchableText = [
          data.title,
          data.description,
          data.source,
          data.type,
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(query)) {
          results.push({
            id: doc.id,
            type: 'recommendation',
            title: data.title || 'Recommendation',
            subtitle: `${data.type} from ${data.source || 'Unknown'}`,
            url: '/recommendations',
            timestamp: data.createdAt,
            metadata: { type: data.type, status: data.status },
          });
        }
      });
    } catch (err) {
      console.error('Error searching recommendations:', err);
    }

    // Search people database
    try {
      const peopleSnapshot = await db.collection('people_database').limit(50).get();
      peopleSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const searchableText = [
          data.name,
          data.relationship,
          data.notes,
          ...(data.tags || []),
        ].filter(Boolean).join(' ').toLowerCase();

        if (searchableText.includes(query)) {
          results.push({
            id: doc.id,
            type: 'person',
            title: data.name || 'Person',
            subtitle: data.relationship,
            url: '/people',
            timestamp: data.lastSynced,
            metadata: { tags: data.tags },
          });
        }
      });
    } catch (err) {
      console.error('Error searching people database:', err);
    }

    // Sort by relevance (exact matches first, then by timestamp)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query ? 1 : 0;
      const bExact = b.title.toLowerCase() === query ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aStarts = a.title.toLowerCase().startsWith(query) ? 1 : 0;
      const bStarts = b.title.toLowerCase().startsWith(query) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
    });
  } catch (error: any) {
    console.error('Global search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
