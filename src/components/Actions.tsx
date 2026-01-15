"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckSquare,
  Plus,
  X,
  Calendar,
  Clock,
  Bell,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

export interface ActionItem {
  id: string;
  label: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  webAlarm: boolean;
  calendarEventId?: string; // If synced to Google Calendar
  completed: boolean;
  alarmTriggered: boolean;
}

export const ACTIONS_STORAGE_KEY = "dashboard-actions";

// For internal use
type Action = ActionItem;

// Generate alarm sound using Web Audio API
function playAlarmSound(audioContext: AudioContext, duration: number = 3000) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = "sine";

  const startTime = audioContext.currentTime;
  const beepDuration = 0.15;
  const pauseDuration = 0.1;
  const cycleCount = Math.floor(duration / 1000) * 4;

  for (let i = 0; i < cycleCount; i++) {
    const cycleStart = startTime + i * (beepDuration + pauseDuration);
    oscillator.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, cycleStart);
    gainNode.gain.setValueAtTime(0, cycleStart);
    gainNode.gain.linearRampToValueAtTime(0.3, cycleStart + 0.01);
    gainNode.gain.setValueAtTime(0.3, cycleStart + beepDuration - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, cycleStart + beepDuration);
  }

  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000);
  return oscillator;
}

interface ActionsProps {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
  defaultCollapsed?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export function Actions({ isGoogleConnected, onConnectGoogle, defaultCollapsed = false, onExpandChange }: ActionsProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

  // Notify parent of expand state changes
  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newWebAlarm, setNewWebAlarm] = useState(false);
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<Action | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Action | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Load actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ACTIONS_STORAGE_KEY);
    if (stored) {
      try {
        setActions(JSON.parse(stored));
      } catch {
        setActions([]);
      }
    }
  }, []);

  const saveActions = useCallback((updated: Action[]) => {
    setActions(updated);
    localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(updated));
  }, []);

  // Check for web alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      actions.forEach((action) => {
        if (
          action.webAlarm &&
          !action.alarmTriggered &&
          !action.completed &&
          action.date === currentDate &&
          action.time === currentTime
        ) {
          setActiveAlarm(action);

          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          oscillatorRef.current = playAlarmSound(audioContextRef.current, 5000);

          const updated = actions.map((a) =>
            a.id === action.id ? { ...a, alarmTriggered: true } : a
          );
          saveActions(updated);
        }
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [actions, saveActions]);

  const addAction = async () => {
    if (!newLabel.trim()) return;

    // If adding to calendar, date and time are required
    if (addToCalendar && (!newDate || !newTime)) {
      alert("Date and time are required when adding to Google Calendar");
      return;
    }

    setIsAdding(true);

    const action: Action = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      date: newDate || undefined,
      time: newTime || undefined,
      webAlarm: newWebAlarm && !!newDate && !!newTime,
      completed: false,
      alarmTriggered: false,
    };

    // Add to Google Calendar if requested
    if (addToCalendar && isGoogleConnected) {
      try {
        const response = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: action.label,
            date: action.date,
            time: action.time,
            reminderMinutes: 10, // Default 10 min reminder
          }),
        });

        if (response.ok) {
          const data = await response.json();
          action.calendarEventId = data.event.id;
        } else {
          const error = await response.json();
          console.error("Failed to add to calendar:", error);
          alert("Failed to add to Google Calendar: " + (error.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Calendar API error:", error);
      }
    }

    saveActions([...actions, action]);
    setNewLabel("");
    setNewDate("");
    setNewTime("");
    setNewWebAlarm(false);
    setAddToCalendar(false);
    setIsAdding(false);
  };

  const initiateDelete = (action: Action) => {
    if (action.calendarEventId) {
      setDeleteConfirm(action);
    } else {
      removeAction(action, false);
    }
  };

  const removeAction = async (action: Action, removeFromCalendar: boolean) => {
    setIsDeleting(true);

    if (removeFromCalendar && action.calendarEventId) {
      try {
        await fetch(`/api/calendar?eventId=${action.calendarEventId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete from calendar:", error);
      }
    }

    saveActions(actions.filter((a) => a.id !== action.id));
    setDeleteConfirm(null);
    setIsDeleting(false);
  };

  const toggleComplete = (id: string) => {
    saveActions(
      actions.map((a) =>
        a.id === id ? { ...a, completed: !a.completed } : a
      )
    );
  };

  const dismissAlarm = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // Already stopped
      }
    }
    setActiveAlarm(null);
  };

  // Sort actions: incomplete first, then by date/time
  const sortedActions = [...actions].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.date && b.date) {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      if (a.time && b.time) return a.time.localeCompare(b.time);
    }
    return 0;
  });

  const incompleteCount = actions.filter((a) => !a.completed).length;

  return (
    <div
      style={{
        position: "relative",
        width: "160px",
        flexShrink: 0,
      }}
    >
      {/* Active Alarm Modal */}
      {activeAlarm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={dismissAlarm}
        >
          <div
            className="glass"
            style={{
              borderRadius: "20px",
              padding: "40px",
              textAlign: "center",
              animation: "pulse 1s ease-in-out infinite",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Bell
              style={{
                width: "48px",
                height: "48px",
                color: "var(--accent)",
                marginBottom: "20px",
                animation: "shake 0.5s ease-in-out infinite",
              }}
            />
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "12px" }}>
              {activeAlarm.label}
            </h2>
            <p style={{ fontSize: "18px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
              {activeAlarm.time}
            </p>
            <button
              onClick={dismissAlarm}
              style={{
                padding: "14px 40px",
                borderRadius: "10px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !isDeleting && setDeleteConfirm(null)}
        >
          <div
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "400px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <AlertCircle style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
                Remove from Calendar?
              </h3>
            </div>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              This action is synced with Google Calendar. Would you also like to remove it from your calendar?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => removeAction(deleteConfirm, true)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                {isDeleting ? "Removing..." : "Yes, remove from both"}
              </button>
              <button
                onClick={() => removeAction(deleteConfirm, false)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  border: "1px solid var(--glass-border)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                Keep in Calendar
              </button>
            </div>
          </div>
        </div>
      )}

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
            <CheckSquare style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>
              Actions
            </span>
            {incompleteCount > 0 && (
              <span
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  borderRadius: "9999px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {incompleteCount}
              </span>
            )}
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
            right: 0,
            width: "380px",
            borderRadius: "10px",
            padding: "16px",
            zIndex: 50,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
          }}
        >
            {/* Google Calendar Connection */}
            {!isGoogleConnected && (
              <button
                onClick={onConnectGoogle}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "10px",
                  marginBottom: "16px",
                  borderRadius: "8px",
                  border: "1px dashed var(--glass-border)",
                  background: "transparent",
                  color: "var(--foreground-muted)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Calendar style={{ width: "16px", height: "16px" }} />
                Connect Google Calendar
              </button>
            )}

            {/* Add new action */}
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="New action..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAction()}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  outline: "none",
                  marginBottom: "10px",
                }}
              />

              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <Calendar style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--foreground-muted)", pointerEvents: "none" }} />
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      borderRadius: "6px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <Clock style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--foreground-muted)", pointerEvents: "none" }} />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      borderRadius: "6px",
                      border: "1px solid var(--glass-border)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--foreground-muted)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={newWebAlarm}
                    onChange={(e) => setNewWebAlarm(e.target.checked)}
                    disabled={!newDate || !newTime}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  <Bell style={{ width: "12px", height: "12px" }} />
                  Web alarm
                </label>
                {isGoogleConnected && (
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--foreground-muted)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={addToCalendar}
                      onChange={(e) => setAddToCalendar(e.target.checked)}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <Calendar style={{ width: "12px", height: "12px" }} />
                    Add to Calendar
                  </label>
                )}
              </div>

              <button
                onClick={addAction}
                disabled={!newLabel.trim() || isAdding || (addToCalendar && (!newDate || !newTime))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: !newLabel.trim() || isAdding ? "not-allowed" : "pointer",
                  opacity: !newLabel.trim() || isAdding ? 0.5 : 1,
                }}
              >
                {isAdding ? (
                  <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                ) : (
                  <Plus style={{ width: "16px", height: "16px" }} />
                )}
                {isAdding ? "Adding..." : "Add Action"}
              </button>
            </div>

            {/* Actions list */}
            {sortedActions.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
                {sortedActions.map((action) => (
                  <div
                    key={action.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: action.completed
                        ? "rgba(100, 100, 100, 0.1)"
                        : "rgba(255, 255, 255, 0.05)",
                      opacity: action.completed ? 0.6 : 1,
                    }}
                  >
                    <button
                      onClick={() => toggleComplete(action.id)}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        border: `2px solid ${action.completed ? "var(--accent)" : "var(--glass-border)"}`,
                        backgroundColor: action.completed ? "var(--accent)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {action.completed && (
                        <span style={{ color: "var(--background)", fontSize: "10px", fontWeight: 700 }}>✓</span>
                      )}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--foreground)",
                          textDecoration: action.completed ? "line-through" : "none",
                          wordBreak: "break-word",
                        }}
                      >
                        {action.label}
                      </div>
                      {(action.date || action.time) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "11px", color: "var(--foreground-muted)" }}>
                          {action.date && <span>{action.date}</span>}
                          {action.time && <span>{action.time}</span>}
                          {action.webAlarm && <Bell style={{ width: "10px", height: "10px" }} />}
                          {action.calendarEventId && (
                            <Calendar style={{ width: "10px", height: "10px", color: "#4285f4" }} />
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => initiateDelete(action)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "2px",
                        cursor: "pointer",
                        color: "var(--foreground-muted)",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <X style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "var(--foreground-muted)",
                  fontSize: "13px",
                }}
              >
                No actions yet. Add one above.
              </div>
            )}
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
