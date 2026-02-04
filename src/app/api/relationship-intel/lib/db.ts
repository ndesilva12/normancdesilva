import { getAdminFirestore } from '@/lib/firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (db) return db;
  
  const firestore = getAdminFirestore();
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }
  
  db = firestore;
  return db;
}

// Firestore collections:
// - relationship_intel_projects
// - relationship_intel_contacts
// - relationship_intel_interactions
