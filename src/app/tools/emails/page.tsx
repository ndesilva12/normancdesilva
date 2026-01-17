"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, RefreshCw, ChevronDown, UserPlus, X, Users, Plus, ExternalLink, Trash2 } from "lucide-react";
import { formatEmailSender, getSuperhumanUrl } from "@/lib/google-services";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { EmailDetailModal } from "@/components/EmailDetailModal";
import { ComposeEmailModal } from "@/components/ComposeEmailModal";

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

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailWithAccount[]>([]);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Email detail and compose modal state
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmailAccount, setSelectedEmailAccount] = useState<string | undefined>(undefined);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"compose" | "reply" | "forward">("compose");
  const [replyToEmail, setReplyToEmail] = useState<any>(null);

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchEmails();
    }
  }, [selectedAccount, isConnected]);

  const checkConnectionAndFetch = async () => {
    try {
      // Check accounts endpoint first
      const accountsResponse = await fetch("/api/auth/google/accounts");
      const accountsData = await accountsResponse.json();

      if (accountsData.connected && accountsData.accounts.length > 0) {
        setIsConnected(true);
        setAccounts(accountsData.accounts);
        // Default to "all" for merged view
        setSelectedAccount("all");
      } else {
        // Fallback to status check
        const statusResponse = await fetch("/api/auth/google/status");
        const status = await statusResponse.json();
        setIsConnected(status.connected);
        if (!status.connected) {
          setLoading(false);
        }
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (selectedAccount === "all") {
        params.set("all", "true");
      } else {
        params.set("account", selectedAccount);
      }

      const response = await fetch(`/api/gmail?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }
      const data = await response.json();
      setEmails(data.emails || []);
      if (data.accounts) {
        setAccounts(data.accounts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const returnUrl = encodeURIComponent("/tools/emails");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleAddAccount = async () => {
    try {
      const returnUrl = encodeURIComponent("/tools/emails");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}&addAccount=true`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to add account:", err);
    }
  };

  const handleRemoveAccount = async (email: string) => {
    if (!confirm(`Remove ${email} from connected accounts?`)) return;

    try {
      const response = await fetch(`/api/auth/google/accounts?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        if (data.remainingAccounts === 0) {
          setIsConnected(false);
          setAccounts([]);
          setEmails([]);
        } else {
          setAccounts((prev) => prev.filter((a) => a.email !== email));
          if (selectedAccount === email) {
            setSelectedAccount("all");
          }
        }
      }
    } catch (err) {
      console.error("Failed to remove account:", err);
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

  const handleEmailClick = (email: EmailWithAccount) => {
    setSelectedEmailId(email.id);
    setSelectedEmailAccount(email.accountEmail || (selectedAccount !== "all" ? selectedAccount : undefined));
  };

  const handleReply = (email: any) => {
    setReplyToEmail(email);
    setComposeMode("reply");
    setComposeOpen(true);
    setSelectedEmailId(null);
  };

  const handleForward = (email: any) => {
    setReplyToEmail(email);
    setComposeMode("forward");
    setComposeOpen(true);
    setSelectedEmailId(null);
  };

  const handleCompose = () => {
    setReplyToEmail(null);
    setComposeMode("compose");
    setComposeOpen(true);
  };

  const handleEmailUpdated = () => {
    fetchEmails();
  };

  const handleEmailSent = () => {
    fetchEmails();
  };

  const handleDeleteEmail = async (e: React.MouseEvent, email: EmailWithAccount) => {
    e.stopPropagation();
    if (!confirm("Move this email to trash?")) return;

    try {
      const response = await fetch(`/api/gmail/${email.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trash",
          account: email.accountEmail || (selectedAccount !== "all" ? selectedAccount : undefined),
        }),
      });

      if (response.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== email.id));
      }
    } catch (err) {
      console.error("Failed to delete email:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />
      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
          <RemindersBanner />
          {/* Page Header */}
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
                Read, compose, and manage your emails
              </p>
            </div>
            {isConnected && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Account Selector */}
                {accounts.length > 0 && (
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowAccountMenu(!showAccountMenu)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        color: "var(--foreground)",
                        border: "1px solid var(--glass-border)",
                        cursor: "pointer",
                        fontSize: "13px",
                        minWidth: "140px",
                      }}
                    >
                      {selectedAccount === "all" ? (
                        <>
                          <Users style={{ width: "14px", height: "14px", color: "var(--accent)" }} />
                          <span>All Accounts</span>
                        </>
                      ) : (
                        <>
                          <Mail style={{ width: "14px", height: "14px" }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
                            {accounts.find(a => a.email === selectedAccount)?.name || selectedAccount}
                          </span>
                        </>
                      )}
                      <ChevronDown style={{ width: "14px", height: "14px", marginLeft: "auto" }} />
                    </button>

                    {showAccountMenu && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          marginTop: "4px",
                          backgroundColor: "var(--glass-bg)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "8px",
                          padding: "4px",
                          minWidth: "220px",
                          zIndex: 50,
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        {/* All Accounts option */}
                        <button
                          onClick={() => {
                            setSelectedAccount("all");
                            setShowAccountMenu(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            backgroundColor: selectedAccount === "all" ? "rgba(0, 212, 255, 0.1)" : "transparent",
                            color: "var(--foreground)",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            textAlign: "left",
                          }}
                        >
                          <Users style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
                          <span style={{ flex: 1 }}>All Accounts</span>
                          {selectedAccount === "all" && (
                            <span style={{ color: "var(--accent)", fontSize: "12px" }}>✓</span>
                          )}
                        </button>

                        <div style={{ height: "1px", backgroundColor: "var(--glass-border)", margin: "4px 0" }} />

                        {/* Individual accounts */}
                        {accounts.map((account) => (
                          <div
                            key={account.email}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              backgroundColor: selectedAccount === account.email ? "rgba(0, 212, 255, 0.1)" : "transparent",
                            }}
                          >
                            <button
                              onClick={() => {
                                setSelectedAccount(account.email);
                                setShowAccountMenu(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flex: 1,
                                padding: "4px 0",
                                backgroundColor: "transparent",
                                color: "var(--foreground)",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                textAlign: "left",
                              }}
                            >
                              {account.picture ? (
                                <img
                                  src={account.picture}
                                  alt=""
                                  style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                                />
                              ) : (
                                <Mail style={{ width: "16px", height: "16px" }} />
                              )}
                              <div style={{ flex: 1, overflow: "hidden" }}>
                                <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {account.name || account.email.split("@")[0]}
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--foreground-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {account.email}
                                </div>
                              </div>
                              {selectedAccount === account.email && (
                                <span style={{ color: "var(--accent)", fontSize: "12px" }}>✓</span>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAccount(account.email);
                              }}
                              style={{
                                padding: "4px",
                                backgroundColor: "transparent",
                                color: "var(--foreground-muted)",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Remove account"
                            >
                              <X style={{ width: "14px", height: "14px" }} />
                            </button>
                          </div>
                        ))}

                        <div style={{ height: "1px", backgroundColor: "var(--glass-border)", margin: "4px 0" }} />

                        {/* Add account button */}
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            handleAddAccount();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            backgroundColor: "transparent",
                            color: "var(--accent)",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            textAlign: "left",
                          }}
                        >
                          <UserPlus style={{ width: "16px", height: "16px" }} />
                          <span>Add Another Account</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => fetchEmails()}
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
                <button
                  onClick={handleCompose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  <Plus style={{ width: "14px", height: "14px" }} />
                  Compose
                </button>
              </div>
            )}
          </div>

          {/* Close account menu when clicking outside */}
          {showAccountMenu && (
            <div
              style={{ position: "fixed", inset: 0, zIndex: 40 }}
              onClick={() => setShowAccountMenu(false)}
            />
          )}

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
                <button
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "16px 20px",
                    borderBottom: index < emails.length - 1 ? "1px solid var(--glass-border)" : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                    borderLeft: email.isUnread ? "4px solid var(--accent)" : "4px solid transparent",
                    width: "100%",
                    textAlign: "left",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottomStyle: index < emails.length - 1 ? "solid" : "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: "14px",
                        color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)",
                        fontWeight: email.isUnread ? 600 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {formatEmailSender(email.from)}
                      </span>
                      {selectedAccount === "all" && accounts.length > 1 && email.accountEmail && (
                        <span style={{
                          fontSize: "11px",
                          color: "var(--accent)",
                          backgroundColor: "rgba(0, 212, 255, 0.1)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}>
                          {email.accountName || email.accountEmail.split("@")[0]}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                        {formatDate(email.date)}
                      </span>
                      <a
                        href={getSuperhumanUrl(email.threadId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          color: "var(--foreground-muted)",
                          transition: "all 0.15s",
                        }}
                        title="Open in Superhuman"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                          e.currentTarget.style.color = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.color = "var(--foreground-muted)";
                        }}
                      >
                        <ExternalLink style={{ width: "12px", height: "12px" }} />
                      </a>
                      <button
                        onClick={(e) => handleDeleteEmail(e, email)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          color: "var(--foreground-muted)",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        title="Delete"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.15)";
                          e.currentTarget.style.color = "#f87171";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.color = "var(--foreground-muted)";
                        }}
                      >
                        <Trash2 style={{ width: "12px", height: "12px" }} />
                      </button>
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
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </main>

      {/* Email Detail Modal */}
      <EmailDetailModal
        emailId={selectedEmailId}
        account={selectedEmailAccount}
        onClose={() => setSelectedEmailId(null)}
        onReply={handleReply}
        onForward={handleForward}
        onEmailUpdated={handleEmailUpdated}
      />

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={handleEmailSent}
        mode={composeMode}
        replyTo={replyToEmail}
        account={selectedAccount !== "all" ? selectedAccount : undefined}
        accounts={accounts}
      />

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
