"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Loader2,
  Archive,
  Trash2,
  Star,
  MailOpen,
  Reply,
  Forward,
  Paperclip,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { formatEmailSender, getSuperhumanUrl } from "@/lib/google-services";

interface FullEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  date: string;
  snippet: string;
  body: string;
  bodyHtml?: string;
  isUnread: boolean;
  isStarred: boolean;
  labels: string[];
  attachments: { filename: string; mimeType: string; size: number; attachmentId: string }[];
  accountEmail?: string;
}

interface EmailDetailModalProps {
  emailId: string | null;
  account?: string;
  onClose: () => void;
  onReply: (email: FullEmail) => void;
  onForward: (email: FullEmail) => void;
  onEmailUpdated: () => void;
}

export function EmailDetailModal({
  emailId,
  account,
  onClose,
  onReply,
  onForward,
  onEmailUpdated,
}: EmailDetailModalProps) {
  const [email, setEmail] = useState<FullEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showHtml, setShowHtml] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (emailId) {
      // Clear previous email state before fetching new one
      setEmail(null);
      setError(null);
      fetchEmail();
    } else {
      // Clear state when modal is closed
      setEmail(null);
      setError(null);
    }
  }, [emailId]);

  // Automatically mark email as read when opened
  useEffect(() => {
    if (email && email.isUnread && email.accountEmail) {
      // Mark as read silently (don't show loading state)
      fetch(`/api/gmail/${email.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark-read",
          account: email.accountEmail,
        }),
      })
        .then((response) => {
          if (response.ok) {
            setEmail((prev) => (prev ? { ...prev, isUnread: false } : prev));
            onEmailUpdated(); // Update the email list to reflect read status
          }
        })
        .catch((err) => {
          console.error("Failed to mark email as read:", err);
        });
    }
  }, [email?.id, email?.isUnread, email?.accountEmail]);

  // Keyboard handler for Escape to close modal
  useEffect(() => {
    if (!emailId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emailId, onClose]);

  const fetchEmail = async () => {
    if (!emailId) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (account) params.set("account", account);

      const response = await fetch(`/api/gmail/${emailId}?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch email details");
      }
      // API returns { email, account } - extract the email object
      setEmail(data.email || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAction = async (action: "archive" | "trash" | "star" | "unstar" | "mark-read" | "mark-unread") => {
    if (!email || !email.accountEmail) return;

    setActionLoading(action);
    try {
      const response = await fetch(`/api/gmail/${email.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          account: email.accountEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} email`);
      }

      // After successful action, update state
      switch (action) {
        case "star":
          setEmail({ ...email, isStarred: true });
          break;
        case "unstar":
          setEmail({ ...email, isStarred: false });
          break;
        case "mark-read":
          setEmail({ ...email, isUnread: false });
          break;
        case "mark-unread":
          setEmail({ ...email, isUnread: true });
          break;
        case "archive":
        case "trash":
          onEmailUpdated();
          onClose();
          return;
      }

      onEmailUpdated();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const getAttachmentUrl = (attachmentId: string) => {
    if (!email || !email.accountEmail) return "#";
    return `/api/gmail/${email.id}/attachment/${attachmentId}?account=${encodeURIComponent(email.accountEmail)}`;
  };

  // Render email body - either HTML or plain text
  const renderEmailBody = () => {
    if (!email) return null;

    if (showHtml && email.bodyHtml) {
      return (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 0",
            color: "var(--foreground)",
            lineHeight: 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
        />
      );
    }

    return (
      <pre
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 0",
          color: "var(--foreground)",
          lineHeight: 1.6,
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
        }}
      >
        {email.body}
      </pre>
    );
  };

  return (
    <AnimatePresence>
      {emailId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              width: "90%",
              maxWidth: "900px",
              height: "80vh",
              margin: "auto",
              backgroundColor: "rgba(26, 26, 26, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Mail style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                  Email Details
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {email && email.accountEmail && (
                  <button
                    onClick={() => {
                      const url = getSuperhumanUrl(email.threadId);
                      window.open(url, "_blank", "noopener noreferrer");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <ExternalLink style={{ width: "14px", height: "14px" }} />
                    <span className="hidden sm:inline">Open in Gmail</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 100, 100, 0.1)",
                    border: "1px solid rgba(255, 100, 100, 0.2)",
                    color: "var(--foreground-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <X style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : error ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "16px" }}>
                <p style={{ color: "#f87171", fontSize: "16px" }}>{error}</p>
                <button
                  onClick={fetchEmail}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : !email ? (
              <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <p style={{ color: "var(--foreground-muted)", fontSize: "16px" }}>No email data</p>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Email Header */}
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--glass-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", margin: 0, flex: 1 }}>
                      {email.subject || "(No Subject)"}
                    </h3>
                    <span style={{ fontSize: "13px", color: "var(--foreground-muted)", whiteSpace: "nowrap" }}>
                      {formatDate(email.date)}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                        {formatEmailSender(email.from, false)}
                      </span>
                      {email.isUnread ? (
                        <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 500 }}>
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        to: {email.to}
                      </span>
                      {email.cc && (
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--foreground-muted)",
                            fontSize: "13px",
                          }}
                        >
                          {showDetails ? (
                            <ChevronUp style={{ width: "14px", height: "14px" }} />
                          ) : (
                            <ChevronDown style={{ width: "14px", height: "14px" }} />
                          )}
                          details
                        </button>
                      )}
                    </div>
                    {showDetails && email.cc && (
                      <div style={{ marginTop: "4px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        <div>CC: {email.cc}</div>
                        {email.bcc && <div>BCC: {email.bcc}</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div
                  style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--glass-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => handleEmailAction(email.isUnread ? "mark-read" : "mark-unread")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: email.isUnread ? "rgba(100, 255, 100, 0.1)" : "rgba(255, 255, 255, 0.05)",
                      border: email.isUnread ? "1px solid rgba(100, 255, 100, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: actionLoading === (email.isUnread ? "mark-read" : "mark-unread") ? 0.5 : 1,
                    }}
                  >
                    {actionLoading === (email.isUnread ? "mark-read" : "mark-unread") ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <MailOpen style={{ width: "14px", height: "14px" }} />
                    )}
                    <span className="hidden sm:inline">
                      {email.isUnread ? "Mark Read" : "Mark Unread"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleEmailAction(email.isStarred ? "unstar" : "star")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: email.isStarred ? "rgba(255, 215, 0, 0.1)" : "rgba(255, 255, 255, 0.05)",
                      border: email.isStarred ? "1px solid rgba(255, 215, 0, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: email.isStarred ? "var(--foreground)" : "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: actionLoading === (email.isStarred ? "unstar" : "star") ? 0.5 : 1,
                    }}
                  >
                    {actionLoading === (email.isStarred ? "unstar" : "star") ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Star style={{ width: "14px", height: "14px", fill: email.isStarred ? "var(--foreground)" : "none" }} />
                    )}
                    <span className="hidden sm:inline">{email.isStarred ? "Unstar" : "Star"}</span>
                  </button>

                  <button
                    onClick={() => handleEmailAction("archive")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: actionLoading === "archive" ? 0.5 : 1,
                    }}
                  >
                    {actionLoading === "archive" ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Archive style={{ width: "14px", height: "14px" }} />
                    )}
                    <span className="hidden sm:inline">Archive</span>
                  </button>

                  <button
                    onClick={() => handleEmailAction("trash")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 100, 100, 0.1)",
                      border: "1px solid rgba(255, 100, 100, 0.2)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: actionLoading === "trash" ? 0.5 : 1,
                    }}
                  >
                    {actionLoading === "trash" ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Trash2 style={{ width: "14px", height: "14px" }} />
                    )}
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  <div style={{ flex: 1 }} />

                  <button
                    onClick={() => {
                      onReply(email);
                      onClose();
                    }}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <Reply style={{ width: "14px", height: "14px" }} />
                    <span className="hidden sm:inline">Reply</span>
                  </button>

                  <button
                    onClick={() => {
                      onForward(email);
                      onClose();
                    }}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <Forward style={{ width: "14px", height: "14px" }} />
                    <span className="hidden sm:inline">Forward</span>
                  </button>
                </div>

                {/* Email Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                  {renderEmailBody()}
                </div>

                {/* Attachments if any */}
                {email && email.attachments && email.attachments.length > 0 && (
                  <div
                    style={{
                      padding: "12px 20px",
                      borderTop: "1px solid var(--glass-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                      Attachments ({email.attachments.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      {email.attachments.map((attachment) => (
                        <div
                          key={attachment.attachmentId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--glass-border)",
                          }}
                        >
                          <Paperclip style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "13px", color: "var(--foreground)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {attachment.filename}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                              {formatFileSize(attachment.size)}
                            </span>
                          </div>
                          <Link
                            href={getAttachmentUrl(attachment.attachmentId)}
                            target="_blank"
                            download={attachment.filename}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              color: "var(--accent)",
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink style={{ width: "14px", height: "14px", marginLeft: "8px" }} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
