"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ToolCard } from "@/components/ToolCard";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { Actions, ACTIONS_STORAGE_KEY, type ActionItem } from "@/components/Actions";
import { tools, categories } from "@/lib/tools";

// Collapsed Calendar Widget
function CalendarWidget() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        width: "160px",
        flexShrink: 0,
      }}
    >
      {/* Header button - always visible */}
      <div
        className="glass"
        style={{
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "10px 14px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>
              Calendar
            </span>
          </div>
          <ChevronDown
            style={{
              width: "14px",
              height: "14px",
              color: "var(--foreground-muted)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>
      </div>

      {/* Dropdown content - absolutely positioned */}
      {isExpanded && (
        <div
          className="glass"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "200px",
            borderRadius: "10px",
            padding: "12px 14px",
            zIndex: 50,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Link
            href="/tools/calendar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "10px 16px",
              borderRadius: "8px",
              backgroundColor: "var(--accent)",
              color: "var(--background)",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
              marginBottom: "10px",
            }}
          >
            Open Calendar
            <ExternalLink style={{ width: "14px", height: "14px" }} />
          </Link>
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              backgroundColor: "transparent",
              color: "var(--foreground-muted)",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Google Calendar
            <ExternalLink style={{ width: "14px", height: "14px" }} />
          </a>
        </div>
      )}
    </div>
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

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) {
    return <div style={{ height: "100px" }} />;
  }

  const formattedDate = dateTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
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
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 36px)",
            fontWeight: 700,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {formattedDate}
        </h1>
        <CalendarWidget />
      </div>

      {/* Time Row with Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <p
          style={{
            fontSize: "clamp(18px, 2.5vw, 28px)",
            fontWeight: 300,
            color: "var(--accent)",
            whiteSpace: "nowrap",
          }}
        >
          {formattedTime}
        </p>
        <Actions
          isGoogleConnected={isGoogleConnected}
          onConnectGoogle={onConnectGoogle}
          defaultCollapsed={true}
          onExpandChange={setIsActionsExpanded}
        />
      </div>

      {/* Actions Row - visible items (only when tool is collapsed) */}
      <ActionsRow isToolExpanded={isActionsExpanded} />
    </div>
  );
}


export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);

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

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;
      return matchesCategory;
    });
  }, [selectedCategory]);

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
              {/* Category Pills */}
              <div
                style={{
                  marginBottom: "28px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory !== category.id ? "glass" : ""}
                    style={{
                      whiteSpace: "nowrap",
                      borderRadius: "9999px",
                      padding: "8px 18px",
                      fontSize: "13px",
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      backgroundColor:
                        selectedCategory === category.id
                          ? "var(--accent)"
                          : "transparent",
                      color:
                        selectedCategory === category.id
                          ? "var(--background)"
                          : "var(--foreground-muted)",
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Tools Grid */}
              {filteredTools.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {filteredTools.map((tool, index) => (
                    <ToolCard key={tool.id} tool={tool} index={index} />
                  ))}
                </div>
              ) : (
                <div style={{ padding: "64px 0", textAlign: "center" }}>
                  <p style={{ color: "var(--foreground-muted)" }}>
                    No tools found in this category.
                  </p>
                </div>
              )}
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
