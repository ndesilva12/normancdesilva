"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { tools } from "@/lib/tools";

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


export default function Home() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

      <main style={{ flex: 1, width: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 24px 100px 24px",
          }}
        >
          {/* Date/Time with Calendar & Actions inline */}
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

          {/* Multi-Source Search */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ marginBottom: "40px" }}
          >
            <MultiSourceSearch onResultsChange={(results) => setHasSearchResults(results.length > 0)} />
          </motion.section>

          {/* Preview Widgets - Hidden when search results are shown */}
          {!hasSearchResults && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ marginBottom: "24px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                  gap: "16px",
                }}
              >
                <FilesPreview
                  isGoogleConnected={isGoogleConnected}
                  onConnectGoogle={handleConnectGoogle}
                />
                <EmailsPreview
                  isGoogleConnected={isGoogleConnected}
                  onConnectGoogle={handleConnectGoogle}
                />
                <NotesPreview
                  isMicrosoftConnected={isMicrosoftConnected}
                  onConnectMicrosoft={handleConnectMicrosoft}
                />
                <ContactsPreview
                  isGoogleConnected={isGoogleConnected}
                  onConnectGoogle={handleConnectGoogle}
                />
              </div>
            </motion.section>
          )}

          {/* Tools Section - Hidden when search results are shown */}
          {!hasSearchResults && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ width: "100%" }}
            >
              {/* Tools Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: isMobile ? "10px" : "16px",
                }}
              >
                {tools.map((tool, index) => (
                  <ToolCard key={tool.id} tool={tool} index={index} compact={isMobile} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Footer */}
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
        </div>
      </main>
    </div>
  );
}
