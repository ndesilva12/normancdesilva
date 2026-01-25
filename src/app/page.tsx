"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Mail,
  StickyNote,
  TrendingUp,
  Newspaper,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { Header } from "@/components/Header";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { FilesPreview } from "@/components/FilesPreview";
import { EmailsPreview } from "@/components/EmailsPreview";
import { ContactsPreview } from "@/components/ContactsPreview";
import { NotesPreview } from "@/components/NotesPreview";
import { StocksPreview } from "@/components/StocksPreview";
import { NewsPreview } from "@/components/NewsPreview";
import { RaindropPreview } from "@/components/RaindropPreview";
import { TrendingPreview } from "@/components/TrendingPreview";
import { LayoutEditor } from "@/components/LayoutEditor";
import { DraggableWidget, useDragState } from "@/components/DraggableWidget";
import { RemindersBanner } from "@/components/RemindersBanner";
import { useLayout, WidgetConfig } from "@/contexts/LayoutContext";
import { useSettings } from "@/contexts/SettingsContext";

// Widget icon mapping
const WIDGET_ICONS: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  files: FolderOpen,
  emails: Mail,
  notes: StickyNote,
  stocks: BarChart3,
  news: Newspaper,
  trending: TrendingUp,
  raindrop: BookOpen,
};

// Widget link mapping
const WIDGET_LINKS: Record<string, string> = {
  files: "/tools/files",
  emails: "/tools/emails",
  notes: "/tools/notes",
  stocks: "/tools/stocks",
  news: "/tools/news",
  trending: "/tools/trending",
  raindrop: "/tools/raindrop",
};

// Mobile Date/Time Banner Component
function MobileDateTimeBanner() {
  const { formatTime, formatDate } = useSettings();
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) return null;

  const formattedDateStr = formatDate(dateTime, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const formattedTimeStr = formatTime(dateTime);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "16px 0",
        marginBottom: "8px",
      }}
    >
      <span
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--foreground)",
        }}
      >
        {formattedDateStr}
      </span>
      <span
        style={{
          fontSize: "15px",
          fontWeight: 400,
          color: "var(--accent)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formattedTimeStr}
      </span>
    </div>
  );
}

// Widget title mapping
const WIDGET_TITLES: Record<string, string> = {
  files: "Files",
  emails: "Emails",
  contacts: "Contacts",
  notes: "Notes",
  stocks: "Market",
  news: "News",
  trending: "Trending",
  raindrop: "Reading List",
};

