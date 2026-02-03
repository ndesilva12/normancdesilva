"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ExternalLink, Loader2, RefreshCw, Plus } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

function formatEventTime(event: CalendarEvent): string {
  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime);
    return start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return "All day";
}

function formatEventDate(event: CalendarEvent): string {
  const dateStr = event.start.dateTime || event.start.date || "";
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const eventDateStr = date.toDateString();
  if (eventDateStr === today.toDateString()) return "Today";
  if (eventDateStr === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isEventToday(event: CalendarEvent): boolean {
  const dateStr = event.start.dateTime || event.start.date || "";
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

const CALENDAR_SETTINGS_KEY = "calendar_selected_calendars";

export function CalendarPreview() {
  const { isEditMode } = useLayout();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getSelectedCalendars = (): string[] => {
    try {
      const saved = localStorage.getItem(CALENDAR_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load calendar settings:", error);
    }
    return ["primary"];
  };

  const fetchEvents = useCallback(async () => {
    try {
      // Get events for the next 7 days
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);

      const selectedCalendars = getSelectedCalendars();
      const calendarsParam = selectedCalendars.join(",");

      const response = await fetch(
        `/api/calendar?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&calendars=${encodeURIComponent(calendarsParam)}`,
        { cache: "no-store" }
      );

      if (response.ok) {
        const data = await response.json();
        // Sort by date and take first 6
        const sortedEvents = (data.events || []).sort((a: CalendarEvent, b: CalendarEvent) => {
          const dateA = new Date(a.start.dateTime || a.start.date || "");
          const dateB = new Date(b.start.dateTime || b.start.date || "");
          return dateA.getTime() - dateB.getTime();
        });
        setEvents(sortedEvents.slice(0, 6));
      }
    } catch (error) {
      console.error("Failed to load calendar events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/google/status");
        const data = await response.json();
        setIsAuthenticated(data.authenticated);

        if (data.authenticated) {
          fetchEvents();
        } else {
          setLoading(false);
        }
      } catch {
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();
  }, [fetchEvents]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
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

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const dateLabel = formatEventDate(event);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: "1px solid var(--glass-border)",
          flexShrink: 0,
          cursor: "pointer",
        }}
        onClick={() => {
          router.push("/tools/calendar");
        }}
      >
        <Link
          href="/tools/calendar"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flex: 1,
          }}
        >
          <Calendar style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>Calendar</span>
        </Link>

        {!isEditMode && isAuthenticated && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--foreground-muted)",
              cursor: refreshing ? "not-allowed" : "pointer",
            }}
            title="Refresh"
          >
            <RefreshCw
              style={{
                width: "14px",
                height: "14px",
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        )}
        <Link
          href="/tools/calendar"
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}
        >
          <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
        </Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
              <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : !isAuthenticated ? (
            <div style={{ textAlign: "center", padding: "24px 16px" }}>
              <Calendar style={{ width: "32px", height: "32px", color: "var(--foreground-muted)", margin: "0 auto 12px" }} />
              <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
                Connect Google Calendar to view your events
              </div>
              <button
                onClick={handleConnect}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#4285f4",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect
              </button>
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 16px" }}>
              <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
                No upcoming events this week
              </div>
              <Link
                href="/tools/calendar"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  fontSize: "12px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <Plus style={{ width: "14px", height: "14px" }} />
                Add Event
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {Object.entries(groupedEvents).map(([dateLabel, dateEvents]) => (
                <div key={dateLabel}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: dateLabel === "Today" ? "var(--accent)" : "var(--foreground-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "8px",
                    }}
                  >
                    {dateLabel}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {dateEvents.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          backgroundColor: isEventToday(event) ? "rgba(var(--accent-rgb), 0.1)" : "rgba(255, 255, 255, 0.03)",
                          border: isEventToday(event) ? "1px solid rgba(var(--accent-rgb), 0.2)" : "1px solid var(--glass-border)",
                        }}
                      >
                        <div
                          style={{
                            width: "3px",
                            height: "32px",
                            borderRadius: "2px",
                            backgroundColor: "var(--accent)",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "var(--foreground)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {event.summary}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                            {formatEventTime(event)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* View All Link */}
              <Link
                href="/tools/calendar"
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: "var(--accent)",
                  textDecoration: "none",
                  padding: "8px",
                }}
              >
                View full calendar
              </Link>
            </div>
          )}
        </div>
    </div>
  );
}
