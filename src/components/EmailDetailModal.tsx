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
  Code,
  FileText,
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
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    if (email && email.isUnread) {
      // Mark as read silently (don't show loading state)
      // If no accountEmail, API will use primary/first account
      fetch(`/api/gmail/${email.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark-read",
          ...(email.accountEmail && { account: email.accountEmail }),
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
      // API returns { email, account } - extract the email object and merge accountEmail
      // Note: "unknown" is returned for legacy single-account tokens, treat as undefined
      const emailData = data.email || data;
      const resolvedAccount = (data.account && data.account !== "unknown") ? data.account :
                              (emailData.accountEmail && emailData.accountEmail !== "unknown") ? emailData.accountEmail :
                              account;
      setEmail({ ...emailData, accountEmail: resolvedAccount });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAction = async (action: "archive" | "trash" | "star" | "unstar" | "mark-read" | "mark-unread") => {
    if (!email) return;

    setActionLoading(action);
    try {
      const response = await fetch(`/api/gmail/${email.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ...(email.accountEmail && { account: email.accountEmail }),
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
    if (!email) return "#";
    const url = `/api/gmail/${email.id}/attachment/${attachmentId}`;
    return email.accountEmail ? `${url}?account=${encodeURIComponent(email.accountEmail)}` : url;
  };

  // Render email body - either HTML or plain text
  const renderEmailBody = () => {
    if (!email) return null;

    // HTML emails keep white background to preserve original styling
    if (showHtml && email.bodyHtml) {
      return (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "20px",
            color: "#1a1a1a",
            lineHeight: 1.6,
            fontSize: "14px",
          }}
          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
        />
      );
    }

    // Plain text emails follow app theme
    return (
      <pre
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderRadius: "8px",
          padding: "20px",
          color: "var(--foreground)",
          lineHeight: 1.6,
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
          fontSize: "14px",
          border: "1px solid var(--glass-border)",
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
            backgroundColor: isMobile ? "var(--background)" : "rgba(0, 0, 0, 0.7)",
            backdropFilter: isMobile ? "none" : "blur(5px)",
            zIndex: 999,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: isMobile ? "0" : "5vh",
          }}
          onClick={isMobile ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: isMobile ? 1 : 0.95, y: isMobile ? 20 : 0 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: isMobile ? 1 : 0.95, y: isMobile ? 20 : 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              width: isMobile ? "100%" : "94%",
              maxWidth: isMobile ? "none" : "1100px",
              height: isMobile ? "100%" : "85vh",
              backgroundColor: isMobile ? "var(--background)" : "rgba(26, 26, 26, 0.95)",
              backdropFilter: isMobile ? "none" : "blur(20px)",
              border: isMobile ? "none" : "1px solid var(--glass-border)",
              borderRadius: isMobile ? "0" : "16px",
              boxShadow: isMobile ? "none" : "0 8px 32px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: isMobile ? "12px 16px" : "16px 20px",
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              {/* Back button on left for mobile */}
              {isMobile && (
                <button
                  onClick={onClose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--foreground)",
                    cursor: "pointer",
                    fontSize: "14px",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  <X style={{ width: "18px", height: "18px" }} />
                  Back
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", flex: 1, minWidth: 0 }}>
                <Mail style={{ width: isMobile ? "18px" : "20px", height: isMobile ? "18px" : "20px", color: "var(--accent)", flexShrink: 0 }} />
                <h2 style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 600, color: "var(--foreground)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isMobile ? "Email" : "Email Details"}
                </h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", flexShrink: 0 }}>
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
                      padding: isMobile ? "10px 12px" : "6px 10px",
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
                    {!isMobile && <span>Open in Superhuman</span>}
                  </button>
                )}
                {!isMobile && (
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
                )}
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
                    padding: isMobile ? "14px 16px" : "16px 20px",
                    borderBottom: "1px solid var(--glass-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "6px" : "16px" }}>
                    <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: "var(--foreground)", margin: 0, flex: 1, lineHeight: 1.4 }}>
                      {email.subject || "(No Subject)"}
                    </h3>
                    <span style={{ fontSize: isMobile ? "12px" : "13px", color: "var(--foreground-muted)", whiteSpace: "nowrap" }}>
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
                    padding: isMobile ? "10px 16px" : "12px 20px",
                    borderBottom: "1px solid var(--glass-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "8px" : "12px",
                    flexShrink: 0,
                    overflowX: isMobile ? "auto" : "visible",
                    flexWrap: isMobile ? "nowrap" : "wrap",
                  }}
                >
                  <button
                    onClick={() => handleEmailAction(email.isUnread ? "mark-read" : "mark-unread")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: isMobile ? "10px 12px" : "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: email.isUnread ? "rgba(100, 255, 100, 0.1)" : "rgba(255, 255, 255, 0.05)",
                      border: email.isUnread ? "1px solid rgba(100, 255, 100, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: actionLoading === (email.isUnread ? "mark-read" : "mark-unread") ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {actionLoading === (email.isUnread ? "mark-read" : "mark-unread") ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <MailOpen style={{ width: "14px", height: "14px" }} />
                    )}
                    {!isMobile && <span>{email.isUnread ? "Mark Read" : "Mark Unread"}</span>}
                  </button>

                  <button
                    onClick={() => handleEmailAction(email.isStarred ? "unstar" : "star")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: isMobile ? "10px 12px" : "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: email.isStarred ? "rgba(255, 215, 0, 0.1)" : "rgba(255, 255, 255, 0.05)",
                      border: email.isStarred ? "1px solid rgba(255, 215, 0, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: email.isStarred ? "var(--foreground)" : "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: actionLoading === (email.isStarred ? "unstar" : "star") ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {actionLoading === (email.isStarred ? "unstar" : "star") ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Star style={{ width: "14px", height: "14px", fill: email.isStarred ? "var(--foreground)" : "none" }} />
                    )}
                    {!isMobile && <span>{email.isStarred ? "Unstar" : "Star"}</span>}
                  </button>

                  <button
                    onClick={() => handleEmailAction("archive")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: isMobile ? "10px 12px" : "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: actionLoading === "archive" ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {actionLoading === "archive" ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Archive style={{ width: "14px", height: "14px" }} />
                    )}
                    {!isMobile && <span>Archive</span>}
                  </button>

                  <button
                    onClick={() => handleEmailAction("trash")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: isMobile ? "10px 12px" : "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 100, 100, 0.1)",
                      border: "1px solid rgba(255, 100, 100, 0.2)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      opacity: actionLoading === "trash" ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {actionLoading === "trash" ? (
                      <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Trash2 style={{ width: "14px", height: "14px" }} />
                    )}
                    {!isMobile && <span>Delete</span>}
                  </button>

                  <div style={{ flex: 1, minWidth: isMobile ? "8px" : "auto" }} />

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
                      padding: isMobile ? "10px 12px" : "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <Reply style={{ width: "14px", height: "14px" }} />
                    {!isMobile && <span>Reply</span>}
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
                      padding: isMobile ? "10px 12px" : "6px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--foreground-muted)",
                      fontSize: "13px",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <Forward style={{ width: "14px", height: "14px" }} />
                    {!isMobile && <span>Forward</span>}
                  </button>
                </div>

                {/* Email Body */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: isMobile ? "0 16px 16px" : "0 20px 16px" }}>
                  {/* HTML/Text Toggle */}
                  {email.bodyHtml && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px", flexShrink: 0 }}>
                      <button
                        onClick={() => setShowHtml(!showHtml)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "var(--foreground-muted)",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {showHtml ? (
                          <>
                            <FileText style={{ width: "14px", height: "14px" }} />
                            Show Plain Text
                          </>
                        ) : (
                          <>
                            <Code style={{ width: "14px", height: "14px" }} />
                            Show HTML
                          </>
                        )}
                      </button>
                    </div>
                  )}
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
