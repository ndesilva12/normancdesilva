"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import JimmyChatInterface from "@/components/JimmyChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Info, Plus, History, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Conversation {
  id: string;
  userMessage?: string;
  assistantMessage?: string;
  createdAt?: string;
  lastUpdated?: string;
  status?: string;
}

export default function JimmyPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load conversation history
  useEffect(() => {
    if (user && showHistory) {
      loadConversationHistory();
    }
  }, [user, showHistory]);

  const loadConversationHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/jimmy?userId=${user.uid}&limit=20`);
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleLoadConversation = (conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    // Load the conversation's messages if available
    const loadedMessages = [];
    if (conversation.userMessage) {
      loadedMessages.push({
        role: "user" as const,
        content: conversation.userMessage,
        timestamp: new Date(conversation.createdAt || Date.now()),
      });
    }
    if (conversation.assistantMessage) {
      loadedMessages.push({
        role: "assistant" as const,
        content: conversation.assistantMessage,
        timestamp: new Date(conversation.createdAt || Date.now()),
      });
    }
    setMessages(loadedMessages);
    setShowHistory(false);
  };

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
          conversationId: currentConversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      // Store the conversation ID from response
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
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
          {/* Header with controls */}
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
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

            {/* Control buttons */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={handleNewConversation}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={14} />
                New
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: showHistory ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  color: showHistory ? "#10b981" : "var(--foreground)",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <History size={14} />
                History
              </button>
            </div>
          </div>

          {/* History panel */}
          {showHistory && (
            <div
              style={{
                marginBottom: "24px",
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--glass-border)",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground-muted)", marginTop: 0, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Recent Conversations
              </h3>
              {loadingHistory ? (
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>Loading...</p>
              ) : conversations.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>No conversations yet</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleLoadConversation(conv)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: conv.id === currentConversationId ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.03)",
                        border: conv.id === currentConversationId ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--glass-border)",
                        color: "var(--foreground)",
                        fontSize: "13px",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (conv.id !== currentConversationId) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (conv.id !== currentConversationId) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                        }
                      }}
                    >
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {conv.userMessage?.substring(0, 50)}...
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                        {new Date(conv.lastUpdated || conv.createdAt || 0).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
