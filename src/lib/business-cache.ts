import { getAdminFirestore } from "./firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { BusinessAnalysis, BusinessSearchResult } from "@/types/business";
import { CACHE_TTL } from "./firestore-cache";

// Use the configurable TTL from firestore-cache (defaults to 7 days like company)
const CACHE_DURATION_MS = (CACHE_TTL.business || CACHE_TTL.company) * 60 * 60 * 1000;

function normalizeBusinessKey(name: string, city: string, state: string): string {
  const normalized = `${name}-${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return normalized;
}

export async function getCachedBusinessReport(
  name: string,
  city: string,
  state: string
): Promise<BusinessAnalysis | null> {
  const db = getAdminFirestore();
  if (!db) {
    console.log("Firebase Admin not available, skipping cache check");
    return null;
  }

  try {
    const key = normalizeBusinessKey(name, city, state);
    console.log(`Checking cache for business: ${key}`);
    const docRef = db.collection("businessReports").doc(key);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`Cache MISS for business: ${name}`);
      return null;
    }

    const data = docSnap.data();
    if (!data) return null;

    const searchedAt = data.searchedAt?.toDate?.() || new Date(data.searchedAt);
    const now = new Date();

    // Check if cache is still valid
    if (now.getTime() - searchedAt.getTime() > CACHE_DURATION_MS) {
      console.log(`Cache EXPIRED for business: ${name}`);
      return null;
    }

    console.log(`Cache HIT for business: ${name}`);
    return {
      ...data,
      searchedAt: searchedAt,
    } as BusinessAnalysis;
  } catch (error) {
    console.error("Error getting cached business report:", error);
    return null;
  }
}

export async function cacheBusinessReport(report: BusinessAnalysis): Promise<void> {
  const db = getAdminFirestore();
  if (!db) {
    console.log("Firebase Admin not available, skipping cache write");
    return;
  }

  try {
    const key = normalizeBusinessKey(report.businessName, report.city, report.state);
    console.log(`Caching business report: ${key}`);
    const docRef = db.collection("businessReports").doc(key);

    await docRef.set({
      ...report,
      searchedAt: Timestamp.now(),
    });
    console.log(`Successfully cached business: ${report.businessName}`);
  } catch (error) {
    console.error("Error caching business report:", error);
  }
}

export async function getCachedBusinessSearchResults(
  query: string,
  city: string,
  state: string
): Promise<BusinessSearchResult[] | null> {
  const db = getAdminFirestore();
  if (!db) return null;

  try {
    const key = normalizeBusinessKey(query, city, state);
    const docRef = db.collection("businessSearchResults").doc(key);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    const data = docSnap.data();
    if (!data) return null;

    const cachedAt = data.cachedAt?.toDate?.() || new Date(data.cachedAt);
    const now = new Date();

    // Search results expire faster (1 day)
    if (now.getTime() - cachedAt.getTime() > 24 * 60 * 60 * 1000) {
      return null;
    }

    return data.results as BusinessSearchResult[];
  } catch (error) {
    console.error("Error getting cached search results:", error);
    return null;
  }
}

export async function cacheBusinessSearchResults(
  query: string,
  city: string,
  state: string,
  results: BusinessSearchResult[]
): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;

  try {
    const key = normalizeBusinessKey(query, city, state);
    const docRef = db.collection("businessSearchResults").doc(key);

    await docRef.set({
      query,
      city,
      state,
      results,
      cachedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error caching search results:", error);
  }
}
