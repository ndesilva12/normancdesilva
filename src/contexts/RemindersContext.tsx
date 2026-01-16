"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface ReminderItem {
  id: string;
  label: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  webAlarm: boolean;
  calendarEventId?: string;
  completed: boolean;
  alarmTriggered: boolean;
}

const REMINDERS_STORAGE_KEY_PREFIX = "dashboard-reminders-";

function getStorageKey(userId: string | undefined): string {
  return userId ? `${REMINDERS_STORAGE_KEY_PREFIX}${userId}` : "";
}

interface RemindersContextValue {
  reminders: ReminderItem[];
  incompleteReminders: ReminderItem[];
  saveReminders: (updated: ReminderItem[]) => void;
  addReminder: (reminder: Omit<ReminderItem, "id" | "completed" | "alarmTriggered">) => void;
  toggleComplete: (id: string) => void;
  removeReminder: (id: string) => void;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  // Load reminders from localStorage (user-specific)
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

  const saveReminders = useCallback((updated: ReminderItem[]) => {
    if (!user) return;
    setReminders(updated);
    const storageKey = getStorageKey(user.uid);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [user]);

  const addReminder = useCallback((reminder: Omit<ReminderItem, "id" | "completed" | "alarmTriggered">) => {
    const newReminder: ReminderItem = {
      ...reminder,
      id: Date.now().toString(),
      completed: false,
      alarmTriggered: false,
    };
    saveReminders([...reminders, newReminder]);
  }, [reminders, saveReminders]);

  const toggleComplete = useCallback((id: string) => {
    saveReminders(
      reminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      )
    );
  }, [reminders, saveReminders]);

  const removeReminder = useCallback((id: string) => {
    saveReminders(reminders.filter((r) => r.id !== id));
  }, [reminders, saveReminders]);

  // Sort reminders: incomplete first, then by date/time
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.date && b.date) {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      if (a.time && b.time) return a.time.localeCompare(b.time);
    }
    return 0;
  });

  const incompleteReminders = sortedReminders.filter((r) => !r.completed);

  return (
    <RemindersContext.Provider
      value={{
        reminders: sortedReminders,
        incompleteReminders,
        saveReminders,
        addReminder,
        toggleComplete,
        removeReminder,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error("useReminders must be used within a RemindersProvider");
  }
  return context;
}
