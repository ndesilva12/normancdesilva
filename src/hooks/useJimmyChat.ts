/**
 * Custom React Hook for Jimmy Chat Integration
 * Location: src/hooks/useJimmyChat.ts
 * 
 * This hook encapsulates all the chat logic and can be reused across components.
 * It provides a clean API for interacting with Jimmy.
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
}

export interface UseJimmyChatOptions {
  userId?: string;
  sessionId?: string;
  maxMessages?: number;
  persistHistory?: boolean;
  onError?: (error: Error) => void;
  onSessionChange?: (sessionId: string) => void;
}

export interface UseJimmyChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
  updateMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
}

export function useJimmyChat(
  options: UseJimmyChatOptions = {}
): UseJimmyChatReturn {
  const {
    userId,
    sessionId: initialSessionId,
    maxMessages = 100,
    persistHistory = true,
    onError,
    onSessionChange,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId || null
  );

  const lastUserMessageRef = useRef<string | null>(null);

  // Storage key for persisting messages
  const storageKey = `jimmy-chat-${userId || "anonymous"}`;

  // Load messages from localStorage on mount
  useEffect(() => {
    if (!persistHistory) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const messages = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messages);
      }
    } catch (err) {
      console.error("[useJimmyChat] Failed to load chat history:", err);
    }
  }, [storageKey, persistHistory]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!persistHistory || messages.length === 0) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (err) {
      console.error("[useJimmyChat] Failed to save chat history:", err);
    }
  }, [messages, storageKey, persistHistory]);

  // Generate unique message ID
  const generateMessageId = () =>
    `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Send message to API
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      // Store for retry functionality
      lastUserMessageRef.current = messageText.trim();

      // Clear previous errors
      setError(null);

      // Add user message
      const userMessage: Message = {
        id: generateMessageId(),
        role: "user",
        content: messageText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev.slice(-maxMessages + 1), userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/jimmy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: messageText.trim(),
            userId,
            conversationId: sessionId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Request failed with status ${response.status}`);
        }

        // Update conversation ID if provided
        if (data.conversationId && data.conversationId !== sessionId) {
          setSessionId(data.conversationId);
          onSessionChange?.(data.conversationId);
        }

        // Add assistant response
        const assistantMessage: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: data.content || "I'm sorry, I couldn't generate a response.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev.slice(-maxMessages + 1), assistantMessage]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";

        setError(errorMessage);

        // Add error message to chat
        const errorMsg: Message = {
          id: generateMessageId(),
          role: "error",
          content: errorMessage,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev.slice(-maxMessages + 1), errorMsg]);

        // Call error callback
        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, userId, sessionId, maxMessages, onSessionChange, onError]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    if (persistHistory) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, persistHistory]);

  // Retry last user message
  const retryLastMessage = useCallback(async () => {
    if (lastUserMessageRef.current) {
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  // Update a specific message (useful for editing)
  const updateMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content, timestamp: new Date() } : msg
      )
    );
  }, []);

  // Delete a specific message
  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    clearMessages,
    retryLastMessage,
    updateMessage,
    deleteMessage,
  };
}
