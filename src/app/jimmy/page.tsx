"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import JimmyChatInterface from "@/components/JimmyChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Info } from "lucide-react";
import { useState, useEffect } from "react";

export default function JimmyPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = { role: "user" as const, content: message, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const response = await fetch("/api/jimmy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message,
          userId: user?.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      // Add assistant response
      const assistantMessage = {
        role: "assistant" as const,
        content: data.content || "No response received",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage = {
        role: "assistant" as const,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
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
          </div>

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
            <Info style={{ width: "20px", height: "20px", color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
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
                Jimmy has access to your emails, calendar, contacts, Google Drive, Notion, can control your Sonos speakers,
                monitor your Ring cameras, and help with any task. Ask him anything!
              </p>
            </div>
          </div>

          {/* Chat Interface */}
          <div
            className="glass"
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              minHeight: "600px",
            }}
          >
            <JimmyChatInterface
              initialMessages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
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
                📱 <strong>iMessage:</strong> Text +1 (508) 493-2857 (prefix messages with "jimmy")
              </li>
              <li style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                💬 <strong>Telegram:</strong> @NormanDeSilva_bot
              </li>
              <li style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                📧 <strong>Email:</strong> Email forwarding coming soon
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
