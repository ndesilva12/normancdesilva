"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { Actions, ACTIONS_STORAGE_KEY, type ActionItem } from "@/components/Actions";
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

// Actions Row - displays action items as plain text (only when tool is collapsed)
function ActionsRow({ isToolExpanded }: { isToolExpanded: boolean }) {
  const [actions, setActions] = useState<ActionItem[]>([]);

  useEffect(() => {
    // Load from localStorage
    const loadActions = () => {
      const stored = localStorage.getItem(ACTIONS_STORAGE_KEY);
      if (stored) {
        try {
          setActions(JSON.parse(stored));
        } catch {
          setActions([]);
        }
      }
    };

    loadActions();

    // Listen for storage changes (when Actions component updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ACTIONS_STORAGE_KEY) {
        loadActions();
      }
    };

    // Also poll for changes since storage events don't fire in same tab
    const interval = setInterval(loadActions, 1000);

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Only show incomplete actions, and only when tool is collapsed
  const visibleActions = actions.filter((a) => !a.completed);

  if (visibleActions.length === 0 || isToolExpanded) return null;

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
      {visibleActions.map((action, index) => (
        <span
          key={action.id}
          style={{
            fontSize: "13px",
            color: "var(--foreground-muted)",
          }}
        >
          {action.label}
          {action.time && (
            <span style={{ color: "var(--foreground-muted)", opacity: 0.6, marginLeft: "4px" }}>
              ({action.time})
            </span>
          )}
          {index < visibleActions.length - 1 && (
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
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
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
          <Actions
            isGoogleConnected={isGoogleConnected}
            onConnectGoogle={onConnectGoogle}
            defaultCollapsed={true}
            onExpandChange={setIsActionsExpanded}
          />
        </div>
      </div>

      {/* Actions Row - visible items (only when tool is collapsed) */}
      <ActionsRow isToolExpanded={isActionsExpanded} />
    </div>
  );
}


export default function Home() {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check Google Calendar auth status
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/google/status");
        const data = await response.json();
        setIsGoogleConnected(data.authenticated);
      } catch {
        setIsGoogleConnected(false);
      }
    }
    checkAuth();

    // Check for auth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success")) {
      setIsGoogleConnected(true);
      // Clean up URL
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

          {/* Tools Section - Hidden when search results are shown */}
          {!hasSearchResults && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
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
