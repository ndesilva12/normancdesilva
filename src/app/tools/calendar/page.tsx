"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export default function CalendarPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    checkAuthAndLoadEvents();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [selectedDate, isAuthenticated]);

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

  const loadEvents = async () => {
    try {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7); // Load 7 days
      endDate.setHours(23, 59, 59, 999);

      const response = await fetch(
        `/api/calendar?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
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

  const formatEventDate = (event: CalendarEvent) => {
    const dateStr = event.start.dateTime || event.start.date;
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
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
              {/* Date selector and refresh */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={loadEvents}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "transparent",
                    color: "var(--foreground-muted)",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw style={{ width: "16px", height: "16px" }} />
                  Refresh
                </button>
              </div>

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
                            {new Date(dateKey).toLocaleDateString([], {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </h3>
                        </div>
                        <div style={{ padding: "12px 20px" }}>
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "16px",
                                padding: "12px 0",
                                borderBottom: "1px solid var(--glass-border)",
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
                    No events scheduled for this week
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
