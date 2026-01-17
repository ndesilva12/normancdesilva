"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Plus, X, Volume2, VolumeX, Clock } from "lucide-react";
import { useReminders, ReminderItem } from "@/contexts/RemindersContext";

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

  // Create beeping pattern
  for (let i = 0; i < cycleCount; i++) {
    const cycleStart = startTime + i * (beepDuration + pauseDuration);

    // Alternate between two frequencies for classic alarm sound
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

export function Reminders() {
  const { reminders, addReminder, removeReminder, toggleComplete, saveReminders } = useReminders();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState("");
  const [activeAlarm, setActiveAlarm] = useState<ReminderItem | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Check for triggered reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

      reminders.forEach((reminder) => {
        // Only trigger if webAlarm is enabled, not already triggered, and time matches
        const matchesTime = reminder.time === currentTime;
        const matchesDate = !reminder.date || reminder.date === currentDate;

        if (reminder.webAlarm && !reminder.alarmTriggered && !reminder.completed && matchesTime && matchesDate) {
          // Trigger the alarm
          setActiveAlarm(reminder);

          // Play sound if not muted
          if (!isMuted) {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext();
            }
            oscillatorRef.current = playAlarmSound(audioContextRef.current, 5000);
          }

          // Mark as triggered
          const updated = reminders.map((r) =>
            r.id === reminder.id ? { ...r, alarmTriggered: true } : r
          );
          saveReminders(updated);
        }
      });
    };

    // Check every second
    checkIntervalRef.current = setInterval(checkReminders, 1000);
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [reminders, isMuted, saveReminders]);

  const handleAddReminder = () => {
    if (!newLabel.trim() || !newTime) return;

    addReminder({
      label: newLabel.trim(),
      time: newTime,
      webAlarm: true,
    });
    setNewLabel("");
    setNewTime("");
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

  const resetAllReminders = () => {
    const reset = reminders.map((r) => ({ ...r, alarmTriggered: false }));
    saveReminders(reset);
  };

  // Filter to show only reminders with webAlarm enabled (time-based alarms)
  const webReminders = reminders.filter((r) => r.webAlarm && r.time);

  // Sort reminders by time
  const sortedReminders = [...webReminders].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // Count active (non-completed, non-triggered) reminders
  const activeCount = sortedReminders.filter((r) => !r.completed && !r.alarmTriggered).length;

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
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
            <p style={{ fontSize: "36px", fontWeight: 300, color: "var(--accent)", marginBottom: "24px" }}>
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

      {/* Reminders Panel */}
      <div
        className="glass"
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "14px 18px",
            background: "none",
            border: "none",
            cursor: "pointer",
            borderBottom: isExpanded ? "1px solid var(--glass-border)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Bell style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
              Reminders
            </span>
            {activeCount > 0 && (
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
                {activeCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              style={{
                background: "none",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                color: isMuted ? "var(--foreground-muted)" : "var(--accent)",
                display: "flex",
                alignItems: "center",
              }}
              title={isMuted ? "Unmute alarms" : "Mute alarms"}
            >
              {isMuted ? (
                <VolumeX style={{ width: "16px", height: "16px" }} />
              ) : (
                <Volume2 style={{ width: "16px", height: "16px" }} />
              )}
            </button>
            <span
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                color: "var(--foreground-muted)",
              }}
            >
              ▼
            </span>
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div style={{ padding: "16px" }}>
            {/* Add new reminder */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Reminder label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newLabel.trim() && newTime) {
                    handleAddReminder();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <button
                onClick={handleAddReminder}
                disabled={!newLabel.trim() || !newTime}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  cursor: !newLabel.trim() || !newTime ? "not-allowed" : "pointer",
                  opacity: !newLabel.trim() || !newTime ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Plus style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Reminders list */}
            {sortedReminders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {sortedReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: reminder.alarmTriggered || reminder.completed
                        ? "rgba(100, 100, 100, 0.1)"
                        : "rgba(255, 255, 255, 0.05)",
                      opacity: reminder.alarmTriggered || reminder.completed ? 0.5 : 1,
                    }}
                  >
                    <button
                      onClick={() => toggleComplete(reminder.id)}
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        border: `2px solid ${!reminder.completed ? "var(--accent)" : "var(--glass-border)"}`,
                        backgroundColor: reminder.completed ? "var(--accent)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {reminder.completed && (
                        <span style={{ color: "var(--background)", fontSize: "12px", fontWeight: 700 }}>✓</span>
                      )}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--foreground)",
                          textDecoration: reminder.completed ? "line-through" : "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {reminder.label}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontSize: "13px", fontWeight: 500 }}>
                      <Clock style={{ width: "14px", height: "14px" }} />
                      {reminder.time}
                    </div>
                    <button
                      onClick={() => removeReminder(reminder.id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        color: "var(--foreground-muted)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                ))}

                {/* Reset button */}
                {sortedReminders.some((r) => r.alarmTriggered) && (
                  <button
                    onClick={resetAllReminders}
                    style={{
                      marginTop: "8px",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid var(--glass-border)",
                      background: "transparent",
                      color: "var(--foreground-muted)",
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    Reset all reminders for today
                  </button>
                )}
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
                No reminders set. Add one above.
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS animations */}
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
      `}</style>
    </div>
  );
}
