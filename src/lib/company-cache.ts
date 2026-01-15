import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { CompanyAnalysis } from "@/types/company";

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function normalizeCompanyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function getCachedReport(companyName: string): Promise<CompanyAnalysis | null> {
  if (!db) return null;

  try {
    const normalizedName = normalizeCompanyName(companyName);
    const docRef = doc(db, "companyReports", normalizedName);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const updatedAt = data.updatedAt?.toDate?.() || new Date(data.updatedAt);
    const now = new Date();

    // Check if cache is still valid
    if (now.getTime() - updatedAt.getTime() > CACHE_DURATION_MS) {
      return null; // Cache expired
    }

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
  if (!db) return;

  try {
    const normalizedName = normalizeCompanyName(report.companyName);
    const docRef = doc(db, "companyReports", normalizedName);

    await setDoc(docRef, {
      ...report,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error caching report:", error);
  }
}

export async function getRecentReports(limitCount: number = 10): Promise<CompanyAnalysis[]> {
  if (!db) return [];

  try {
    const reportsRef = collection(db, "companyReports");
    const q = query(reportsRef, orderBy("updatedAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

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
  if (!db) return [];

  try {
    const reportsRef = collection(db, "companyReports");
    const q = query(reportsRef, orderBy("updatedAt", "desc"), limit(50));
    const snapshot = await getDocs(q);

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