// Collapsed Widget Bar Component (for "collapse all" mode - links to pages)
function CollapsedWidgetBar({ widgets }: { widgets: string[] }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: isMobile ? "8px" : "12px",
        flexWrap: "wrap",
      }}
    >
      {widgets.map((widgetId) => {
        const Icon = WIDGET_ICONS[widgetId];
        const link = WIDGET_LINKS[widgetId];
        const title = WIDGET_TITLES[widgetId];

        if (!Icon || !link) return null;

        return (
          <Link
            key={widgetId}
            href={link}
            title={title}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? "4px" : "6px",
              padding: isMobile ? "12px" : "16px 20px",
              minWidth: isMobile ? "60px" : "80px",
              borderRadius: isMobile ? "10px" : "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--glass-border)",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            <Icon style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "var(--accent)" }} />
            <span style={{ fontSize: isMobile ? "10px" : "12px", color: "var(--foreground-muted)", whiteSpace: "nowrap" }}>
              {title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// Individually Collapsed Widget Bar (for individual collapse - buttons that expand)
function IndividuallyCollapsedWidgetBar({
  widgets,
  isMobile
}: {
  widgets: { id: string; customName?: string }[];
  isMobile: boolean;
}) {
  const { toggleWidgetCollapse } = useLayout();

  if (widgets.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: isMobile ? "8px" : "12px",
        flexWrap: "wrap",
        marginBottom: "16px",
      }}
    >
      {widgets.map((widget) => {
        const Icon = WIDGET_ICONS[widget.id];
        const title = widget.customName || WIDGET_TITLES[widget.id] || widget.id;

        if (!Icon) return null;

        return (
          <button
            key={widget.id}
            onClick={() => toggleWidgetCollapse("previewWidgets", widget.id)}
            title={`Expand ${title}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? "4px" : "6px",
              padding: isMobile ? "12px" : "16px 20px",
              minWidth: isMobile ? "60px" : "80px",
              borderRadius: isMobile ? "10px" : "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--glass-border)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Icon style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "var(--accent)" }} />
            <span style={{ fontSize: isMobile ? "10px" : "12px", color: "var(--foreground-muted)", whiteSpace: "nowrap" }}>
              {title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Data widgets grid - only preview widgets (tools are now in sources)
function DataWidgetsGrid({
  isGoogleConnected,
  onConnectGoogle,
  isMobile,
}: {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
  isMobile: boolean;
}) {
  const { layout, isEditMode, reorderWidgets } = useLayout();

  const previewDragState = useDragState();

  // Data widgets only - all visible widgets (for edit mode we show all)
  const allPreviewWidgets = [...layout.previewWidgets]
    .filter((w) => w.id !== "contacts") // Contacts is now a source
    .filter((w) => isEditMode || w.visible)
    .sort((a, b) => a.order - b.order)
    .map((w) => ({ ...w, widgetType: "previewWidgets" as const }));

  // Separate collapsed and non-collapsed widgets (in normal mode)
  const collapsedWidgets = isEditMode ? [] : allPreviewWidgets.filter((w) => w.size === "collapsed");
  const previewWidgets = isEditMode ? allPreviewWidgets : allPreviewWidgets.filter((w) => w.size !== "collapsed");

  const handlePreviewDrop = useCallback(() => {
    if (previewDragState.dragIndex !== null && previewDragState.dragOverIndex !== null && previewDragState.dragIndex !== previewDragState.dragOverIndex) {
      reorderWidgets("previewWidgets", previewDragState.dragIndex, previewDragState.dragOverIndex);
    }
    previewDragState.handleDragEnd();
  }, [previewDragState, reorderWidgets]);

  const renderPreviewWidget = (widgetConfig: WidgetConfig & { widgetType: "previewWidgets" }, index: number) => {
    const { id } = widgetConfig;

    const widgetContent = (() => {
      switch (id) {
        case "files":
          return <FilesPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={onConnectGoogle} />;
        case "emails":
          return <EmailsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={onConnectGoogle} />;
        case "contacts":
          return <ContactsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={onConnectGoogle} />;
        case "notes":
          return <NotesPreview />;
        case "stocks":
          return <StocksPreview />;
        case "news":
          return <NewsPreview />;
        case "raindrop":
          return <RaindropPreview />;
        case "trending":
          return <TrendingPreview />;
        default:
          return null;
      }
    })();

    return (
      <DraggableWidget
        key={`preview-${id}`}
        id={id}
        type="previewWidgets"
        title={WIDGET_TITLES[id] || id}
        index={index}
        onDragStart={previewDragState.handleDragStart}
        onDragOver={previewDragState.handleDragOver}
        onDragEnd={handlePreviewDrop}
        isDragging={previewDragState.isDragging}
        dragOverIndex={previewDragState.dragOverIndex}
      >
        {widgetContent}
      </DraggableWidget>
    );
  };

  // Edit mode layout
  if (isEditMode) {
    return (
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
          Data Widgets
        </h3>
        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
          Your connected services and data feeds
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: "12px",
            position: "relative",
            zIndex: 50,
          }}
        >
          {previewWidgets.map((widget, index) => renderPreviewWidget(widget, index))}
        </div>
      </div>
    );
  }

  // Normal mode
  return (
    <div style={{ width: "100%" }}>
      {/* Collapsed widgets bar - shows individually collapsed widgets */}
      <IndividuallyCollapsedWidgetBar
        widgets={collapsedWidgets.map((w) => ({ id: w.id, customName: w.customName }))}
        isMobile={isMobile}
      />

      {/* Main grid for non-collapsed widgets */}
      {previewWidgets.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            gridAutoRows: "364px",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          {previewWidgets.map((widget, index) => renderPreviewWidget(widget, index))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [isToolActive, setIsToolActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [widgetsCollapsed, setWidgetsCollapsed] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("widgets-collapsed");
      return saved === "true";
    }
    return false;
  });
  const { isEditMode, layout } = useLayout();

  // Persist collapse state to localStorage
  useEffect(() => {
    localStorage.setItem("widgets-collapsed", String(widgetsCollapsed));
  }, [widgetsCollapsed]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check Google auth status
  useEffect(() => {
    async function checkGoogleAuth() {
      try {
        const response = await fetch("/api/auth/google/status");
        const data = await response.json();
        setIsGoogleConnected(data.connected || data.authenticated);
      } catch {
        setIsGoogleConnected(false);
      }
    }
    checkGoogleAuth();

    // Check for auth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success")) {
      setIsGoogleConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch("/api/auth/google");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to connect Google:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header isGoogleConnected={isGoogleConnected} onConnectGoogle={handleConnectGoogle} />
      <LayoutEditor />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px", overflow: "hidden" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: isMobile ? "16px 12px 80px 12px" : "24px 24px 100px 24px",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* Mobile Date/Time Banner - Only shown on mobile */}
          {isMobile && !isEditMode && <MobileDateTimeBanner />}

          {/* Reminders Banner - Hidden in edit mode */}
          {!isEditMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <RemindersBanner />
            </motion.div>
          )}

          {/* Multi-Source Search - Hidden in edit mode */}
          {!isEditMode && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ marginBottom: "32px" }}
            >
              <MultiSourceSearch
                onResultsChange={(hasResults) => setHasSearchResults(hasResults)}
                onToolActive={(active) => setIsToolActive(active)}
                widgetsCollapsed={widgetsCollapsed}
                onToggleCollapse={() => setWidgetsCollapsed(!widgetsCollapsed)}
              />
            </motion.section>
          )}

          {/* Data Widgets Grid - Hidden when tool is active or has search results (unless in edit mode) */}
          {(isEditMode || (!hasSearchResults && !isToolActive)) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ width: "100%" }}
            >
              {/* Collapsed or Full Widget View */}
              {widgetsCollapsed && !isEditMode ? (
                <CollapsedWidgetBar
                  widgets={layout.previewWidgets
                    .filter((w) => w.visible && w.id !== "contacts")
                    .sort((a, b) => a.order - b.order)
                    .map((w) => w.id)}
                />
              ) : (
                <DataWidgetsGrid
                  isGoogleConnected={isGoogleConnected}
                  onConnectGoogle={handleConnectGoogle}
                  isMobile={isMobile}
                />
              )}
            </motion.section>
          )}

          {/* Footer - Hidden in edit mode */}
          {!isEditMode && (
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                marginTop: "48px",
                borderTop: "1px solid var(--glass-border)",
                padding: "24px 0",
                textAlign: "center",
                fontSize: "14px",
                color: "var(--foreground-muted)",
              }}
            >
              <p>
                Built by{" "}
                <span style={{ fontWeight: 500, color: "var(--foreground)" }}>
                  Norman C. de Silva
                </span>
              </p>
            </motion.footer>
          )}
        </div>
      </main>
    </div>
  );
}
