"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// Widget size options
export type WidgetSize = "collapsed" | "default" | "expanded";

// Widget configuration
export interface WidgetConfig {
  id: string;
  size: WidgetSize;
  visible: boolean;
  order: number;
  customName?: string;
}

// Layout configuration
export interface LayoutConfig {
  previewWidgets: WidgetConfig[];
  toolCards: WidgetConfig[];
  version: number;
  searchSourceMode: "alwaysShowing" | "onlySelection";
}

// Default widget configurations - Data Widgets (connected services)
const DEFAULT_PREVIEW_WIDGETS: WidgetConfig[] = [
  { id: "news", size: "default", visible: true, order: 0 },
  { id: "trending", size: "default", visible: true, order: 1 },
  { id: "calendar", size: "default", visible: true, order: 2 },
  { id: "emails", size: "default", visible: true, order: 3 },
  { id: "contacts", size: "default", visible: true, order: 4 },
  { id: "files", size: "default", visible: true, order: 5 },
  { id: "notes", size: "default", visible: true, order: 6 },
  { id: "stocks", size: "default", visible: true, order: 7 },
  { id: "accounts", size: "default", visible: true, order: 8 },
  { id: "raindrop", size: "default", visible: true, order: 9 },
  { id: "inoreader", size: "default", visible: true, order: 10 },
];

// Tool Widgets (interactive tools and features)
const DEFAULT_TOOL_CARDS: WidgetConfig[] = [
  { id: "deep-search", size: "default", visible: true, order: 0 },
  { id: "dark-search", size: "default", visible: true, order: 1 },
  { id: "contact-finder", size: "default", visible: true, order: 2 },
  { id: "company-politics", size: "default", visible: true, order: 3 },
  { id: "business-info", size: "default", visible: true, order: 4 },
  { id: "contacts", size: "default", visible: true, order: 5 },
  { id: "visual-rosters", size: "default", visible: true, order: 6 },
  { id: "image-lookup", size: "default", visible: true, order: 7 },
  { id: "visuals", size: "default", visible: true, order: 8 },
  { id: "spotify", size: "default", visible: true, order: 9 },
];

const DEFAULT_LAYOUT: LayoutConfig = {
  previewWidgets: DEFAULT_PREVIEW_WIDGETS,
  toolCards: DEFAULT_TOOL_CARDS,
  version: 2,
  searchSourceMode: "onlySelection",
};

