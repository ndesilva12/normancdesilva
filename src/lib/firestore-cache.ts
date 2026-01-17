import { getAdminFirestore } from "./firebase-admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

// Cache TTL configuration (in hours)
export const CACHE_TTL = {
  // Roster TTLs
  collegeRoster: 2160,  // 90 days (3 months) - college rosters are stable
  proRoster: 168,       // 7 days - pro rosters change more frequently
  // Company TTLs
  company: 2160,        // 90 days - company data is fairly stable
  companyNews: 24,      // 24 hours - news should be refreshed daily
  // Business TTLs
  business: 720,        // 30 days - local business data changes moderately
  businessSearch: 24,   // 24 hours - search results should refresh daily
  // Other
  geocode: 8760,        // 1 year - geocoded locations rarely change
  roster: 168,          // 7 days - default roster cache
  contactFinder: 720,   // 30 days - contact info doesn't change often
};

// Helper to get roster TTL based on league type
export function getRosterTTL(league: string): number {
  const collegeLeagues = ["ncaa-basketball", "ncaa-football"];
  return collegeLeagues.includes(league) ? CACHE_TTL.collegeRoster : CACHE_TTL.proRoster;
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: Timestamp;
  expiresAt: Timestamp;
  version: number;
}

/**
 * Get cached data from Firestore
 */
export async function getCached<T>(
  collection: string,
  documentId: string
): Promise<{ data: T; fromCache: boolean } | null> {
  const db = getAdminFirestore();
  if (!db) {
    console.log("Firestore not available, skipping cache check");
    return null;
  }

  try {
    const docRef = db.collection(collection).doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const entry = doc.data() as CacheEntry<T>;
    const now = Timestamp.now();

    // Check if cache has expired
    if (entry.expiresAt.toMillis() < now.toMillis()) {
      console.log(`Cache expired for ${collection}/${documentId}`);
      return null;
    }

    console.log(`Cache hit for ${collection}/${documentId}`);
    return { data: entry.data, fromCache: true };
  } catch (error) {
    console.error(`Cache read error for ${collection}/${documentId}:`, error);
    return null;
  }
}

/**
 * Store data in Firestore cache
 */
export async function setCache<T>(
  collection: string,
  documentId: string,
  data: T,
  ttlHours: number
): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) {
    console.log("Firestore not available, skipping cache write");
    return false;
  }

  try {
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + ttlHours * 60 * 60 * 1000);

    const entry: CacheEntry<T> = {
      data,
      cachedAt: now,
      expiresAt,
      version: 1,
    };

    const docRef = db.collection(collection).doc(documentId);
    await docRef.set(entry, { merge: false });

    console.log(`Cached ${collection}/${documentId}, expires in ${ttlHours} hours`);
    return true;
  } catch (error) {
    console.error(`Cache write error for ${collection}/${documentId}:`, error);
    return false;
  }
}

/**
 * Delete cached data
 */
export async function deleteCache(
  collection: string,
  documentId: string
): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;

  try {
    const docRef = db.collection(collection).doc(documentId);
    await docRef.delete();
    return true;
  } catch (error) {
    console.error(`Cache delete error for ${collection}/${documentId}:`, error);
    return false;
  }
}

/**
 * Generate a safe document ID from a string
 */
export function generateCacheKey(...parts: string[]): string {
  return parts
    .map(part => part.toLowerCase().trim())
    .join("_")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100); // Firestore document ID limit
}

/**
 * Record cache access for analytics
 */
export async function recordCacheAccess(
  collection: string,
  documentId: string,
  hit: boolean
): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;

  try {
    const statsRef = db.collection("cache_stats").doc("summary");
    await statsRef.set(
      {
        [collection]: {
          [hit ? "hits" : "misses"]: FieldValue.increment(1),
          lastAccess: Timestamp.now(),
        },
      },
      { merge: true }
    );
  } catch {
    // Stats recording is non-critical, ignore errors
  }
}
