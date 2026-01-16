"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { FilesPreview } from "@/components/FilesPreview";
import { EmailsPreview } from "@/components/EmailsPreview";
import { NotesPreview } from "@/components/NotesPreview";
import { StocksPreview } from "@/components/StocksPreview";
import { NewsPreview } from "@/components/NewsPreview";
import { LayoutEditor } from "@/components/LayoutEditor";
import { DraggableWidget, useDragState } from "@/components/DraggableWidget";
import { RemindersBanner } from "@/components/RemindersBanner";
import { useLayout, WidgetConfig } from "@/contexts/LayoutContext";
import { tools } from "@/lib/tools";

// Mobile Date/Time Banner Component
function MobileDateTimeBanner() {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = dateTime?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const formattedTime = dateTime?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!dateTime) return null;

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
        {formattedDate}
      </span>
      <span
        style={{
          fontSize: "15px",
          fontWeight: 400,
          color: "var(--accent)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
}

// Widget title mapping
const WIDGET_TITLES: Record<string, string> = {
  files: "Files",
  emails: "Emails",
  notes: "Notes",
  stocks: "Market",
  "contact-finder": "Contact Finder",
  "company-politics": "Company Info",
  "visual-rosters": "Visual Rosters",
  news: "News",
  spotify: "Spotify",
  trending: "Trending",
  contacts: "Contacts",
};

// Unified widgets grid - combines preview widgets and tool cards into a single grid
function UnifiedWidgetsGrid({
  isGoogleConnected,
  onConnectGoogle,
  isMobile,
}: {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
  isMobile: boolean;
}) {
  const { layout, isEditMode, reorderWidgets, getWidgetConfig } = useLayout();

  // Separate drag states for each section to avoid dual highlighting
  const previewDragState = useDragState();
  const toolDragState = useDragState();

  // Data widgets (Files, Emails, Notes, Market) - removed Contacts
  const previewWidgets = [...layout.previewWidgets]
    .filter((w) => w.id !== "contacts") // Contacts is now a tool widget
    .sort((a, b) => a.order - b.order)
    .map((w) => ({ ...w, widgetType: "previewWidgets" as const }));

  const toolCards = [...layout.toolCards]
    .sort((a, b) => a.order - b.order)
    .map((w) => ({ ...w, widgetType: "toolCards" as const }));

  const handlePreviewDrop = useCallback(() => {
    if (previewDragState.dragIndex !== null && previewDragState.dragOverIndex !== null && previewDragState.dragIndex !== previewDragState.dragOverIndex) {
      reorderWidgets("previewWidgets", previewDragState.dragIndex, previewDragState.dragOverIndex);
    }
    previewDragState.handleDragEnd();
  }, [previewDragState, reorderWidgets]);

  const handleToolDrop = useCallback(() => {
    if (toolDragState.dragIndex !== null && toolDragState.dragOverIndex !== null && toolDragState.dragIndex !== toolDragState.dragOverIndex) {
      reorderWidgets("toolCards", toolDragState.dragIndex, toolDragState.dragOverIndex);
    }
    toolDragState.handleDragEnd();
  }, [toolDragState, reorderWidgets]);

  const renderPreviewWidget = (widgetConfig: WidgetConfig & { widgetType: "previewWidgets" }, index: number) => {
    const { id } = widgetConfig;

    const widgetContent = (() => {
      switch (id) {
        case "files":
          return <FilesPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={onConnectGoogle} />;
        case "emails":
          return <EmailsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={onConnectGoogle} />;
        case "notes":
          return <NotesPreview />;
        case "stocks":
          return <StocksPreview />;
        case "news":
          return <NewsPreview />;
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

  const renderToolCard = (widgetConfig: WidgetConfig & { widgetType: "toolCards" }, index: number) => {
    const { id } = widgetConfig;
    const tool = tools.find((t) => t.id === id);
    if (!tool) return null;

    return (
      <DraggableWidget
        key={`tool-${id}`}
        id={id}
        type="toolCards"
        title={WIDGET_TITLES[id] || tool.name}
        index={index}
        onDragStart={toolDragState.handleDragStart}
        onDragOver={toolDragState.handleDragOver}
        onDragEnd={handleToolDrop}
        isDragging={toolDragState.isDragging}
        dragOverIndex={toolDragState.dragOverIndex}
      >
        <ToolCard tool={tool} index={index} compact />
      </DraggableWidget>
    );
  };

  // Separate section rendering for edit mode
  if (isEditMode) {
    return (
      <>
        {/* Tool Widgets Section - First */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            Tool Widgets
          </h3>
          <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
            Interactive tools and features
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))",
              gap: isMobile ? "8px" : "10px",
              position: "relative",
              zIndex: 50,
            }}
          >
            {toolCards.map((widget, index) => renderToolCard(widget, index))}
          </div>
        </div>

        {/* Data Widgets Section - Second */}
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            Data Widgets
          </h3>
          <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
            Your connected services (Files, Emails, Notes, Market)
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "12px",
              position: "relative",
              zIndex: 50,
            }}
          >
            {previewWidgets.map((widget, index) => renderPreviewWidget(widget, index))}
          </div>
        </div>
      </>
    );
  }

  // Normal mode: Tool widgets first, then data widgets
  return (
    <>
      {/* Tool Widgets - First (centered with even distribution) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: isMobile ? "8px" : "10px",
          marginBottom: "24px",
        }}
      >
        {toolCards.map((widget, index) => (
          <div key={`tool-wrapper-${widget.id}`} style={{ width: isMobile ? "calc(50% - 4px)" : "140px" }}>
            {renderToolCard(widget, index)}
          </div>
        ))}
      </div>

      {/* Data Widgets - Second (uniform grid) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: "16px",
          gridAutoRows: "364px",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {previewWidgets.map((widget, index) => renderPreviewWidget(widget, index))}
      </div>
    </>
  );
}

export default function Home() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isEditMode } = useLayout();

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

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "24px 24px 100px 24px",
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
              <MultiSourceSearch onResultsChange={(results) => setHasSearchResults(results.length > 0)} />
            </motion.section>
          )}

          {/* Unified Widgets Grid - Hidden when search results are shown (unless in edit mode) */}
          {(isEditMode || !hasSearchResults) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ width: "100%" }}
            >
              <UnifiedWidgetsGrid
                isGoogleConnected={isGoogleConnected}
                onConnectGoogle={handleConnectGoogle}
                isMobile={isMobile}
              />
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
