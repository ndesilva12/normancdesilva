"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, Loader2, RefreshCw, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

type ViewMode = "day" | "week" | "month";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function CalendarPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [isMobile, setIsMobile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    summary: "",
    description: "",
    date: "",
    time: "",
    endTime: "",
  });

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    checkAuthAndLoadEvents();
  }, []);

  const loadEvents = useCallback(async () => {
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
  }, [currentDate, viewMode]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [currentDate, viewMode, isAuthenticated, loadEvents]);

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
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const getWeekDays = () => {
    const { start } = getDateRange();
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => {
      const eventDate = (event.start.dateTime || event.start.date || "").split("T")[0];
      return eventDate === dateStr;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
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

  const goToDate = (date: Date) => {
    setCurrentDate(date);
    setViewMode("day");
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

  const openAddModal = (date?: Date) => {
    const targetDate = date || currentDate;
    const dateStr = targetDate.toISOString().split("T")[0];
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    const timeStr = `${hours}:${minutes.toString().padStart(2, "0")}`;
    const endHours = (now.getHours() + 1).toString().padStart(2, "0");
    const endTimeStr = `${endHours}:${minutes.toString().padStart(2, "0")}`;

    setNewEvent({
      summary: "",
      description: "",
      date: dateStr,
      time: timeStr,
      endTime: endTimeStr,
    });
    setShowAddModal(true);
  };

  const createEvent = async () => {
    if (!newEvent.summary || !newEvent.date || !newEvent.time) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: newEvent.summary,
          description: newEvent.description,
          date: newEvent.date,
          time: newEvent.time,
          endTime: newEvent.endTime,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewEvent({ summary: "", description: "", date: "", time: "", endTime: "" });
        await loadEvents();
      } else {
        const data = await response.json();
        console.error("Failed to create event:", data.error);
      }
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      return start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return "All day";
  };

  const formatEventTimeFull = (event: CalendarEvent) => {
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

  // Render Day View
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--glass-border)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
        </div>
        <div style={{ padding: "12px 20px" }}>
          {dayEvents.length > 0 ? (
            dayEvents.map((event, idx) => (
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
                    {formatEventTimeFull(event)}
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
            ))
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--foreground-muted)" }}>
              No events scheduled
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekDays = getWeekDays();

    return (
      <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
        {/* Day headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            borderBottom: "1px solid var(--glass-border)",
          }}
        >
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px 8px",
                textAlign: "center",
                borderRight: idx < 6 ? "1px solid var(--glass-border)" : "none",
                backgroundColor: isToday(day) ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                {isMobile ? DAY_NAMES[idx] : DAY_NAMES_FULL[idx]}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: isToday(day) ? "var(--accent)" : "var(--foreground)",
                }}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Day content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            minHeight: "300px",
          }}
        >
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            return (
              <div
                key={idx}
                onClick={() => goToDate(day)}
                style={{
                  padding: "8px",
                  borderRight: idx < 6 ? "1px solid var(--glass-border)" : "none",
                  backgroundColor: isToday(day) ? "rgba(var(--accent-rgb), 0.05)" : "transparent",
                  cursor: "pointer",
                  minHeight: "200px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {dayEvents.slice(0, isMobile ? 2 : 4).map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: "4px 6px",
                        borderRadius: "4px",
                        backgroundColor: "var(--accent)",
                        fontSize: "11px",
                        color: "var(--background)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {!isMobile && (
                        <span style={{ opacity: 0.8 }}>{formatEventTime(event)} </span>
                      )}
                      {event.summary}
                    </div>
                  ))}
                  {dayEvents.length > (isMobile ? 2 : 4) && (
                    <div style={{ fontSize: "10px", color: "var(--foreground-muted)", paddingLeft: "4px" }}>
                      +{dayEvents.length - (isMobile ? 2 : 4)} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const monthDays = getMonthDays();

    return (
      <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
        {/* Day name headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            borderBottom: "1px solid var(--glass-border)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          {DAY_NAMES.map((name, idx) => (
            <div
              key={idx}
              style={{
                padding: isMobile ? "8px 4px" : "12px 8px",
                textAlign: "center",
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: 600,
                color: "var(--foreground-muted)",
                borderRight: idx < 6 ? "1px solid var(--glass-border)" : "none",
              }}
            >
              {isMobile ? name.charAt(0) : name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
          }}
        >
          {monthDays.map((day, idx) => {
            const dayEvents = day ? getEventsForDate(day) : [];
            const todayClass = day && isToday(day);

            return (
              <div
                key={idx}
                onClick={() => day && goToDate(day)}
                style={{
                  minHeight: isMobile ? "50px" : "100px",
                  padding: isMobile ? "4px" : "8px",
                  borderRight: (idx + 1) % 7 !== 0 ? "1px solid var(--glass-border)" : "none",
                  borderBottom: idx < monthDays.length - 7 ? "1px solid var(--glass-border)" : "none",
                  backgroundColor: todayClass ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
                  cursor: day ? "pointer" : "default",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (day && !todayClass) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (day && !todayClass) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {day && (
                  <>
                    {/* Day number */}
                    <div
                      style={{
                        fontSize: isMobile ? "12px" : "14px",
                        fontWeight: todayClass ? 700 : 500,
                        color: todayClass ? "var(--accent)" : "var(--foreground)",
                        marginBottom: isMobile ? "2px" : "6px",
                        textAlign: isMobile ? "center" : "left",
                      }}
                    >
                      {day.getDate()}
                    </div>

                    {/* Events (desktop only or dot indicators for mobile) */}
                    {isMobile ? (
                      dayEvents.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: "2px", flexWrap: "wrap" }}>
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                backgroundColor: "var(--accent)",
                              }}
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            style={{
                              padding: "2px 4px",
                              borderRadius: "3px",
                              backgroundColor: "var(--accent)",
                              fontSize: "10px",
                              color: "var(--background)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {event.summary}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: "9px", color: "var(--foreground-muted)" }}>
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "32px 24px 100px 24px",
          }}
        >
          <RemindersBanner />
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
              <div style={{ display: "flex", gap: "12px" }}>
                {isAuthenticated && (
                  <button
                    onClick={() => openAddModal()}
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
                    <Plus style={{ width: "16px", height: "16px" }} />
                    Add Event
                  </button>
                )}
                <button
                  onClick={openGoogleCalendar}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    backgroundColor: "transparent",
                    color: "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Google Calendar
                  <ExternalLink style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
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
                    onClick={() => loadEvents()}
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

              {/* Calendar Views */}
              {viewMode === "day" && renderDayView()}
              {viewMode === "week" && renderWeekView()}
              {viewMode === "month" && renderMonthView()}
            </motion.div>
          )}
        </div>

        {/* Add Event Modal */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass"
              style={{
                width: "100%",
                maxWidth: "480px",
                borderRadius: "16px",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--glass-border)",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
                  New Event
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: "18px", height: "18px" }} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Title */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--foreground-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Event title"
                    value={newEvent.summary}
                    onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Date */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--foreground-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Time */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--foreground-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--glass-border)",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        color: "var(--foreground)",
                        fontSize: "15px",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--foreground-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--glass-border)",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        color: "var(--foreground)",
                        fontSize: "15px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--foreground-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    placeholder="Add a description (optional)"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--glass-border)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "15px",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  padding: "16px 24px",
                  borderTop: "1px solid var(--glass-border)",
                }}
              >
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    backgroundColor: "transparent",
                    color: "var(--foreground-muted)",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createEvent}
                  disabled={isCreating || !newEvent.summary || !newEvent.date || !newEvent.time}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: isCreating ? "not-allowed" : "pointer",
                    opacity: isCreating || !newEvent.summary || !newEvent.date || !newEvent.time ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isCreating && <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />}
                  {isCreating ? "Creating..." : "Create Event"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
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
