"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";

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
}

// Default widget configurations - Data Widgets (connected services)
const DEFAULT_PREVIEW_WIDGETS: WidgetConfig[] = [
  { id: "news", size: "default", visible: true, order: 0 },
  { id: "trending", size: "default", visible: true, order: 1 },
  { id: "emails", size: "default", visible: true, order: 2 },
  { id: "files", size: "default", visible: true, order: 3 },
  { id: "notes", size: "default", visible: true, order: 4 },
  { id: "stocks", size: "default", visible: true, order: 5 },
  { id: "raindrop", size: "default", visible: true, order: 6 },
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
  version: 1,
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
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingLayout, setPendingLayout] = useState<LayoutConfig | null>(null);

  // Load layout from localStorage
  useEffect(() => {
    if (!user) {
      setLayout(DEFAULT_LAYOUT);
      return;
    }

    const storageKey = `dashboard-layout-${user.uid}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LayoutConfig;
        // Merge with defaults to handle new widgets
        const mergedPreviewWidgets = DEFAULT_PREVIEW_WIDGETS.map((defaultWidget) => {
          const savedWidget = parsed.previewWidgets?.find((w) => w.id === defaultWidget.id);
          return savedWidget || defaultWidget;
        });
        const mergedToolCards = DEFAULT_TOOL_CARDS.map((defaultWidget) => {
          const savedWidget = parsed.toolCards?.find((w) => w.id === defaultWidget.id);
          return savedWidget || defaultWidget;
        });
        setLayout({
          previewWidgets: mergedPreviewWidgets,
          toolCards: mergedToolCards,
          version: parsed.version || 1,
        });
      } catch {
        setLayout(DEFAULT_LAYOUT);
      }
    }
  }, [user]);

  // Save layout to localStorage
  const saveLayout = useCallback(
    (newLayout: LayoutConfig) => {
      if (!user) return;
      const storageKey = `dashboard-layout-${user.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
      setLayout(newLayout);
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
