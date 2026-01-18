"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings, ToolId } from "@/contexts/SettingsContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export interface RecentSearchItem {
  query: string;
  timestamp: number;
}

export interface RecentSearchesData {
  [toolId: string]: RecentSearchItem[];
}

const STORAGE_KEY_PREFIX = "dashboard-recent-searches-";

interface RecentSearchesContextValue {
  getRecentSearches: (toolId: ToolId) => RecentSearchItem[];
  addRecentSearch: (toolId: ToolId, query: string) => void;
  clearRecentSearches: (toolId: ToolId) => void;
  isToolEnabled: (toolId: ToolId) => boolean;
}

const RecentSearchesContext = createContext<RecentSearchesContextValue | null>(null);

export function RecentSearchesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [recentSearches, setRecentSearches] = useState<RecentSearchesData>({});

  // Get storage key for user
  const getStorageKey = useCallback((userId: string | undefined) => {
    return userId ? `${STORAGE_KEY_PREFIX}${userId}` : "";
  }, []);

  // Load recent searches from Firestore with real-time sync
  useEffect(() => {
    if (!user) {
      setRecentSearches({});
      return;
    }

    const storageKey = getStorageKey(user.uid);

    if (db) {
      const userDocRef = doc(db, "users", user.uid);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.recentSearches) {
              setRecentSearches(data.recentSearches);
              localStorage.setItem(storageKey, JSON.stringify(data.recentSearches));
            }
          } else {
            // Check localStorage for initial data
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const localData = JSON.parse(stored);
                setRecentSearches(localData);
                // Migrate to Firestore
                setDoc(userDocRef, { recentSearches: localData }, { merge: true });
              } catch {
                setRecentSearches({});
              }
            }
          }
        },
        (error) => {
          console.error("Recent searches sync error:", error);
          // Fallback to localStorage
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              setRecentSearches(JSON.parse(stored));
            } catch {
              setRecentSearches({});
            }
          }
        }
      );

      return () => unsubscribe();
    } else {
      // Fallback to localStorage only
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {
          setRecentSearches({});
        }
      }
    }
  }, [user, getStorageKey]);

  // Save recent searches
  const saveRecentSearches = useCallback(async (updated: RecentSearchesData) => {
    if (!user) return;

    setRecentSearches(updated);

    const storageKey = getStorageKey(user.uid);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    if (db) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { recentSearches: updated }, { merge: true });
      } catch (error) {
        console.error("Failed to save recent searches to Firestore:", error);
      }
    }
  }, [user, getStorageKey]);

  // Check if tool has recent searches enabled
  const isToolEnabled = useCallback((toolId: ToolId) => {
    return (settings.recentSearches?.enabledTools || []).includes(toolId);
  }, [settings.recentSearches?.enabledTools]);

  // Get recent searches for a tool
  const getRecentSearches = useCallback((toolId: ToolId): RecentSearchItem[] => {
    if (!isToolEnabled(toolId)) return [];
    const maxItems = settings.recentSearches?.maxRecentItems || 5;
    return (recentSearches[toolId] || []).slice(0, maxItems);
  }, [recentSearches, isToolEnabled, settings.recentSearches?.maxRecentItems]);

  // Add a recent search
  const addRecentSearch = useCallback((toolId: ToolId, query: string) => {
    if (!isToolEnabled(toolId) || !query.trim()) return;

    const maxItems = settings.recentSearches?.maxRecentItems || 5;
    const current = recentSearches[toolId] || [];

    // Remove duplicates of the same query
    const filtered = current.filter(item => item.query.toLowerCase() !== query.toLowerCase().trim());

    // Add new item at the beginning
    const newItem: RecentSearchItem = {
      query: query.trim(),
      timestamp: Date.now(),
    };

    const updated = [newItem, ...filtered].slice(0, maxItems);

    saveRecentSearches({
      ...recentSearches,
      [toolId]: updated,
    });
  }, [recentSearches, saveRecentSearches, isToolEnabled, settings.recentSearches?.maxRecentItems]);

  // Clear recent searches for a tool
  const clearRecentSearches = useCallback((toolId: ToolId) => {
    const updated = { ...recentSearches };
    delete updated[toolId];
    saveRecentSearches(updated);
  }, [recentSearches, saveRecentSearches]);

  return (
    <RecentSearchesContext.Provider
      value={{
        getRecentSearches,
        addRecentSearch,
        clearRecentSearches,
        isToolEnabled,
      }}
    >
      {children}
    </RecentSearchesContext.Provider>
  );
}

export function useRecentSearches() {
  const context = useContext(RecentSearchesContext);
  if (!context) {
    throw new Error("useRecentSearches must be used within a RecentSearchesProvider");
  }
  return context;
}
