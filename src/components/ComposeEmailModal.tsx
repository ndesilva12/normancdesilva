"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
  mode: "compose" | "reply" | "forward";
  replyTo?: {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    date: string;
  };
  account?: string;
  accounts?: { email: string; name?: string }[];
  initialTo?: string; // Pre-fill recipient for compose mode
}

export function ComposeEmailModal({
  isOpen,
  onClose,
  onSent,
  mode,
  replyTo,
  account,
  accounts = [],
  initialTo,
}: ComposeEmailModalProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(account || "");

  useEffect(() => {
    if (isOpen && replyTo) {
      if (mode === "reply") {
        // Extract email from "Name <email>" format
        const fromMatch = replyTo.from.match(/<(.+)>/);
        const replyToEmail = fromMatch ? fromMatch[1] : replyTo.from;
        setTo(replyToEmail);
        setSubject(replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`);
        setBody(`\n\n---\nOn ${formatDate(replyTo.date)}, ${replyTo.from} wrote:\n> ${replyTo.body.split("\n").join("\n> ")}`);
      } else if (mode === "forward") {
        setTo("");
        setSubject(replyTo.subject.startsWith("Fwd:") ? replyTo.subject : `Fwd: ${replyTo.subject}`);
        setBody(`\n\n---\nForwarded message:\nFrom: ${replyTo.from}\nDate: ${formatDate(replyTo.date)}\nSubject: ${replyTo.subject}\nTo: ${replyTo.to}\n\n${replyTo.body}`);
      }
    } else if (isOpen && mode === "compose") {
      setTo(initialTo || "");
      setCc("");
      setBcc("");
      setSubject("");
      setBody("");
    }
  }, [isOpen, mode, replyTo, initialTo]);

  useEffect(() => {
    if (account) {
      setSelectedAccount(account);
    } else if (accounts.length > 0) {
      setSelectedAccount(accounts[0].email);
    }
  }, [account, accounts]);

  // Keyboard handler for Escape to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, sending, onClose]);

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

  const handleSend = async () => {
    if (!to.trim()) {
      setError("Recipient is required");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!body.trim()) {
      setError("Message body is required");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const payload: any = {
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        account: selectedAccount || undefined,
      };

      if (cc.trim()) payload.cc = cc.trim();
      if (bcc.trim()) payload.bcc = bcc.trim();

      // For replies, include thread info
      if (mode === "reply" && replyTo) {
        payload.replyToMessageId = replyTo.id;
        payload.threadId = replyTo.threadId;
      }

      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      onSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "reply":
        return "Reply";
      case "forward":
        return "Forward";
      default:
        return "New Email";
    }
  };

  if (!isOpen) return null;

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
            maxWidth: "700px",
            maxHeight: "90vh",
            backgroundColor: "rgba(20, 20, 25, 0.95)",
            border: "1px solid var(--glass-border)",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(20px)",
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
              <Send style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
              <span style={{ fontWeight: 600, fontSize: "16px", color: "var(--foreground)" }}>
                {getTitle()}
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

          {/* Form */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Account selector */}
            {accounts.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ fontSize: "13px", color: "var(--foreground-muted)", minWidth: "50px" }}>From:</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  {accounts.map((acc) => (
                    <option key={acc.email} value={acc.email}>
                      {acc.name ? `${acc.name} <${acc.email}>` : acc.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* To field */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", color: "var(--foreground-muted)", minWidth: "50px" }}>To:</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                onClick={() => setShowCcBcc(!showCcBcc)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--foreground-muted)",
                }}
              >
                Cc/Bcc
                {showCcBcc ? <ChevronUp style={{ width: "12px", height: "12px" }} /> : <ChevronDown style={{ width: "12px", height: "12px" }} />}
              </button>
            </div>

            {/* Cc/Bcc fields */}
            {showCcBcc && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "13px", color: "var(--foreground-muted)", minWidth: "50px" }}>Cc:</label>
                  <input
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "13px", color: "var(--foreground-muted)", minWidth: "50px" }}>Bcc:</label>
                  <input
                    type="email"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              </>
            )}

            {/* Subject field */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", color: "var(--foreground-muted)", minWidth: "50px" }}>Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {/* Body field */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              style={{
                flex: 1,
                minHeight: "200px",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                color: "var(--foreground)",
                fontSize: "14px",
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />

            {/* Error message */}
            {error && (
              <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "rgba(248, 113, 113, 0.1)", color: "#f87171", fontSize: "13px" }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderTop: "1px solid var(--glass-border)",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 20px",
                borderRadius: "8px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                cursor: sending ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: 500,
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? (
                <>
                  <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                  Sending...
                </>
              ) : (
                <>
                  <Send style={{ width: "14px", height: "14px" }} />
                  Send
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
