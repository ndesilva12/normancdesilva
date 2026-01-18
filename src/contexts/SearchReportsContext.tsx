"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, collection, addDoc, getDocs, deleteDoc, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";

// Types for Dark Search reports
export interface DarkSearchReport {
  id?: string;
  type: "dark-search";
  topic: string;
  summary: string;
  sections: {
    title: string;
    content: string;
    links?: { title: string; url: string; type: string }[];
  }[];
  keyTakeaways: string[];
  alternativePerspectives: string[];
  unansweredQuestions: string[];
  socialMediaHighlights: { platform: string; author: string; content: string; url: string }[];
  podcastReferences: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  timestamp: number;
  createdAt?: Timestamp;
}

// Types for Deep Search reports
export interface DeepSearchReport {
  id?: string;
  type: "deep-search";
  topic: string;
  briefOverview: string;
  sections: {
    title: string;
    content: string;
    links?: { title: string; url: string; type: string }[];
  }[];
  hiddenMechanics: string[];
  counterintuitiveInsights: string[];
  expertDebates: string[];
  underreportedAngles: string[];
  socialMediaHighlights: { platform: string; author: string; content: string; url: string }[];
  podcastReferences: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  timestamp: number;
  createdAt?: Timestamp;
}

export type SearchReport = DarkSearchReport | DeepSearchReport;

interface SearchReportsContextValue {
  darkSearchReports: DarkSearchReport[];
  deepSearchReports: DeepSearchReport[];
  saveDarkSearchReport: (report: Omit<DarkSearchReport, "id" | "type" | "createdAt">) => Promise<string | null>;
  saveDeepSearchReport: (report: Omit<DeepSearchReport, "id" | "type" | "createdAt">) => Promise<string | null>;
  deleteReport: (reportId: string, type: "dark-search" | "deep-search") => Promise<void>;
  isLoading: boolean;
}

const SearchReportsContext = createContext<SearchReportsContextValue | null>(null);

export function SearchReportsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [darkSearchReports, setDarkSearchReports] = useState<DarkSearchReport[]>([]);
  const [deepSearchReports, setDeepSearchReports] = useState<DeepSearchReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reports from Firestore
  useEffect(() => {
    if (!user || !db) {
      setDarkSearchReports([]);
      setDeepSearchReports([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to dark search reports
    const darkSearchRef = collection(db, "users", user.uid, "darkSearchReports");
    const darkSearchQuery = query(darkSearchRef, orderBy("createdAt", "desc"), limit(50));

    const unsubDark = onSnapshot(
      darkSearchQuery,
      (snapshot) => {
        const reports: DarkSearchReport[] = [];
        snapshot.forEach((doc) => {
          reports.push({ id: doc.id, ...doc.data() } as DarkSearchReport);
        });
        setDarkSearchReports(reports);
      },
      (error) => {
        console.error("Error loading dark search reports:", error);
      }
    );

    // Subscribe to deep search reports
    const deepSearchRef = collection(db, "users", user.uid, "deepSearchReports");
    const deepSearchQuery = query(deepSearchRef, orderBy("createdAt", "desc"), limit(50));

    const unsubDeep = onSnapshot(
      deepSearchQuery,
      (snapshot) => {
        const reports: DeepSearchReport[] = [];
        snapshot.forEach((doc) => {
          reports.push({ id: doc.id, ...doc.data() } as DeepSearchReport);
        });
        setDeepSearchReports(reports);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error loading deep search reports:", error);
        setIsLoading(false);
      }
    );

    return () => {
      unsubDark();
      unsubDeep();
    };
  }, [user]);

  // Save a Dark Search report
  const saveDarkSearchReport = useCallback(async (
    report: Omit<DarkSearchReport, "id" | "type" | "createdAt">
  ): Promise<string | null> => {
    if (!user || !db) {
      console.warn("Cannot save report: user not authenticated or db not available");
      return null;
    }

    try {
      const reportsRef = collection(db, "users", user.uid, "darkSearchReports");
      const docRef = await addDoc(reportsRef, {
        ...report,
        type: "dark-search",
        createdAt: Timestamp.now(),
      });
      console.log("Dark Search report saved with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error saving Dark Search report:", error);
      return null;
    }
  }, [user]);

  // Save a Deep Search report
  const saveDeepSearchReport = useCallback(async (
    report: Omit<DeepSearchReport, "id" | "type" | "createdAt">
  ): Promise<string | null> => {
    if (!user || !db) {
      console.warn("Cannot save report: user not authenticated or db not available");
      return null;
    }

    try {
      const reportsRef = collection(db, "users", user.uid, "deepSearchReports");
      const docRef = await addDoc(reportsRef, {
        ...report,
        type: "deep-search",
        createdAt: Timestamp.now(),
      });
      console.log("Deep Search report saved with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error saving Deep Search report:", error);
      return null;
    }
  }, [user]);

  // Delete a report
  const deleteReport = useCallback(async (reportId: string, type: "dark-search" | "deep-search") => {
    if (!user || !db) return;

    try {
      const collectionName = type === "dark-search" ? "darkSearchReports" : "deepSearchReports";
      const reportRef = doc(db, "users", user.uid, collectionName, reportId);
      await deleteDoc(reportRef);
      console.log("Report deleted:", reportId);
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  }, [user]);

  return (
    <SearchReportsContext.Provider
      value={{
        darkSearchReports,
        deepSearchReports,
        saveDarkSearchReport,
        saveDeepSearchReport,
        deleteReport,
        isLoading,
      }}
    >
      {children}
    </SearchReportsContext.Provider>
  );
}

export function useSearchReports() {
  const context = useContext(SearchReportsContext);
  if (!context) {
    throw new Error("useSearchReports must be used within a SearchReportsProvider");
  }
  return context;
}
