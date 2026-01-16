"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { Reminders, type ReminderItem } from "@/components/Actions";
import { FilesPreview } from "@/components/FilesPreview";
import { EmailsPreview } from "@/components/EmailsPreview";
import { NotesPreview } from "@/components/NotesPreview";
import { ContactsPreview } from "@/components/ContactsPreview";
import { LayoutEditor } from "@/components/LayoutEditor";
import { DraggableWidget, useDragState } from "@/components/DraggableWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout, WidgetConfig } from "@/contexts/LayoutContext";
import { tools } from "@/lib/tools";

// Widget title mapping
const WIDGET_TITLES: Record<string, string> = {
  files: "Files",
  emails: "Emails",
  notes: "Notes",
  contacts: "Contacts",
  "contact-finder": "Contact Finder",
  "company-politics": "Company Info",
  "visual-rosters": "Visual Rosters",
  news: "News",
  spotify: "Spotify",
};

// Calendar Button - Simple icon button that opens calendar page
function CalendarButton() {
  return (
    <Link
      href="/tools/calendar"
      className="glass"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        flexShrink: 0,
      }}
    >
      <Calendar style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
    </Link>
  );
}

// Reminders Row - displays reminder items as plain text (only when tool is collapsed)
function RemindersRow({ isToolExpanded }: { isToolExpanded: boolean }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  useEffect(() => {
    if (!user) {
      setReminders([]);
      return;
    }

    // Load from localStorage (user-specific)
    const loadReminders = () => {
      const storageKey = `dashboard-reminders-${user.uid}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setReminders(JSON.parse(stored));
        } catch {
          setReminders([]);
        }
      }
    };

    loadReminders();

    // Also poll for changes since storage events don't fire in same tab
    const interval = setInterval(loadReminders, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  // Only show incomplete reminders, and only when tool is collapsed
  const visibleReminders = reminders.filter((r) => !r.completed);

  if (visibleReminders.length === 0 || isToolExpanded || !user) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "6px 16px",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "4px 16px",
      }}
    >
      {visibleReminders.map((reminder, index) => (
        <span
          key={reminder.id}
          style={{
            fontSize: "13px",
            color: "var(--foreground-muted)",
          }}
        >
          {reminder.label}
          {reminder.time && (
            <span style={{ color: "var(--foreground-muted)", opacity: 0.6, marginLeft: "4px" }}>
              ({reminder.time})
            </span>
          )}
          {index < visibleReminders.length - 1 && (
            <span style={{ color: "var(--foreground-muted)", opacity: 0.3, marginLeft: "8px" }}>•</span>
          )}
        </span>
      ))}
    </div>
  );
}

function LiveDateTime({
  isGoogleConnected,
  onConnectGoogle,
}: {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
}) {
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [isRemindersExpanded, setIsRemindersExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!dateTime) {
    return <div style={{ height: "100px" }} />;
  }

  const formattedDate = dateTime.toLocaleDateString("en-US", {
    weekday: isMobile ? "short" : "long",
    year: "numeric",
    month: isMobile ? "short" : "long",
    day: "numeric",
  });

  const formattedTime = dateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%" }}>
      {/* Date Row with Calendar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <h1
          style={{
            fontSize: isMobile ? "18px" : "clamp(22px, 3.5vw, 36px)",
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {formattedDate}
        </h1>
        <CalendarButton />
      </div>

      {/* Time Row with Actions - Actions wrapper has fixed width to prevent shifting */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <p
          style={{
            fontSize: isMobile ? "16px" : "clamp(18px, 2.5vw, 28px)",
            fontWeight: 300,
            color: "var(--accent)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formattedTime}
        </p>
        <div style={{ width: "160px", flexShrink: 0 }}>
          <Reminders
            isGoogleConnected={isGoogleConnected}
            onConnectGoogle={onConnectGoogle}
            defaultCollapsed={true}
            onExpandChange={setIsRemindersExpanded}
          />
        </div>
      </div>

      {/* Reminders Row - visible items (only when tool is collapsed) */}
      <RemindersRow isToolExpanded={isRemindersExpanded} />
    </div>
  );
}

// Preview widgets grid with drag & drop support
function PreviewWidgetsGrid({
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

  const sortedWidgets = [...layout.previewWidgets].sort((a, b) => a.order - b.order);

  const handleDrop = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      reorderWidgets("previewWidgets", dragIndex, dragOverIndex);
    }
    handleDragEnd();
  }, [dragIndex, dragOverIndex, reorderWidgets, handleDragEnd]);

  const renderWidget = (widgetConfig: WidgetConfig, index: number) => {
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
        default:
          return null;
      }
    })();

    return (
      <DraggableWidget
        key={id}
        id={id}
        type="previewWidgets"
        title={WIDGET_TITLES[id] || id}
        index={index}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDrop}
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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: "16px",
        position: "relative",
        zIndex: isEditMode ? 50 : "auto",
      }}
    >
      {sortedWidgets.map((widget, index) => renderWidget(widget, index))}
    </div>
  );
}

// Tool cards grid with drag & drop support
function ToolCardsGrid({ isMobile }: { isMobile: boolean }) {
  const { layout, isEditMode, reorderWidgets, getWidgetConfig } = useLayout();
  const { isDragging, dragIndex, dragOverIndex, handleDragStart, handleDragOver, handleDragEnd } = useDragState();

  const sortedWidgets = [...layout.toolCards].sort((a, b) => a.order - b.order);

  const handleDrop = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      reorderWidgets("toolCards", dragIndex, dragOverIndex);
    }
    handleDragEnd();
  }, [dragIndex, dragOverIndex, reorderWidgets, handleDragEnd]);

  const renderToolCard = (widgetConfig: WidgetConfig, index: number) => {
    const { id } = widgetConfig;
    const tool = tools.find((t) => t.id === id);
    if (!tool) return null;

    const config = getWidgetConfig("toolCards", id);
    const size = config?.size || "default";

    return (
      <DraggableWidget
        key={id}
        id={id}
        type="toolCards"
        title={WIDGET_TITLES[id] || tool.name}
        index={index}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDrop}
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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(300px, 1fr))",
        gap: isMobile ? "10px" : "16px",
        position: "relative",
        zIndex: isEditMode ? 50 : "auto",
      }}
    >
      {sortedWidgets.map((widget, index) => renderToolCard(widget, index))}
    </div>
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
      <Header />
      <LayoutEditor />

      <main style={{ flex: 1, width: "100%", paddingTop: isEditMode ? "0" : undefined }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 24px 100px 24px",
          }}
        >
          {/* Date/Time with Calendar & Actions inline - Hidden in edit mode */}
          {!isEditMode && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                marginBottom: "32px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <LiveDateTime
                isGoogleConnected={isGoogleConnected}
                onConnectGoogle={handleConnectGoogle}
              />
            </motion.section>
          )}

          {/* Multi-Source Search - Hidden in edit mode */}
          {!isEditMode && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ marginBottom: "40px" }}
            >
              <MultiSourceSearch onResultsChange={(results) => setHasSearchResults(results.length > 0)} />
            </motion.section>
          )}

          {/* Edit mode section labels */}
          {isEditMode && (
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Preview Widgets
              </h3>
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                Drag to reorder, adjust size, or toggle visibility
              </p>
            </div>
          )}

          {/* Preview Widgets - Hidden when search results are shown (unless in edit mode) */}
          {(isEditMode || !hasSearchResults) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ marginBottom: "24px" }}
            >
              <PreviewWidgetsGrid
                isGoogleConnected={isGoogleConnected}
                isMicrosoftConnected={isMicrosoftConnected}
                onConnectGoogle={handleConnectGoogle}
                onConnectMicrosoft={handleConnectMicrosoft}
                isMobile={isMobile}
              />
            </motion.section>
          )}

          {/* Edit mode section labels */}
          {isEditMode && (
            <div style={{ marginTop: "32px", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Tool Cards
              </h3>
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                Drag to reorder, adjust size, or toggle visibility
              </p>
            </div>
          )}

          {/* Tools Section - Hidden when search results are shown (unless in edit mode) */}
          {(isEditMode || !hasSearchResults) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ width: "100%" }}
            >
              <ToolCardsGrid isMobile={isMobile} />
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
