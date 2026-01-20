"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export type ThemeMode = "dark" | "light";
export type TimeFormat = "12h" | "24h";

export interface ThemeColor {
  name: string;
  value: string;
  rgb: string;
}

export const THEME_COLORS: ThemeColor[] = [
  // Blues & Cyans
  { name: "Cyan", value: "#00d4ff", rgb: "0, 212, 255" },
  { name: "Sky", value: "#0ea5e9", rgb: "14, 165, 233" },
  { name: "Blue", value: "#3b82f6", rgb: "59, 130, 246" },
  { name: "Indigo", value: "#6366f1", rgb: "99, 102, 241" },
  { name: "Navy", value: "#1e40af", rgb: "30, 64, 175" },
  // Purples & Pinks
  { name: "Violet", value: "#8b5cf6", rgb: "139, 92, 246" },
  { name: "Purple", value: "#a855f7", rgb: "168, 85, 247" },
  { name: "Fuchsia", value: "#d946ef", rgb: "217, 70, 239" },
  { name: "Pink", value: "#ec4899", rgb: "236, 72, 153" },
  { name: "Rose", value: "#f43f5e", rgb: "244, 63, 94" },
  // Reds & Oranges
  { name: "Red", value: "#ef4444", rgb: "239, 68, 68" },
  { name: "Crimson", value: "#dc2626", rgb: "220, 38, 38" },
  { name: "Orange", value: "#f97316", rgb: "249, 115, 22" },
  { name: "Amber", value: "#f59e0b", rgb: "245, 158, 11" },
  { name: "Gold", value: "#ca8a04", rgb: "202, 138, 4" },
  // Yellows & Greens
  { name: "Yellow", value: "#eab308", rgb: "234, 179, 8" },
  { name: "Lime", value: "#84cc16", rgb: "132, 204, 22" },
  { name: "Green", value: "#22c55e", rgb: "34, 197, 94" },
  { name: "Emerald", value: "#10b981", rgb: "16, 185, 129" },
  { name: "Teal", value: "#14b8a6", rgb: "20, 184, 166" },
  // Neutrals & Special
  { name: "Slate", value: "#64748b", rgb: "100, 116, 139" },
  { name: "Stone", value: "#78716c", rgb: "120, 113, 108" },
  { name: "White", value: "#f5f5f5", rgb: "245, 245, 245" },
  { name: "Silver", value: "#a1a1aa", rgb: "161, 161, 170" },
];

export const TIMEZONES = [
  { value: "auto", label: "Auto (Browser)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

export interface SearchSourceSettings {
  enabledSources: string[]; // List of enabled source IDs
  defaultSourceShort: string; // Default for queries < 6 words
  defaultSourceLong: string; // Default for queries >= 6 words
}

export interface RecentSearchesSettings {
  enabledTools: string[]; // List of tool IDs that should show recent searches
  maxRecentItems: number; // Max number of recent items to show per tool
}

// Tool IDs for recent searches
export const TOOL_IDS = [
  "search", "notes", "emails", "calendar", "contacts", "files",
  "market", "news", "trending", "visuals", "business-info",
  "deep-search", "dark-search", "contact-finder", "company-politics",
  "spotify", "image-lookup", "visual-rosters"
] as const;

export type ToolId = typeof TOOL_IDS[number];

export interface UserSettings {
  themeMode: ThemeMode;
  themeColor: string;
  timezone: string;
  timeFormat: TimeFormat;
  connectedEmails: string[];
  searchSources: SearchSourceSettings;
  recentSearches: RecentSearchesSettings;
}

// All available search sources for default settings
const ALL_SEARCH_SOURCES = [
  "ai", "web", "google", "images", "news", "trends", "duck", "wikipedia", "grokipedia",
  "deep-search", "dark-search", "corporate-info", "business-info", "contacts", "contact-finder",
  "x", "youtube", "rumble", "amazon", "image-lookup", "visuals", "rosters",
  "spotify", "grok", "gemini", "claude", "chatgpt"
];

const DEFAULT_SETTINGS: UserSettings = {
  themeMode: "dark",
  themeColor: "#00d4ff",
  timezone: "auto",
  timeFormat: "12h",
  connectedEmails: [],
  searchSources: {
    enabledSources: ALL_SEARCH_SOURCES,
    defaultSourceShort: "google", // Default source is Google
    defaultSourceLong: "grok", // Default for long queries (AI better for detailed questions)
  },
  recentSearches: {
    enabledTools: [...TOOL_IDS], // All tools enabled by default
    maxRecentItems: 5,
  },
};

interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  formatTime: (date: Date) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return "0, 212, 255"; // Default cyan
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply theme mode
    root.setAttribute("data-theme", settings.themeMode);

    // Apply theme color (support both preset and custom colors)
    const presetColor = THEME_COLORS.find(c => c.value === settings.themeColor);
    if (presetColor) {
      root.style.setProperty("--accent", presetColor.value);
      root.style.setProperty("--accent-rgb", presetColor.rgb);
    } else {
      // Custom color - compute RGB
      root.style.setProperty("--accent", settings.themeColor);
      root.style.setProperty("--accent-rgb", hexToRgb(settings.themeColor));
    }
  }, [settings.themeMode, settings.themeColor]);

  // Load settings from Firestore with real-time sync
  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    const storageKey = `dashboard-settings-${user.uid}`;

    if (db) {
      const userDocRef = doc(db, "users", user.uid);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.settings) {
              setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
              localStorage.setItem(storageKey, JSON.stringify(data.settings));
            }
          } else {
            // Check localStorage for initial data
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const localSettings = JSON.parse(stored);
                setSettings({ ...DEFAULT_SETTINGS, ...localSettings });
                setDoc(userDocRef, { settings: localSettings }, { merge: true });
              } catch {
                setSettings(DEFAULT_SETTINGS);
              }
            }
          }
        },
        (error) => {
          console.error("Settings sync error:", error);
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            } catch {
              setSettings(DEFAULT_SETTINGS);
            }
          }
        }
      );

      return () => unsubscribe();
    } else {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      }
    }
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    if (!user) return;

    const storageKey = `dashboard-settings-${user.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(newSettings));

    if (db) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { settings: newSettings }, { merge: true });
      } catch (error) {
        console.error("Failed to save settings to Firestore:", error);
      }
    }
  }, [user, settings]);

  const getTimezone = useCallback(() => {
    if (settings.timezone === "auto") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return settings.timezone;
  }, [settings.timezone]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: settings.timeFormat === "12h",
      timeZone: getTimezone(),
    });
  }, [settings.timeFormat, getTimezone]);

  const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions) => {
    return date.toLocaleDateString("en-US", {
      timeZone: getTimezone(),
      ...options,
    });
  }, [getTimezone]);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isSettingsOpen,
        openSettings,
        closeSettings,
        formatTime,
        formatDate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
