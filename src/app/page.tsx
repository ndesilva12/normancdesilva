"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { FilesPreview } from "@/components/FilesPreview";
import { EmailsPreview } from "@/components/EmailsPreview";
import { NotesPreview } from "@/components/NotesPreview";
import { ContactsPreview } from "@/components/ContactsPreview";
import { StocksPreview } from "@/components/StocksPreview";
import { LayoutEditor } from "@/components/LayoutEditor";
import { DraggableWidget, useDragState } from "@/components/DraggableWidget";
import { useLayout, WidgetConfig } from "@/contexts/LayoutContext";
import { tools } from "@/lib/tools";

// Widget title mapping
const WIDGET_TITLES: Record<string, string> = {
  files: "Files",
  emails: "Emails",
  notes: "Notes",
  contacts: "Contacts",
  stocks: "Market",
  "contact-finder": "Contact Finder",
  "company-politics": "Company Info",
  "visual-rosters": "Visual Rosters",
  news: "News",
  spotify: "Spotify",
  trending: "Trending",
};

// Unified widgets grid - combines preview widgets and tool cards into a single grid
function UnifiedWidgetsGrid({
  isGoogleConnected,
  isMicrosoftConnected,
  onConnectGoogle,
  onConnectMicrosoft,
  isMobile,
}: {
  isGoogleConnected: boolean;
  isMicrosoftConnected: boolean;
  onConnectGoogle: () => void;
  onConnectMicrosoft: () => void;
  isMobile: boolean;
}) {
  const { layout, isEditMode, reorderWidgets, getWidgetConfig } = useLayout();
  const { isDragging, dragIndex, dragOverIndex, handleDragStart, handleDragOver, handleDragEnd } = useDragState();

  // Combine preview widgets and tool cards into a unified list
  const previewWidgets = [...layout.previewWidgets]
    .sort((a, b) => a.order - b.order)
    .map((w) => ({ ...w, widgetType: "previewWidgets" as const }));

  const toolCards = [...layout.toolCards]
    .sort((a, b) => a.order - b.order)
    .map((w) => ({ ...w, widgetType: "toolCards" as const }));

  // In edit mode, show sections separately for clarity
  // In normal mode, combine all widgets
  const allWidgets = isEditMode
    ? [...previewWidgets, ...toolCards]
    : [...previewWidgets, ...toolCards];

  const handleDrop = useCallback((widgetType: "previewWidgets" | "toolCards") => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      reorderWidgets(widgetType, dragIndex, dragOverIndex);
    }
    handleDragEnd();
  }, [dragIndex, dragOverIndex, reorderWidgets, handleDragEnd]);

  const renderPreviewWidget = (widgetConfig: WidgetConfig & { widgetType: "previewWidgets" }, index: number) => {
    const { id } = widgetConfig;
    const config = getWidgetConfig("previewWidgets", id);
    const size = config?.size || "default";

    const widgetContent = (() => {
      switch (id) {
        case "files":
          return <FilesPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={onConnectGoogle} />;
        case "emails":
          return <EmailsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={onConnectGoogle} />;
        case "notes":
          return <NotesPreview isMicrosoftConnected={isMicrosoftConnected} onConnectMicrosoft={onConnectMicrosoft} />;
        case "contacts":
          return <ContactsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={onConnectGoogle} />;
        case "stocks":
          return <StocksPreview />;
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
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={() => handleDrop("previewWidgets")}
        isDragging={isDragging}
        dragOverIndex={dragOverIndex}
      >
        <div
          style={{
            gridColumn: !isMobile && size === "expanded" ? "span 2" : "span 1",
          }}
        >
          {widgetContent}
        </div>
      </DraggableWidget>
    );
  };

  const renderToolCard = (widgetConfig: WidgetConfig & { widgetType: "toolCards" }, index: number) => {
    const { id } = widgetConfig;
    const tool = tools.find((t) => t.id === id);
    if (!tool) return null;

    const config = getWidgetConfig("toolCards", id);
    const size = config?.size || "default";

    return (
      <DraggableWidget
        key={`tool-${id}`}
        id={id}
        type="toolCards"
        title={WIDGET_TITLES[id] || tool.name}
        index={index}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={() => handleDrop("toolCards")}
        isDragging={isDragging}
        dragOverIndex={dragOverIndex}
      >
        <div
          style={{
            gridColumn: !isMobile && size === "expanded" ? "span 2" : "span 1",
          }}
        >
          <ToolCard tool={tool} index={index} compact={isMobile} />
        </div>
      </DraggableWidget>
    );
  };

  // Separate section rendering for edit mode
  if (isEditMode) {
    return (
      <>
        {/* Preview Widgets Section */}
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            Data Widgets
          </h3>
          <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
            Your connected services (Files, Emails, Notes, Contacts)
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

        {/* Tool Cards Section */}
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            Tool Widgets
          </h3>
          <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
            Interactive tools and features
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(300px, 1fr))",
              gap: isMobile ? "10px" : "12px",
              position: "relative",
              zIndex: 50,
            }}
          >
            {toolCards.map((widget, index) => renderToolCard(widget, index))}
          </div>
        </div>
      </>
    );
  }

  // Normal mode: unified display
  return (
    <>
      {/* Data Widgets (Files, Emails, etc.) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {previewWidgets.map((widget, index) => renderPreviewWidget(widget, index))}
      </div>

      {/* Tool Widgets */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(300px, 1fr))",
          gap: isMobile ? "10px" : "16px",
        }}
      >
        {toolCards.map((widget, index) => renderToolCard(widget, index))}
      </div>
    </>
  );
}

export default function Home() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);
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

  // Check Microsoft auth status
  useEffect(() => {
    async function checkMicrosoftAuth() {
      try {
        const response = await fetch("/api/auth/microsoft/status");
        const data = await response.json();
        setIsMicrosoftConnected(data.connected);
      } catch {
        setIsMicrosoftConnected(false);
      }
    }
    checkMicrosoftAuth();

    // Check for Microsoft auth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("microsoft_connected")) {
      setIsMicrosoftConnected(true);
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

  const handleConnectMicrosoft = async () => {
    try {
      const response = await fetch("/api/auth/microsoft");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to connect Microsoft:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header isGoogleConnected={isGoogleConnected} onConnectGoogle={handleConnectGoogle} />
      <LayoutEditor />

      <main style={{ flex: 1, width: "100%", paddingTop: isEditMode ? "0" : undefined }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "24px 24px 100px 24px",
          }}
        >
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
                isMicrosoftConnected={isMicrosoftConnected}
                onConnectGoogle={handleConnectGoogle}
                onConnectMicrosoft={handleConnectMicrosoft}
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
