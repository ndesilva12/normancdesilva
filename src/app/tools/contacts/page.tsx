"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, Search, Mail, Calendar, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { GoogleContact } from "@/lib/google-services";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface EmailInteraction {
  date: string;
  subject: string;
  snippet: string;
  from: string;
  to: string;
  isInbound: boolean;
}

interface CalendarInteraction {
  date: string;
  title: string;
  time: string;
  isPast: boolean;
}

interface ContactWithInteractions extends GoogleContact {
  emails?: EmailInteraction[];
  meetings?: CalendarInteraction[];
  summary?: string;
  lastInteraction?: Date;
  interactionCount?: number;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithInteractions[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  const checkConnectionAndFetch = async () => {
    try {
      const statusResponse = await fetch("/api/auth/google/status");
      const status = await statusResponse.json();
      setIsConnected(status.connected);

      if (status.connected) {
        fetchContactsWithInteractions();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchContactsWithInteractions = async (query?: string) => {
    setSyncing(true);
    setError(null);
    try {
      // First get contacts
      const url = query
        ? `/api/contacts?limit=100&q=${encodeURIComponent(query)}`
        : "/api/contacts?limit=100";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch contacts");
      
      const data = await response.json();
      const contactsList = data.contacts || [];

      // Then fetch interactions for each contact
      const contactsWithData = await Promise.all(
        contactsList.map(async (contact: GoogleContact) => {
          const email = contact.emailAddresses?.[0]?.value;
          if (!email) return { ...contact, emails: [], meetings: [], summary: "", interactionCount: 0 };

          try {
            // Fetch emails and meetings in parallel
            const [emailsRes, meetingsRes] = await Promise.all([
              fetch(`/api/relationship-intel/contacts/${encodeURIComponent(email)}/interactions`).catch(() => null),
              fetch(`/api/relationship-intel/contacts/${encodeURIComponent(email)}/meetings`).catch(() => null),
            ]);

            const emails = emailsRes?.ok ? (await emailsRes.json()).interactions || [] : [];
            const meetings = meetingsRes?.ok ? (await meetingsRes.json()).meetings || [] : [];

            // Calculate last interaction
            const allDates = [
              ...emails.map((e: EmailInteraction) => new Date(e.date)),
              ...meetings.filter((m: CalendarInteraction) => m.isPast).map((m: CalendarInteraction) => new Date(m.date)),
            ];
            const lastInteraction = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : undefined;

            return {
              ...contact,
              emails,
              meetings,
              lastInteraction,
              interactionCount: emails.length + meetings.filter((m: CalendarInteraction) => m.isPast).length,
            };
          } catch {
            return { ...contact, emails: [], meetings: [], interactionCount: 0 };
          }
        })
      );

      // Sort by last interaction (most recent first)
      contactsWithData.sort((a, b) => {
        if (!a.lastInteraction && !b.lastInteraction) return 0;
        if (!a.lastInteraction) return 1;
        if (!b.lastInteraction) return -1;
        return b.lastInteraction.getTime() - a.lastInteraction.getTime();
      });

      setContacts(contactsWithData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleConnect = async () => {
    try {
      const returnUrl = encodeURIComponent("/tools/contacts");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}`);
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContactsWithInteractions(searchQuery);
  };

  const toggleExpand = (resourceName: string) => {
    setExpandedContact(expandedContact === resourceName ? null : resourceName);
  };

  const getContactName = (contact: GoogleContact): string => {
    return contact.names?.[0]?.displayName || contact.emailAddresses?.[0]?.value || "Unknown";
  };

  const getContactEmail = (contact: GoogleContact): string | undefined => {
    return contact.emailAddresses?.[0]?.value;
  };

  const getContactOrg = (contact: GoogleContact): string | undefined => {
    const org = contact.organizations?.[0];
    if (org?.name && org?.title) return `${org.title} at ${org.name}`;
    return org?.name || org?.title;
  };

  const getInitials = (name: string): string => {
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const getStatusColor = (contact: ContactWithInteractions): string => {
    if (!contact.lastInteraction) return "#64748b"; // gray
    const daysSince = (new Date().getTime() - contact.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) return "#10b981"; // green
    if (daysSince <= 30) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  const filteredContacts = contacts.filter(contact => {
    if (filterStatus === "active" && (!contact.lastInteraction || (new Date().getTime() - contact.lastInteraction.getTime()) / (1000 * 60 * 60 * 24) > 7)) return false;
    if (filterStatus === "warm" && (!contact.lastInteraction || (new Date().getTime() - contact.lastInteraction.getTime()) / (1000 * 60 * 60 * 24) <= 7 || (new Date().getTime() - contact.lastInteraction.getTime()) / (1000 * 60 * 60 * 24) > 30)) return false;
    if (filterStatus === "cold" && contact.lastInteraction && (new Date().getTime() - contact.lastInteraction.getTime()) / (1000 * 60 * 60 * 24) <= 30) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0a0a0a", width: "100%" }}>
      <Header />
      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1400px", width: "90%", margin: "0 auto", padding: "32px 20px" }}>
          <RemindersBanner />
          
          {/* Back Link */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 0",
              color: "#71717a",
              textDecoration: "none",
              fontSize: "14px",
              marginBottom: "24px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#a1a1aa"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#71717a"}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Dashboard
          </Link>

          {/* Page Header */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#fafafa", marginBottom: "8px", letterSpacing: "-0.02em" }}>
              Relationship Intelligence
            </h1>
            <p style={{ fontSize: "16px", color: "#71717a" }}>
              Complete interaction history with your network
            </p>
          </div>

          {/* Toolbar */}
          {isConnected && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
              <form onSubmit={handleSearch} style={{ flex: 1, minWidth: "300px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "12px",
                  padding: "12px 16px",
                }}>
                  <Search style={{ width: "18px", height: "18px", color: "#71717a" }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "14px",
                      color: "#fafafa",
                    }}
                  />
                </div>
              </form>

              <div style={{ display: "flex", gap: "8px" }}>
                {["all", "active", "warm", "cold"].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "12px",
                      background: filterStatus === status ? "#3b82f6" : "#18181b",
                      color: filterStatus === status ? "#fafafa" : "#71717a",
                      border: "1px solid",
                      borderColor: filterStatus === status ? "#3b82f6" : "#27272a",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textTransform: "capitalize",
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchContactsWithInteractions()}
                disabled={syncing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  background: "#18181b",
                  color: "#71717a",
                  border: "1px solid #27272a",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: syncing ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                <RefreshCw style={{ width: "16px", height: "16px", animation: syncing ? "spin 1s linear infinite" : "none" }} />
                Sync
              </button>
            </div>
          )}

          {/* Content */}
          {!isConnected ? (
            <div style={{ 
              textAlign: "center", 
              padding: "80px 40px", 
              background: "#18181b", 
              border: "1px solid #27272a", 
              borderRadius: "16px" 
            }}>
              <Sparkles style={{ width: "56px", height: "56px", color: "#3b82f6", margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#fafafa", marginBottom: "12px" }}>
                Connect Your Google Account
              </h2>
              <p style={{ color: "#71717a", fontSize: "15px", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
                Unlock relationship intelligence by connecting Gmail, Contacts, and Calendar
              </p>
              <button
                onClick={handleConnect}
                style={{
                  padding: "14px 32px",
                  borderRadius: "12px",
                  background: "#3b82f6",
                  color: "#fafafa",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Connect Google
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px" }}>
              <Loader2 style={{ width: "40px", height: "40px", color: "#3b82f6", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px 40px", 
              background: "#18181b", 
              border: "1px solid #27272a", 
              borderRadius: "16px",
              color: "#ef4444" 
            }}>
              <p style={{ marginBottom: "16px" }}>{error}</p>
              <button
                onClick={() => fetchContactsWithInteractions()}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: "#27272a",
                  color: "#fafafa",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "60px 40px", 
              background: "#18181b", 
              border: "1px solid #27272a", 
              borderRadius: "16px",
              color: "#71717a" 
            }}>
              No contacts found
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredContacts.map((contact) => {
                const name = getContactName(contact);
                const email = getContactEmail(contact);
                const org = getContactOrg(contact);
                const isExpanded = expandedContact === contact.resourceName;
                const statusColor = getStatusColor(contact);

                return (
                  <div
                    key={contact.resourceName}
                    style={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "16px",
                      overflow: "hidden",
                      transition: "all 0.2s",
                    }}
                  >
                    {/* Contact Header */}
                    <div
                      onClick={() => toggleExpand(contact.resourceName)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "20px 24px",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#27272a"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#fafafa",
                        flexShrink: 0,
                      }}>
                        {getInitials(name)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                          <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#fafafa", margin: 0 }}>
                            {name}
                          </h3>
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: statusColor,
                          }} />
                        </div>
                        {org && (
                          <p style={{ fontSize: "14px", color: "#71717a", margin: "0 0 8px 0" }}>
                            {org}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#a1a1aa" }}>
                          {email && (
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Mail style={{ width: "14px", height: "14px" }} />
                              {email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "24px", fontWeight: 700, color: "#fafafa" }}>
                            {contact.interactionCount || 0}
                          </div>
                          <div style={{ fontSize: "12px", color: "#71717a" }}>interactions</div>
                        </div>
                        {contact.lastInteraction && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa" }}>
                              {getRelativeTime(contact.lastInteraction)}
                            </div>
                            <div style={{ fontSize: "12px", color: "#71717a" }}>last contact</div>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp style={{ width: "20px", height: "20px", color: "#71717a", flexShrink: 0 }} />
                        ) : (
                          <ChevronDown style={{ width: "20px", height: "20px", color: "#71717a", flexShrink: 0 }} />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{
                        padding: "0 24px 24px 24px",
                        borderTop: "1px solid #27272a",
                      }}>
                        {/* Emails Section */}
                        {contact.emails && contact.emails.length > 0 && (
                          <div style={{ marginTop: "24px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#a1a1aa", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Email History ({contact.emails.length})
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {contact.emails.slice(0, 10).map((email, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: "16px",
                                    background: "#0a0a0a",
                                    borderRadius: "12px",
                                    border: "1px solid #27272a",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      color: email.isInbound ? "#10b981" : "#3b82f6",
                                    }}>
                                      {email.isInbound ? "← Received" : "→ Sent"}
                                    </span>
                                    <span style={{ fontSize: "13px", color: "#71717a" }}>
                                      {new Date(email.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "15px", fontWeight: 500, color: "#fafafa", marginBottom: "6px" }}>
                                    {email.subject}
                                  </div>
                                  <div style={{ fontSize: "14px", color: "#a1a1aa", lineHeight: "1.5" }}>
                                    {email.snippet}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Meetings Section */}
                        {contact.meetings && contact.meetings.length > 0 && (
                          <div style={{ marginTop: "24px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#a1a1aa", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Meetings ({contact.meetings.length})
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {contact.meetings.slice(0, 10).map((meeting, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: "16px",
                                    background: "#0a0a0a",
                                    borderRadius: "12px",
                                    border: "1px solid #27272a",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                  }}
                                >
                                  <Calendar style={{ width: "18px", height: "18px", color: meeting.isPast ? "#71717a" : "#f59e0b", flexShrink: 0 }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "15px", fontWeight: 500, color: "#fafafa", marginBottom: "4px" }}>
                                      {meeting.title}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#71717a" }}>
                                      {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                                    </div>
                                  </div>
                                  {!meeting.isPast && (
                                    <span style={{
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      background: "#f59e0b22",
                                      color: "#f59e0b",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                    }}>
                                      UPCOMING
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {(!contact.emails || contact.emails.length === 0) && (!contact.meetings || contact.meetings.length === 0) && (
                          <div style={{ padding: "40px", textAlign: "center", color: "#71717a" }}>
                            No interaction history found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