interface LayoutContextType {
  layout: LayoutConfig;
  isEditMode: boolean;
  pendingLayout: LayoutConfig | null;
  enterEditMode: () => void;
  exitEditMode: (save: boolean) => void;
  updateWidgetSize: (type: "previewWidgets" | "toolCards", id: string, size: WidgetSize) => void;
  updateWidgetVisibility: (type: "previewWidgets" | "toolCards", id: string, visible: boolean) => void;
  updateWidgetName: (type: "previewWidgets" | "toolCards", id: string, customName: string) => void;
  reorderWidgets: (type: "previewWidgets" | "toolCards", fromIndex: number, toIndex: number) => void;
  resetLayout: () => void;
  getWidgetConfig: (type: "previewWidgets" | "toolCards", id: string) => WidgetConfig | undefined;
  toggleWidgetCollapse: (type: "previewWidgets" | "toolCards", id: string) => void;
  setSearchSourceMode: (mode: "alwaysShowing" | "onlySelection") => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingLayout, setPendingLayout] = useState<LayoutConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mark as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to merge and sort layout with defaults
  const mergeLayoutWithDefaults = (parsed: LayoutConfig): LayoutConfig => {
    // Merge with defaults to handle new widgets
    const mergedPreviewWidgets = DEFAULT_PREVIEW_WIDGETS.map((defaultWidget) => {
      const savedWidget = parsed.previewWidgets?.find((w) => w.id === defaultWidget.id);
      return savedWidget || defaultWidget;
    });
    const mergedToolCards = DEFAULT_TOOL_CARDS.map((defaultWidget) => {
      const savedWidget = parsed.toolCards?.find((w) => w.id === defaultWidget.id);
      return savedWidget || defaultWidget;
    });
    // Sort by saved order to preserve user's widget arrangement
    mergedPreviewWidgets.sort((a, b) => a.order - b.order);
    mergedToolCards.sort((a, b) => a.order - b.order);
    return {
      previewWidgets: mergedPreviewWidgets,
      toolCards: mergedToolCards,
      version: parsed.version || 1,
      searchSourceMode: parsed.searchSourceMode || "onlySelection",
    };
  };

  // Load layout from Firestore with real-time sync (falls back to localStorage)
  useEffect(() => {
    if (!mounted) return;
    
    if (!user) {
      setLayout(DEFAULT_LAYOUT);
      return;
    }

    const storageKey = `dashboard-layout-${user.uid}`;

    if (db) {
      const userDocRef = doc(db, "users", user.uid);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.layout) {
              const mergedLayout = mergeLayoutWithDefaults(data.layout);
              setLayout(mergedLayout);
              // Also cache in localStorage
              localStorage.setItem(storageKey, JSON.stringify(mergedLayout));
            }
          } else {
            // Check localStorage for initial data and migrate to Firestore
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const localLayout = JSON.parse(stored) as LayoutConfig;
                const mergedLayout = mergeLayoutWithDefaults(localLayout);
                setLayout(mergedLayout);
                // Migrate localStorage data to Firestore
                setDoc(userDocRef, { layout: mergedLayout }, { merge: true });
              } catch {
                setLayout(DEFAULT_LAYOUT);
              }
            }
          }
        },
        (error) => {
          console.error("Layout sync error:", error);
          // Fallback to localStorage on error
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              const localLayout = JSON.parse(stored) as LayoutConfig;
              setLayout(mergeLayoutWithDefaults(localLayout));
            } catch {
              setLayout(DEFAULT_LAYOUT);
            }
          }
        }
      );

      return () => unsubscribe();
    } else {
      // Fallback to localStorage if Firestore is not available
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const localLayout = JSON.parse(stored) as LayoutConfig;
          setLayout(mergeLayoutWithDefaults(localLayout));
        } catch {
          setLayout(DEFAULT_LAYOUT);
        }
      }
    }
  }, [user, mounted]);

  // Save layout to Firestore and localStorage
  const saveLayout = useCallback(
    async (newLayout: LayoutConfig) => {
      if (!user) return;

      const storageKey = `dashboard-layout-${user.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
      setLayout(newLayout);

      // Save to Firestore for cross-device sync
      if (db) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { layout: newLayout }, { merge: true });
        } catch (error) {
          console.error("Failed to save layout to Firestore:", error);
        }
      }
    },
    [user]
  );

  const enterEditMode = useCallback(() => {
    setPendingLayout({ ...layout });
    setIsEditMode(true);
  }, [layout]);

  const exitEditMode = useCallback(
    (save: boolean) => {
      if (save && pendingLayout) {
        saveLayout(pendingLayout);
      }
      setPendingLayout(null);
      setIsEditMode(false);
    },
    [pendingLayout, saveLayout]
  );

  const updateWidgetSize = useCallback(
    (type: "previewWidgets" | "toolCards", id: string, size: WidgetSize) => {
      if (!isEditMode || !pendingLayout) return;

      const widgets = pendingLayout[type];
      const updatedWidgets = widgets.map((w) => (w.id === id ? { ...w, size } : w));
      setPendingLayout({ ...pendingLayout, [type]: updatedWidgets });
    },
    [isEditMode, pendingLayout]
  );

  const updateWidgetVisibility = useCallback(
    (type: "previewWidgets" | "toolCards", id: string, visible: boolean) => {
      if (!isEditMode || !pendingLayout) return;

      const widgets = pendingLayout[type];
      const updatedWidgets = widgets.map((w) => (w.id === id ? { ...w, visible } : w));
      setPendingLayout({ ...pendingLayout, [type]: updatedWidgets });
    },
    [isEditMode, pendingLayout]
  );

  const updateWidgetName = useCallback(
    (type: "previewWidgets" | "toolCards", id: string, customName: string) => {
      if (!isEditMode || !pendingLayout) return;

      const widgets = pendingLayout[type];
      const updatedWidgets = widgets.map((w) =>
        w.id === id ? { ...w, customName: customName.trim() || undefined } : w
      );
      setPendingLayout({ ...pendingLayout, [type]: updatedWidgets });
    },
    [isEditMode, pendingLayout]
  );

  const reorderWidgets = useCallback(
    (type: "previewWidgets" | "toolCards", fromIndex: number, toIndex: number) => {
      if (!isEditMode || !pendingLayout) return;

      const widgets = [...pendingLayout[type]];
      const [removed] = widgets.splice(fromIndex, 1);
      widgets.splice(toIndex, 0, removed);

      // Update order values
      const reorderedWidgets = widgets.map((w, i) => ({ ...w, order: i }));
      setPendingLayout({ ...pendingLayout, [type]: reorderedWidgets });
    },
    [isEditMode, pendingLayout]
  );

  const resetLayout = useCallback(() => {
    if (isEditMode) {
      setPendingLayout(DEFAULT_LAYOUT);
    } else {
      saveLayout(DEFAULT_LAYOUT);
    }
  }, [isEditMode, saveLayout]);

  const getWidgetConfig = useCallback(
    (type: "previewWidgets" | "toolCards", id: string): WidgetConfig | undefined => {
      const currentLayout = isEditMode && pendingLayout ? pendingLayout : layout;
      return currentLayout[type].find((w) => w.id === id);
    },
    [isEditMode, pendingLayout, layout]
  );

  const toggleWidgetCollapse = useCallback(
    (type: "previewWidgets" | "toolCards", id: string) => {
      // Toggle widget collapse state outside of edit mode
      const currentLayout = isEditMode && pendingLayout ? pendingLayout : layout;
      const widget = currentLayout[type].find((w) => w.id === id);
      if (!widget) return;

      const newSize: WidgetSize = widget.size === "collapsed" ? "default" : "collapsed";
      const updatedWidgets = currentLayout[type].map((w) =>
        w.id === id ? { ...w, size: newSize } : w
      );
      const newLayout = { ...currentLayout, [type]: updatedWidgets };

      if (isEditMode) {
        setPendingLayout(newLayout);
      } else {
        saveLayout(newLayout);
      }
    },
    [isEditMode, pendingLayout, layout, saveLayout]
  );

  const setSearchSourceMode = useCallback(
    (mode: "alwaysShowing" | "onlySelection") => {
      const currentLayout = isEditMode && pendingLayout ? pendingLayout : layout;
      const newLayout = { ...currentLayout, searchSourceMode: mode };

      if (isEditMode) {
        setPendingLayout(newLayout);
      } else {
        saveLayout(newLayout);
      }
    },
    [isEditMode, pendingLayout, layout, saveLayout]
  );

  // Get the active layout (pending if in edit mode, otherwise saved)
  const activeLayout = isEditMode && pendingLayout ? pendingLayout : layout;

  return (
    <LayoutContext.Provider
      value={{
        layout: activeLayout,
        isEditMode,
        pendingLayout,
        enterEditMode,
        exitEditMode,
        updateWidgetSize,
        updateWidgetVisibility,
        updateWidgetName,
        reorderWidgets,
        resetLayout,
        getWidgetConfig,
        toggleWidgetCollapse,
        setSearchSourceMode,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
