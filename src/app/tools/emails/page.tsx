"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { EmailPreview, formatEmailSender, getSuperhumanUrl } from "@/lib/google-services";

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  const checkConnectionAndFetch = async () => {
    try {
      const statusResponse = await fetch("/api/auth/google/status");
      const status = await statusResponse.json();
      setIsConnected(status.connected);

      if (status.connected) {
        fetchEmails();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gmail?limit=30");
      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch("/api/auth/google");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    if (isYesterday) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "var(--foreground-muted)",
              textDecoration: "none",
            }}
          >
            <ArrowLeft style={{ width: "20px", height: "20px" }} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Mail style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
              <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>Emails</h1>
            </div>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
              Your recent emails • Opens in Superhuman
            </p>
          </div>
          {isConnected && (
            <button
              onClick={fetchEmails}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "13px",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          )}
        </div>

        {/* Content */}
        <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
          {!isConnected ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Mail style={{ width: "48px", height: "48px", color: "var(--accent)", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Connect Gmail
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                View your recent emails and open them in Superhuman
              </p>
              <button
                onClick={handleConnect}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Connect Google
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
              <p>{error}</p>
              <button
                onClick={fetchEmails}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          ) : emails.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--foreground-muted)" }}>
              No emails found
            </div>
          ) : (
            <div>
              {emails.map((email, index) => (
                <a
                  key={email.id}
                  href={getSuperhumanUrl(email.threadId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "16px 20px",
                    borderBottom: index < emails.length - 1 ? "1px solid var(--glass-border)" : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                    borderLeft: email.isUnread ? "4px solid var(--accent)" : "4px solid transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: "14px",
                      color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)",
                      fontWeight: email.isUnread ? 600 : 400,
                    }}>
                      {formatEmailSender(email.from)}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                        {formatDate(email.date)}
                      </span>
                      <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: "15px",
                    color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)",
                    fontWeight: email.isUnread ? 500 : 400,
                  }}>
                    {email.subject}
                  </div>
                  <div style={{
                    fontSize: "13px",
                    color: "var(--foreground-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    opacity: 0.7,
                  }}>
                    {email.snippet}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
