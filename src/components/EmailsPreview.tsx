"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Loader2, ExternalLink, RefreshCw, Archive, Trash2 } from "lucide-react";
import { formatEmailSender } from "@/lib/google-services";

interface EmailWithAccount {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  accountEmail?: string;
  accountName?: string;
}

interface AccountInfo {
  email: string;
  name?: string;
  picture?: string;
}

interface EmailsPreviewProps {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
}

export function EmailsPreview({ isGoogleConnected, onConnectGoogle }: EmailsPreviewProps) {
  const [emails, setEmails] = useState<EmailWithAccount[]>([]);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isGoogleConnected) {
      fetchEmails();
    }
  }, [isGoogleConnected]);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from all accounts for merged view in widget
      const response = await fetch("/api/gmail?limit=10&all=true");
      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }
      const data = await response.json();
      setEmails(data.emails || []);
      setAccounts(data.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    await fetch("/api/auth/google/status", { method: "POST" });
    onConnectGoogle();
  };

  const handleEmailAction = async (
    e: React.MouseEvent,
    emailId: string,
    action: "archive" | "trash",
    accountEmail?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/gmail/${emailId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, account: accountEmail }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} email`);
      }

      // Remove the email from the list immediately
      setEmails((prev) => prev.filter((email) => email.id !== emailId));
    } catch (err) {
      console.error(`Error ${action}ing email:`, err);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header - clickable to navigate to full page */}
      <Link
        href="/tools/emails"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          borderBottom: "1px solid var(--glass-border)",
          textDecoration: "none",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <Mail style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", flex: 1 }}>
          Emails
        </span>
        <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
      </Link>

      {/* Content */}
      <div style={{ padding: "12px 16px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {!isGoogleConnected ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginBottom: "12px" }}>
              Connect Google to see your emails
            </p>
            <button
              onClick={onConnectGoogle}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Connect Google
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
            <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
            <button
              onClick={handleReconnect}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px" }} />
              Reconnect Google
            </button>
          </div>
        ) : emails.length === 0 ? (
          <div style={{ color: "var(--foreground-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            No recent emails found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {emails.map((email) => (
              <div
                key={email.id}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "stretch",
                  borderRadius: "6px",
                  transition: "background 0.15s",
                  borderLeft: email.isUnread ? "3px solid var(--accent)" : "3px solid transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Email Content - Navigate to internal email tool page */}
                <Link
                  href={`/tools/emails?emailId=${email.id}${email.accountEmail ? `&account=${encodeURIComponent(email.accountEmail)}` : ''}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    padding: "8px",
                    textDecoration: "none",
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: "12px",
                      color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)",
                      fontWeight: email.isUnread ? 600 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "70%",
                    }}>
                      {formatEmailSender(email.from)}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "13px",
                    color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)",
                    fontWeight: email.isUnread ? 500 : 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {email.subject}
                  </div>
                  {accounts.length > 1 && email.accountEmail && (
                    <div style={{
                      fontSize: "10px",
                      color: "var(--accent)",
                      opacity: 0.7,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {email.accountName || email.accountEmail}
                    </div>
                  )}
                </Link>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "0 8px",
                    opacity: 0.6,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                >
                  <button
                    onClick={(e) => handleEmailAction(e, email.id, "archive", email.accountEmail)}
                    title="Archive"
                    style={{
                      padding: "6px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Archive style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                  </button>
                  <button
                    onClick={(e) => handleEmailAction(e, email.id, "trash", email.accountEmail)}
                    title="Delete"
                    style={{
                      padding: "6px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Trash2 style={{ width: "14px", height: "14px", color: "#ef4444" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
