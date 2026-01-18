"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";

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

// Helper to remove undefined values from objects (Firestore doesn't accept undefined)
function cleanForFirestore<T extends object>(obj: T): T {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if ((cleaned as Record<string, unknown>)[key] === undefined) {
      delete (cleaned as Record<string, unknown>)[key];
    }
  });
  return cleaned;
}

// Clean an array of reminders for Firestore
function cleanRemindersForFirestore(reminders: ReminderItem[]): ReminderItem[] {
  return reminders.map(reminder => cleanForFirestore(reminder));
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Load reminders from Firestore with real-time sync, fallback to localStorage
  useEffect(() => {
    if (!user) {
      setReminders([]);
      setIsInitialized(false);
      return;
    }

    // If Firestore is available, use it with real-time sync
    if (db) {
      const userDocRef = doc(db, "users", user.uid);

      // Set up real-time listener for cross-device sync
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.reminders) {
              setReminders(data.reminders);
              // Also update localStorage as backup
              const storageKey = getStorageKey(user.uid);
              localStorage.setItem(storageKey, JSON.stringify(data.reminders));
            }
          } else {
            // Document doesn't exist yet, check localStorage for initial data
            const storageKey = getStorageKey(user.uid);
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const localReminders = JSON.parse(stored);
                setReminders(localReminders);
                // Migrate localStorage data to Firestore (clean undefined values)
                setDoc(userDocRef, { reminders: cleanRemindersForFirestore(localReminders) }, { merge: true });
              } catch {
                setReminders([]);
              }
            }
          }
          setIsInitialized(true);
        },
        (error) => {
          console.error("Firestore sync error:", error);
          // Fallback to localStorage on error
          const storageKey = getStorageKey(user.uid);
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            try {
              setReminders(JSON.parse(stored));
            } catch {
              setReminders([]);
            }
          }
          setIsInitialized(true);
        }
      );

      return () => unsubscribe();
    } else {
      // Fallback to localStorage only
      const storageKey = getStorageKey(user.uid);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setReminders(JSON.parse(stored));
        } catch {
          setReminders([]);
        }
      }
      setIsInitialized(true);
    }
  }, [user]);

  const saveReminders = useCallback(async (updated: ReminderItem[]) => {
    if (!user) return;
    setReminders(updated);

    // Save to localStorage as backup
    const storageKey = getStorageKey(user.uid);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Save to Firestore for cross-device sync (clean undefined values)
    if (db) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { reminders: cleanRemindersForFirestore(updated) }, { merge: true });
      } catch (error) {
        console.error("Failed to save reminders to Firestore:", error);
      }
    }
  }, [user]);

  const addReminder = useCallback((reminder: Omit<ReminderItem, "id" | "completed" | "alarmTriggered">) => {
    const newReminder: ReminderItem = {
      ...reminder,
      id: Date.now().toString(),
      completed: false,
      alarmTriggered: false,
    };
    // Use functional update to avoid stale closure issues
    setReminders(currentReminders => {
      const updated = [...currentReminders, newReminder];
      // Save asynchronously
      if (user) {
        const storageKey = getStorageKey(user.uid);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (db) {
          const userDocRef = doc(db, "users", user.uid);
          setDoc(userDocRef, { reminders: cleanRemindersForFirestore(updated) }, { merge: true }).catch(err =>
            console.error("Failed to save reminders to Firestore:", err)
          );
        }
      }
      return updated;
    });
  }, [user]);

  const toggleComplete = useCallback((id: string) => {
    setReminders(currentReminders => {
      const updated = currentReminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      );
      // Save asynchronously
      if (user) {
        const storageKey = getStorageKey(user.uid);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (db) {
          const userDocRef = doc(db, "users", user.uid);
          setDoc(userDocRef, { reminders: cleanRemindersForFirestore(updated) }, { merge: true }).catch(err =>
            console.error("Failed to save reminders to Firestore:", err)
          );
        }
      }
      return updated;
    });
  }, [user]);

  const removeReminder = useCallback((id: string) => {
    setReminders(currentReminders => {
      const updated = currentReminders.filter((r) => r.id !== id);
      // Save asynchronously
      if (user) {
        const storageKey = getStorageKey(user.uid);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        if (db) {
          const userDocRef = doc(db, "users", user.uid);
          setDoc(userDocRef, { reminders: cleanRemindersForFirestore(updated) }, { merge: true }).catch(err =>
            console.error("Failed to save reminders to Firestore:", err)
          );
        }
      }
      return updated;
    });
  }, [user]);

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
