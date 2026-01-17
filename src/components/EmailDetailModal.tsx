"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatEmailSender } from "@/lib/google-services";

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
  const [showHtml, setShowHtml] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (emailId) {
      fetchEmail();
    }
  }, [emailId]);

  const fetchEmail = async () => {
    if (!emailId) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (account) params.set("account", account);

      const response = await fetch(`/api/gmail/${emailId}?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch email");
      }
      const data = await response.json();
      setEmail(data.email);

      // Auto-mark as read
      if (data.email.isUnread) {
        await performAction("read");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email");
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string) => {
    if (!emailId) return;

    setActionLoading(action);
    try {
      const response = await fetch(`/api/gmail/${emailId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, account }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action}`);
      }

      // Update local state
      if (email) {
        switch (action) {
          case "read":
            setEmail({ ...email, isUnread: false });
            break;
          case "unread":
            setEmail({ ...email, isUnread: true });
            break;
          case "star":
            setEmail({ ...email, isStarred: true });
            break;
          case "unstar":
            setEmail({ ...email, isStarred: false });
            break;
          case "archive":
          case "trash":
            onEmailUpdated();
            onClose();
            return;
        }
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
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!emailId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "800px",
            maxHeight: "90vh",
            backgroundColor: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--glass-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Mail style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
              <span style={{ fontWeight: 600, fontSize: "16px", color: "var(--foreground)" }}>
                Email
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "none",
                cursor: "pointer",
                color: "var(--foreground-muted)",
              }}
            >
              <X style={{ width: "18px", height: "18px" }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
                <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              </div>
            )}

            {error && (
              <div style={{ textAlign: "center", padding: "40px", color: "#f87171" }}>
                {error}
              </div>
            )}

            {email && !loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Subject */}
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                  {email.subject}
                </h2>

                {/* From/To */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                      {formatEmailSender(email.from)}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                      {formatDate(email.date)}
                    </span>
                    {email.isStarred && (
                      <Star style={{ width: "14px", height: "14px", color: "#fbbf24", fill: "#fbbf24" }} />
                    )}
                  </div>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "var(--foreground-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    to {email.to.split(",")[0]}
                    {showDetails ? <ChevronUp style={{ width: "12px", height: "12px" }} /> : <ChevronDown style={{ width: "12px", height: "12px" }} />}
                  </button>

                  {showDetails && (
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)", paddingLeft: "8px" }}>
                      <div>From: {email.from}</div>
                      <div>To: {email.to}</div>
                      {email.cc && <div>Cc: {email.cc}</div>}
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {email.attachments.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {email.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          fontSize: "12px",
                          color: "var(--foreground-muted)",
                        }}
                      >
                        <Paperclip style={{ width: "12px", height: "12px" }} />
                        <span>{att.filename}</span>
                        <span>({formatFileSize(att.size)})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Toggle HTML/Text */}
                {email.bodyHtml && (
                  <button
                    onClick={() => setShowHtml(!showHtml)}
                    style={{
                      alignSelf: "flex-start",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      color: "var(--foreground-muted)",
                    }}
                  >
                    {showHtml ? "Show Plain Text" : "Show HTML"}
                  </button>
                )}

                {/* Body */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "var(--foreground)",
                  }}
                >
                  {showHtml && email.bodyHtml ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                      style={{ maxHeight: "400px", overflow: "auto" }}
                    />
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                      {email.body}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          {email && !loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderTop: "1px solid var(--glass-border)",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* Left actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => onReply(email)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  <Reply style={{ width: "14px", height: "14px" }} />
                  Reply
                </button>
                <button
                  onClick={() => onForward(email)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <Forward style={{ width: "14px", height: "14px" }} />
                  Forward
                </button>
              </div>

              {/* Right actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => performAction(email.isUnread ? "read" : "unread")}
                  disabled={actionLoading === "read" || actionLoading === "unread"}
                  title={email.isUnread ? "Mark as read" : "Mark as unread"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <MailOpen style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  onClick={() => performAction(email.isStarred ? "unstar" : "star")}
                  disabled={actionLoading === "star" || actionLoading === "unstar"}
                  title={email.isStarred ? "Unstar" : "Star"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: email.isStarred ? "#fbbf24" : "var(--foreground-muted)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Star style={{ width: "16px", height: "16px", fill: email.isStarred ? "#fbbf24" : "none" }} />
                </button>
                <button
                  onClick={() => performAction("archive")}
                  disabled={actionLoading === "archive"}
                  title="Archive"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Archive style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  onClick={() => performAction("trash")}
                  disabled={actionLoading === "trash"}
                  title="Delete"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "#f87171",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
