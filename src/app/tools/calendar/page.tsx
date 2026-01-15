"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

type ViewMode = "day" | "week" | "month";

export default function CalendarPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  useEffect(() => {
    checkAuthAndLoadEvents();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [currentDate, viewMode, isAuthenticated]);

  const checkAuthAndLoadEvents = async () => {
    try {
      const authResponse = await fetch("/api/auth/google/status");
      const authData = await authResponse.json();
      setIsAuthenticated(authData.authenticated);

      if (authData.authenticated) {
        await loadEvents();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "week") {
      // Start from Sunday of current week
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of current month
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const loadEvents = async () => {
    try {
      const { start, end } = getDateRange();

      const response = await fetch(
        `/api/calendar?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getHeaderTitle = () => {
    const { start, end } = getDateRange();

    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else if (viewMode === "week") {
      const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${startStr} - ${endStr}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch("/api/auth/google");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to get auth URL:", error);
    }
  };

  const openGoogleCalendar = () => {
    window.open("https://calendar.google.com", "_blank");
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = event.end.dateTime ? new Date(event.end.dateTime) : null;
      const timeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (end) {
        const endTimeStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return `${timeStr} - ${endTimeStr}`;
      }
      return timeStr;
    }
    return "All day";
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const dateStr = event.start.dateTime || event.start.date || "";
    const dateKey = dateStr.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            padding: "32px 24px 100px 24px",
          }}
        >
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "32px" }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "32px" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "var(--foreground)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <Calendar style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
                  Calendar
                </h1>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  View and manage your Google Calendar events
                </p>
              </div>
              <button
                onClick={openGoogleCalendar}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Open Google Calendar
                <ExternalLink style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </motion.div>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : !isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{
                borderRadius: "16px",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <Calendar style={{ width: "48px", height: "48px", color: "var(--accent)", margin: "0 auto 20px" }} />
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                Connect Google Calendar
              </h2>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
                Connect your Google account to view and manage your calendar events directly from this dashboard.
              </p>
              <button
                onClick={handleConnect}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 28px",
                  borderRadius: "10px",
                  backgroundColor: "#4285f4",
                  color: "white",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* View mode selector and navigation */}
              <div
                className="glass"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  marginBottom: "24px",
                }}
              >
                {/* View mode buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: viewMode === mode ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
                        color: viewMode === mode ? "var(--background)" : "var(--foreground-muted)",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    onClick={goToToday}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "1px solid var(--glass-border)",
                      backgroundColor: "transparent",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Today
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      onClick={navigatePrev}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        border: "1px solid var(--glass-border)",
                        backgroundColor: "transparent",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <ChevronLeft style={{ width: "18px", height: "18px" }} />
                    </button>
                    <button
                      onClick={navigateNext}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "6px",
                        border: "1px solid var(--glass-border)",
                        backgroundColor: "transparent",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <ChevronRight style={{ width: "18px", height: "18px" }} />
                    </button>
                  </div>
                  <button
                    onClick={loadEvents}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      border: "1px solid var(--glass-border)",
                      backgroundColor: "transparent",
                      color: "var(--foreground-muted)",
                      cursor: "pointer",
                    }}
                    title="Refresh"
                  >
                    <RefreshCw style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              </div>

              {/* Current date range header */}
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                {getHeaderTitle()}
              </h2>

              {/* Events list */}
              {Object.keys(groupedEvents).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {Object.entries(groupedEvents)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateKey, dayEvents]) => (
                      <div key={dateKey} className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
                        <div
                          style={{
                            padding: "14px 20px",
                            borderBottom: "1px solid var(--glass-border)",
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                          }}
                        >
                          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
                            {new Date(dateKey).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </h3>
                        </div>
                        <div style={{ padding: "12px 20px" }}>
                          {dayEvents.map((event, idx) => (
                            <div
                              key={event.id}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "16px",
                                padding: "12px 0",
                                borderBottom: idx < dayEvents.length - 1 ? "1px solid var(--glass-border)" : "none",
                              }}
                            >
                              <div
                                style={{
                                  width: "4px",
                                  height: "40px",
                                  borderRadius: "2px",
                                  backgroundColor: "var(--accent)",
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", marginBottom: "4px" }}>
                                  {event.summary}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                                  {formatEventTime(event)}
                                </div>
                              </div>
                              {event.htmlLink && (
                                <a
                                  href={event.htmlLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--glass-border)",
                                    color: "var(--foreground-muted)",
                                    fontSize: "12px",
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <ExternalLink style={{ width: "12px", height: "12px" }} />
                                  View
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div
                  className="glass"
                  style={{
                    borderRadius: "12px",
                    padding: "40px",
                    textAlign: "center",
                  }}
                >
                  <Calendar style={{ width: "40px", height: "40px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    No events scheduled for this {viewMode}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
