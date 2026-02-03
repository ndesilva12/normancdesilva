"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface JimmyChatInterfaceProps {
  initialMessages: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export default function JimmyChatInterface({
  initialMessages,
  onSendMessage,
  isLoading,
}: JimmyChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.ref?.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await onSendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "600px",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--glass-border)",
        backgroundColor: "rgba(255, 255, 255, 0.02)",
      }}
    >
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {initialMessages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "12px",
                backgroundColor:
                  msg.role === "user"
                    ? "var(--accent)"
                    : "rgba(255, 255, 255, 0.05)",
                color: msg.role === "user" ? "white" : "var(--foreground)",
                fontSize: "14px",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--foreground-muted)",
                opacity: 0.6,
                marginTop: "4px",
              }}
            >
              {msg.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--foreground-muted)",
              fontSize: "14px",
            }}
          >
            <Loader2
              style={{
                width: "16px",
                height: "16px",
                animation: "spin 1s linear infinite",
              }}
            />
            Jimmy is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "12px",
          padding: "16px",
          borderTop: "1px solid var(--glass-border)",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Message Jimmy..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid var(--glass-border)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            color: "var(--foreground)",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: input.trim() && !isLoading ? "var(--accent)" : "rgba(255, 255, 255, 0.1)",
            color: input.trim() && !isLoading ? "white" : "var(--foreground-muted)",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          <Send style={{ width: "16px", height: "16px" }} />
          Send
        </button>
      </form>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
