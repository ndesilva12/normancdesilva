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

// Layout configuration for a single viewport
export interface LayoutConfig {
  previewWidgets: WidgetConfig[];
  toolCards: WidgetConfig[];
  version: number;
  searchSourceMode: "alwaysShowing" | "onlySelection";
}

// Combined layout configuration for both viewports
export interface DualLayoutConfig {
  desktop: LayoutConfig;
  mobile: LayoutConfig;
  version: number;
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

const DEFAULT_DUAL_LAYOUT: DualLayoutConfig = {
  desktop: DEFAULT_LAYOUT,
  mobile: DEFAULT_LAYOUT,
  version: 3,
};

interface LayoutContextType {
  layout: LayoutConfig;
  isEditMode: boolean;
  pendingLayout: LayoutConfig | null;
  isMobile: boolean;
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
  const [dualLayout, setDualLayout] = useState<DualLayoutConfig>(DEFAULT_DUAL_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingLayout, setPendingLayout] = useState<LayoutConfig | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mark as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    if (!mounted) return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mounted]);

  // Get the current layout based on viewport
  const layout = isMobile ? dualLayout.mobile : dualLayout.desktop;

  // Helper function to merge a single layout with defaults
  const mergeLayoutWithDefaults = (parsed: LayoutConfig): LayoutConfig => {
    // Merge with defaults to handle new widgets
    // Force all widgets to "default" size (collapse feature removed)
    const mergedPreviewWidgets = DEFAULT_PREVIEW_WIDGETS.map((defaultWidget) => {
      const savedWidget = parsed.previewWidgets?.find((w) => w.id === defaultWidget.id);
      return savedWidget
        ? { ...savedWidget, size: "default" as WidgetSize }
        : defaultWidget;
    });
    const mergedToolCards = DEFAULT_TOOL_CARDS.map((defaultWidget) => {
      const savedWidget = parsed.toolCards?.find((w) => w.id === defaultWidget.id);
      return savedWidget
        ? { ...savedWidget, size: "default" as WidgetSize }
        : defaultWidget;
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

  // Helper function to merge dual layout with defaults
  const mergeDualLayoutWithDefaults = (parsed: any): DualLayoutConfig => {
    // Check if it's a new dual layout format or old single layout format
    if (parsed.desktop && parsed.mobile) {
      // New dual layout format
      return {
        desktop: mergeLayoutWithDefaults(parsed.desktop),
        mobile: mergeLayoutWithDefaults(parsed.mobile),
        version: 3,
      };
    } else if (parsed.previewWidgets) {
      // Old single layout format - use same layout for both
      const singleLayout = mergeLayoutWithDefaults(parsed);
      return {
        desktop: singleLayout,
        mobile: singleLayout,
        version: 3,
      };
    }
    return DEFAULT_DUAL_LAYOUT;
  };

  // Load layout from Firestore with real-time sync (falls back to localStorage)
  useEffect(() => {
    if (!mounted) return;

    if (!user) {
      setDualLayout(DEFAULT_DUAL_LAYOUT);
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
            if (data.dualLayout) {
              // New dual layout format
              const mergedDualLayout = mergeDualLayoutWithDefaults(data.dualLayout);
              setDualLayout(mergedDualLayout);
              localStorage.setItem(storageKey, JSON.stringify(mergedDualLayout));
            } else if (data.layout) {
              // Old single layout format - migrate to dual
              const mergedDualLayout = mergeDualLayoutWithDefaults(data.layout);
              setDualLayout(mergedDualLayout);
              localStorage.setItem(storageKey, JSON.stringify(mergedDualLayout));
              // Save migrated dual layout to Firestore
              setDoc(userDocRef, { dualLayout: mergedDualLayout }, { merge: true });
            }
          } else {
            // Check localStorage for initial data and migrate to Firestore
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const localLayout = JSON.parse(stored);
                const mergedDualLayout = mergeDualLayoutWithDefaults(localLayout);
                setDualLayout(mergedDualLayout);
                // Migrate localStorage data to Firestore
                setDoc(userDocRef, { dualLayout: mergedDualLayout }, { merge: true });
              } catch {
                setDualLayout(DEFAULT_DUAL_LAYOUT);
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
              const localLayout = JSON.parse(stored);
              setDualLayout(mergeDualLayoutWithDefaults(localLayout));
            } catch {
              setDualLayout(DEFAULT_DUAL_LAYOUT);
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
          const localLayout = JSON.parse(stored);
          setDualLayout(mergeDualLayoutWithDefaults(localLayout));
        } catch {
          setDualLayout(DEFAULT_DUAL_LAYOUT);
        }
      }
    }
  }, [user, mounted]);

  // Save layout to Firestore and localStorage (saves to current viewport's layout)
  const saveLayout = useCallback(
    async (newLayout: LayoutConfig) => {
      if (!user) return;

      const storageKey = `dashboard-layout-${user.uid}`;

      // Update the appropriate layout based on current viewport
      const newDualLayout: DualLayoutConfig = {
        ...dualLayout,
        [isMobile ? "mobile" : "desktop"]: newLayout,
        version: 3,
      };

      localStorage.setItem(storageKey, JSON.stringify(newDualLayout));
      setDualLayout(newDualLayout);

      // Save to Firestore for cross-device sync
      if (db) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, { dualLayout: newDualLayout }, { merge: true });
        } catch (error) {
          console.error("Failed to save layout to Firestore:", error);
        }
      }
    },
    [user, dualLayout, isMobile]
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
    // Reset only the current viewport's layout
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
        isMobile,
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
