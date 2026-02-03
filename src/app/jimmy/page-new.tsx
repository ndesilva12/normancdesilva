/**
 * Example Jimmy Page Implementation using the Custom Hook
 * Location: src/app/jimmy/page.tsx
 * 
 * This demonstrates how to use the useJimmyChat hook in your page component.
 */

"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useJimmyChat } from "@/hooks/useJimmyChat";
import { MessageSquare, Info, Trash2, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function JimmyPage() {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    clearMessages,
    retryLastMessage,
  } = useJimmyChat({
    userId: user?.uid,
    persistHistory: true,
    onError: (err) => {
      console.error("Jimmy chat error:", err);
    },
    onSessionChange: (newSessionId) => {
      console.log("Session changed to:", newSessionId);
    },
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      clearMessages();
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />

      <div
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          paddingBottom: isMobile ? "88px" : "24px",
          padding: isMobile ? "64px 12px 88px 12px" : "64px 24px 24px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare style={{ width: "24px", height: "24px", color: "#ffffff" }} />
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: "32px",
                      fontWeight: 700,
                      color: "var(--foreground)",
                      margin: 0,
                    }}
                  >
                    Jimmy
                  </h1>
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)", margin: 0 }}>
                    Your AI Chief of Staff
                  </p>
                </div>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                }}
              >
                <Settings style={{ width: "16px", height: "16px" }} />
                {!isMobile && "Settings"}
              </button>
            </div>

            {/* Session Info */}
            {sessionId && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--foreground-muted)",
                  margin: "4px 0 0 60px",
                  fontFamily: "monospace",
                }}
              >
                Session: {sessionId.substring(0, 20)}...
              </p>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div
              className="glass"
              style={{
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "24px",
                border: "1px solid var(--glass-border)",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  margin: "0 0 16px 0",
                  color: "var(--foreground)",
                }}
              >
                Chat Settings
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={handleClearHistory}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  <Trash2 style={{ width: "16px", height: "16px" }} />
                  Clear Chat History
                </button>

                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--foreground-muted)",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                  }}
                >
                  <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>Stats:</p>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    <li>Total messages: {messages.length}</li>
                    <li>
                      User messages: {messages.filter((m) => m.role === "user").length}
                    </li>
                    <li>
                      Jimmy responses: {messages.filter((m) => m.role === "assistant").length}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              marginBottom: "24px",
            }}
          >
            <Info
              style={{ width: "20px", height: "20px", color: "#10b981", flexShrink: 0, marginTop: "2px" }}
            />
            <div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#10b981",
                  margin: "0 0 6px 0",
                }}
              >
                What Jimmy can do
              </p>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--foreground-muted)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Jimmy has access to your emails, calendar, contacts, Google Drive, Notion, can control your Sonos
                speakers, monitor your Ring cameras, and help with any task. Ask him anything!
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontSize: "14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{error}</span>
              <button
                onClick={retryLastMessage}
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Chat Interface */}
          <div
            className="glass"
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              height: "calc(100vh - 400px)",
              minHeight: "500px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Messages Area */}
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
              {messages.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "var(--foreground-muted)",
                    textAlign: "center",
                    padding: "40px 20px",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                    Start a conversation with Jimmy
                  </h3>
                  <p style={{ fontSize: "14px", maxWidth: "400px" }}>
                    Try asking: "What's on my calendar today?" or "Summarize my recent emails"
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
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
                          : msg.role === "error"
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(255, 255, 255, 0.05)",
                      color:
                        msg.role === "user"
                          ? "white"
                          : msg.role === "error"
                          ? "#ef4444"
                          : "var(--foreground)",
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
                  <div className="spinner" />
                  Jimmy is thinking...
                </div>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem("message") as HTMLInputElement;
                if (input.value.trim()) {
                  sendMessage(input.value);
                  input.value = "";
                }
              }}
              style={{
                display: "flex",
                gap: "12px",
                padding: "16px",
                borderTop: "1px solid var(--glass-border)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <input
                name="message"
                type="text"
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
                disabled={isLoading}
                style={{
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: isLoading ? "rgba(255, 255, 255, 0.1)" : "var(--accent)",
                  color: isLoading ? "var(--foreground-muted)" : "white",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Send
              </button>
            </form>
          </div>

          {/* Additional Info */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "var(--foreground-muted)",
                margin: "0 0 8px 0",
                fontWeight: 600,
              }}
            >
              Other ways to reach Jimmy:
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <li style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                📱 <strong>iMessage:</strong> Text +1 (508) 493-2857 (prefix with "jimmy")
              </li>
              <li style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                💬 <strong>Telegram:</strong> @NormanDeSilva_bot
              </li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
