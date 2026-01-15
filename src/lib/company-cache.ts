import { getAdminFirestore } from "./firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { CompanyAnalysis } from "@/types/company";
import { CACHE_TTL } from "./firestore-cache";

// Use the configurable TTL from firestore-cache
const CACHE_DURATION_MS = CACHE_TTL.company * 60 * 60 * 1000; // Convert hours to ms

function normalizeCompanyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function getCachedReport(companyName: string): Promise<CompanyAnalysis | null> {
  const db = getAdminFirestore();
  if (!db) {
    console.log("Firebase Admin not available, skipping cache check");
    return null;
  }

  try {
    const normalizedName = normalizeCompanyName(companyName);
    console.log(`Checking cache for company: ${normalizedName}`);
    const docRef = db.collection("companyReports").doc(normalizedName);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`Cache MISS for company: ${companyName}`);
      return null;
    }

    const data = docSnap.data();
    if (!data) return null;

    const updatedAt = data.updatedAt?.toDate?.() || new Date(data.updatedAt);
    const now = new Date();

    // Check if cache is still valid
    if (now.getTime() - updatedAt.getTime() > CACHE_DURATION_MS) {
      console.log(`Cache EXPIRED for company: ${companyName}`);
      return null; // Cache expired
    }

    console.log(`Cache HIT for company: ${companyName}`);
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: updatedAt,
    } as CompanyAnalysis;
  } catch (error) {
    console.error("Error getting cached report:", error);
    return null;
  }
}

export async function cacheReport(report: CompanyAnalysis): Promise<void> {
  const db = getAdminFirestore();
  if (!db) {
    console.log("Firebase Admin not available, skipping cache write");
    return;
  }

  try {
    const normalizedName = normalizeCompanyName(report.companyName);
    console.log(`Caching company report: ${normalizedName}`);
    const docRef = db.collection("companyReports").doc(normalizedName);

    await docRef.set({
      ...report,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`Successfully cached company: ${report.companyName}`);
  } catch (error) {
    console.error("Error caching report:", error);
  }
}

export async function getRecentReports(limitCount: number = 10): Promise<CompanyAnalysis[]> {
  const db = getAdminFirestore();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection("companyReports")
      .orderBy("updatedAt", "desc")
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as CompanyAnalysis;
    });
  } catch (error) {
    console.error("Error getting recent reports:", error);
    return [];
  }
}

export async function searchCachedCompanies(searchQuery: string): Promise<CompanyAnalysis[]> {
  const db = getAdminFirestore();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection("companyReports")
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    const normalizedQuery = searchQuery.toLowerCase();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as CompanyAnalysis;
      })
      .filter(
        (report) =>
          report.companyName.toLowerCase().includes(normalizedQuery) ||
          report.industry.toLowerCase().includes(normalizedQuery) ||
          (report.ticker && report.ticker.toLowerCase().includes(normalizedQuery))
      );
  } catch (error) {
    console.error("Error searching cached companies:", error);
    return [];
  }
}
