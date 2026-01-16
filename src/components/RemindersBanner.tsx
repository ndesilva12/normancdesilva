"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, X, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ReminderItem {
  id: string;
  label: string;
  date?: string;
  time?: string;
  webAlarm: boolean;
  calendarEventId?: string;
  completed: boolean;
  alarmTriggered: boolean;
}

const REMINDERS_STORAGE_KEY_PREFIX = "dashboard-reminders-";

function getStorageKey(userId: string | undefined): string {
  return userId ? `${REMINDERS_STORAGE_KEY_PREFIX}${userId}` : "";
}

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

export function RemindersBanner() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<ReminderItem | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Load reminders from localStorage
  useEffect(() => {
    if (!user) {
      setReminders([]);
      return;
    }
    const storageKey = getStorageKey(user.uid);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setReminders(JSON.parse(stored));
      } catch {
        setReminders([]);
      }
    }
  }, [user]);

  // Listen for storage changes from other components
  useEffect(() => {
    if (!user) return;

    const handleStorageChange = () => {
      const storageKey = getStorageKey(user.uid);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setReminders(JSON.parse(stored));
        } catch {
          setReminders([]);
        }
      }
    };

    // Check for updates every second
    const interval = setInterval(handleStorageChange, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const saveReminders = useCallback((updated: ReminderItem[]) => {
    if (!user) return;
    setReminders(updated);
    const storageKey = getStorageKey(user.uid);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [user]);

  // Check for web alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      reminders.forEach((reminder) => {
        if (
          reminder.webAlarm &&
          !reminder.alarmTriggered &&
          !reminder.completed &&
          reminder.date === currentDate &&
          reminder.time === currentTime
        ) {
          setActiveAlarm(reminder);

          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext();
          }
          oscillatorRef.current = playAlarmSound(audioContextRef.current, 5000);

          const updated = reminders.map((r) =>
            r.id === reminder.id ? { ...r, alarmTriggered: true } : r
          );
          saveReminders(updated);
        }
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [reminders, saveReminders]);

  const toggleComplete = (id: string) => {
    saveReminders(
      reminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
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

  // Sort and filter incomplete reminders
  const incompleteReminders = [...reminders]
    .filter((r) => !r.completed)
    .sort((a, b) => {
      if (a.date && b.date) {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        if (a.time && b.time) return a.time.localeCompare(b.time);
      }
      return 0;
    });

  if (!user || incompleteReminders.length === 0) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
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

      {/* Reminders Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {incompleteReminders.slice(0, 5).map((reminder) => (
          <div
            key={reminder.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              backgroundColor: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.2)",
            }}
          >
            <button
              onClick={() => toggleComplete(reminder.id)}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "4px",
                border: "2px solid var(--accent)",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                padding: 0,
              }}
              title="Mark as complete"
            >
              <Check style={{ width: "10px", height: "10px", color: "var(--accent)", opacity: 0 }} />
            </button>
            <span
              style={{
                fontSize: "13px",
                color: "var(--foreground)",
                whiteSpace: "nowrap",
              }}
            >
              {reminder.label}
            </span>
            {reminder.time && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "var(--accent)",
                }}
              >
                <Clock style={{ width: "12px", height: "12px" }} />
                {reminder.time}
              </span>
            )}
          </div>
        ))}
        {incompleteReminders.length > 5 && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--foreground-muted)",
            }}
          >
            +{incompleteReminders.length - 5} more
          </span>
        )}
      </div>

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
    </>
  );
}
