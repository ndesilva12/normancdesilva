"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export interface CustomNewsSource {
  id: string;
  name: string;
  url: string;
  rssUrl: string;
}

// Built-in sources
export const BUILTIN_SOURCES: CustomNewsSource[] = [
  { id: "zerohedge", name: "ZeroHedge", url: "https://www.zerohedge.com", rssUrl: "https://feeds.feedburner.com/zerohedge/feed" },
  { id: "reason", name: "Reason", url: "https://reason.com", rssUrl: "https://reason.com/feed/" },
  { id: "mises", name: "Mises Institute", url: "https://mises.org", rssUrl: "https://mises.org/feed" },
];

interface NewsSourcesContextValue {
  sources: CustomNewsSource[];
  customSources: CustomNewsSource[];
  addSource: (source: Omit<CustomNewsSource, "id">) => void;
  removeSource: (id: string) => void;
  isBuiltIn: (id: string) => boolean;
}

const NewsSourcesContext = createContext<NewsSourcesContextValue | null>(null);

export function NewsSourcesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [customSources, setCustomSources] = useState<CustomNewsSource[]>([]);

  // Load custom sources from Firestore
  useEffect(() => {
    if (!user) {
      setCustomSources([]);
      return;
    }

    if (db) {
      const userDocRef = doc(db, "users", user.uid);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.newsSources) {
              setCustomSources(data.newsSources);
            }
          }
        },
        (error) => {
          console.error("News sources sync error:", error);
        }
      );

      return () => unsubscribe();
    }
  }, [user]);

  const saveCustomSources = useCallback(async (updated: CustomNewsSource[]) => {
    if (!user) return;
    setCustomSources(updated);

    if (db) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { newsSources: updated }, { merge: true });
      } catch (error) {
        console.error("Failed to save news sources:", error);
      }
    }
  }, [user]);

  const addSource = useCallback((source: Omit<CustomNewsSource, "id">) => {
    const newSource: CustomNewsSource = {
      ...source,
      id: `custom-${Date.now()}`,
    };
    saveCustomSources([...customSources, newSource]);
  }, [customSources, saveCustomSources]);

  const removeSource = useCallback((id: string) => {
    saveCustomSources(customSources.filter((s) => s.id !== id));
  }, [customSources, saveCustomSources]);

  const isBuiltIn = useCallback((id: string) => {
    return BUILTIN_SOURCES.some((s) => s.id === id);
  }, []);

  // Combine built-in and custom sources
  const allSources = [...BUILTIN_SOURCES, ...customSources];

  return (
    <NewsSourcesContext.Provider
      value={{
        sources: allSources,
        customSources,
        addSource,
        removeSource,
        isBuiltIn,
      }}
    >
      {children}
    </NewsSourcesContext.Provider>
  );
}

export function useNewsSources() {
  const context = useContext(NewsSourcesContext);
  if (!context) {
    throw new Error("useNewsSources must be used within a NewsSourcesProvider");
  }
  return context;
}
