"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, Users, Loader2, Search, Mail, Phone, Calendar, 
  ExternalLink, Plus, Tag, Building2, Network, MessageSquare,
  Clock, TrendingUp, X, Edit2, Save, ChevronRight
} from "lucide-react";
import { GoogleContact } from "@/lib/google-services";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  date: string;
  from: string;
  to: string[];
  cc?: string[];
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  notes?: string;
}

interface RelationshipData {
  contact: GoogleContact;
  emails: EmailThread[];
  meetings: Meeting[];
  connections: string[];
  tags: string[];
  notes: string;
  lastContact: string;
  contactFrequency: number;
}

function RelationshipsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedContactId = searchParams.get("contact");
  
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<RelationshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelLoading, setPanelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  useEffect(() => {
    if (selectedContactId && contacts.length > 0) {
      const contact = contacts.find(c => c.resourceName === selectedContactId);
      if (contact) {
        loadContactDetails(contact);
      }
    }
  }, [selectedContactId, contacts]);

  const checkConnectionAndFetch = async () => {
    try {
      const statusResponse = await fetch("/api/auth/google/status");
      const status = await statusResponse.json();
      setIsConnected(status.connected);

      if (status.connected) {
        fetchContacts();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchContacts = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = query
        ? `/api/contacts?limit=500&q=${encodeURIComponent(query)}`
        : "/api/contacts?limit=500";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch contacts");
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const loadContactDetails = async (contact: GoogleContact) => {
    setPanelLoading(true);
    try {
      // Fetch emails for this contact
      const email = contact.emailAddresses?.[0]?.value;
      let emails: EmailThread[] = [];
      let meetings: Meeting[] = [];
      
      if (email) {
        const emailsResponse = await fetch(`/api/emails/search?q=${encodeURIComponent(`from:${email} OR to:${email}`)}&maxResults=50`);
        if (emailsResponse.ok) {
          const emailsData = await emailsResponse.json();
          emails = emailsData.messages || [];
        }

        // Fetch calendar meetings
        const meetingsResponse = await fetch(`/api/calendar/meetings?attendee=${encodeURIComponent(email)}`);
        if (meetingsResponse.ok) {
          const meetingsData = await meetingsResponse.json();
          meetings = meetingsData.meetings || [];
        }
      }

      // Build relationship data
      const relationshipData: RelationshipData = {
        contact,
        emails,
        meetings,
        connections: extractConnections(emails),
        tags: [], // TODO: Load from storage
        notes: "", // TODO: Load from storage
        lastContact: emails[0]?.date || "Never",
        contactFrequency: calculateFrequency(emails),
      };

      setSelectedContact(relationshipData);
      
      // Update URL without reload
      const url = new URL(window.location.href);
      url.searchParams.set("contact", contact.resourceName);
      window.history.pushState({}, "", url);
    } catch (err) {
      console.error("Failed to load contact details:", err);
    } finally {
      setPanelLoading(false);
    }
  };

  const extractConnections = (emails: EmailThread[]): string[] => {
    const connections = new Set<string>();
    emails.forEach(email => {
      email.to?.forEach(addr => connections.add(addr));
      email.cc?.forEach(addr => connections.add(addr));
    });
    return Array.from(connections).slice(0, 10);
  };

  const calculateFrequency = (emails: EmailThread[]): number => {
    if (emails.length < 2) return 0;
    const now = new Date();
    const oldestEmail = new Date(emails[emails.length - 1].date);
    const daysSinceFirst = (now.getTime() - oldestEmail.getTime()) / (1000 * 60 * 60 * 24);
    return emails.length / Math.max(daysSinceFirst, 1);
  };

  const handleConnect = async () => {
    try {
      const returnUrl = encodeURIComponent("/tools/relationships");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}`);
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleEmailClick = (e: React.MouseEvent, email: string, subject?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams({ compose: email });
    if (subject) params.append("subject", `Re: ${subject}`);
    router.push(`/tools/emails?${params.toString()}`);
  };

  const getContactName = (contact: GoogleContact): string => {
    return contact.names?.[0]?.displayName || contact.emailAddresses?.[0]?.value || "Unknown";
  };

  const getContactEmail = (contact: GoogleContact): string | undefined => {
    return contact.emailAddresses?.[0]?.value;
  };

  const getContactPhone = (contact: GoogleContact): string | undefined => {
    return contact.phoneNumbers?.[0]?.value;
  };

  const getContactPhoto = (contact: GoogleContact): string | undefined => {
    return contact.photos?.[0]?.url;
  };

  const getContactOrg = (contact: GoogleContact): string | undefined => {
    const org = contact.organizations?.[0];
    if (org?.name && org?.title) return `${org.title} at ${org.name}`;
    return org?.name || org?.title;
  };

  const getInitials = (name: string): string => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const addTag = () => {
    if (newTag && selectedContact && !selectedContact.tags.includes(newTag)) {
      setSelectedContact({
        ...selectedContact,
        tags: [...selectedContact.tags, newTag],
      });
      setNewTag("");
      // TODO: Save to storage
    }
  };

  const removeTag = (tag: string) => {
    if (selectedContact) {
      setSelectedContact({
        ...selectedContact,
        tags: selectedContact.tags.filter(t => t !== tag),
      });
      // TODO: Save to storage
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (searchQuery) {
      const name = getContactName(contact).toLowerCase();
      const email = getContactEmail(contact)?.toLowerCase() || "";
      const org = getContactOrg(contact)?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      if (!name.includes(query) && !email.includes(query) && !org.includes(query)) {
        return false;
      }
    }
    // TODO: Filter by tags
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0a", width: "100%", overflow: "hidden" }}>
      <Header />
      
      <main style={{ flex: 1, width: "100%", paddingTop: "64px", display: "flex", overflow: "hidden" }}>
        {/* Left Sidebar - Contact List */}
        <div style={{ 
          width: selectedContact ? "360px" : "100%", 
          maxWidth: "500px",
          borderRight: selectedContact ? "1px solid #1a1a1a" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.3s ease",
        }}>
          {/* Sidebar Header */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a", background: "#0f0f0f" }}>
            <div style={{ marginBottom: "16px" }}>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  color: "#888",
                  textDecoration: "none",
                  fontSize: "13px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#888";
                }}
              >
                <ArrowLeft style={{ width: "14px", height: "14px" }} />
                Back
              </Link>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <Users style={{ width: "20px", height: "20px", color: "#6366f1" }} />
              <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#fff", margin: 0 }}>
                Relationships
              </h1>
            </div>

            {/* Search */}
            {isConnected && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#1a1a1a",
                borderRadius: "8px",
                padding: "10px 14px",
                border: "1px solid #2a2a2a",
              }}>
                <Search style={{ width: "16px", height: "16px", color: "#666" }} />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    color: "#fff",
                  }}
                />
              </div>
            )}
          </div>

          {/* Contact List */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {!isConnected ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <Users style={{ width: "48px", height: "48px", color: "#6366f1", margin: "0 auto 16px" }} />
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>
                  Connect Google
                </h2>
                <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px" }}>
                  Access your contacts and emails
                </p>
                <button
                  onClick={handleConnect}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    background: "#6366f1",
                    color: "#fff",
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
                <Loader2 style={{ width: "24px", height: "24px", color: "#6366f1", animation: "spin 1s linear infinite" }} />
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#f87171" }}>
                <p style={{ fontSize: "13px" }}>{error}</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#666", fontSize: "13px" }}>
                No contacts found
              </div>
            ) : (
              <div>
                {filteredContacts.map((contact) => {
                  const name = getContactName(contact);
                  const email = getContactEmail(contact);
                  const org = getContactOrg(contact);
                  const photo = getContactPhoto(contact);
                  const isSelected = selectedContact?.contact.resourceName === contact.resourceName;

                  return (
                    <div
                      key={contact.resourceName}
                      onClick={() => loadContactDetails(contact)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "14px 24px",
                        borderBottom: "1px solid #1a1a1a",
                        cursor: "pointer",
                        background: isSelected ? "#1a1a1a" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#151515";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "#6366f1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#fff",
                        }}>
                          {getInitials(name)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", color: "#fff", fontWeight: 500, marginBottom: "2px" }}>
                          {name}
                        </div>
                        {org && (
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {org}
                          </div>
                        )}
                      </div>
                      <ChevronRight style={{ width: "16px", height: "16px", color: "#666" }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Contact Details */}
        {selectedContact && (
          <div style={{ 
            flex: 1, 
            overflow: "auto",
            background: "#0a0a0a",
          }}>
            {panelLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "60px" }}>
                <Loader2 style={{ width: "32px", height: "32px", color: "#6366f1", animation: "spin 1s linear infinite" }} />
              </div>
            ) : (
              <div style={{ maxWidth: "900px", padding: "40px 48px" }}>
                {/* Header */}
                <div style={{ display: "flex", gap: "24px", marginBottom: "40px", paddingBottom: "32px", borderBottom: "1px solid #1a1a1a" }}>
                  {getContactPhoto(selectedContact.contact) ? (
                    <img
                      src={getContactPhoto(selectedContact.contact)}
                      alt={getContactName(selectedContact.contact)}
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      fontWeight: 600,
                      color: "#fff",
                    }}>
                      {getInitials(getContactName(selectedContact.contact))}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>
                      {getContactName(selectedContact.contact)}
                    </h2>
                    {getContactOrg(selectedContact.contact) && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#888", fontSize: "14px", marginBottom: "12px" }}>
                        <Building2 style={{ width: "14px", height: "14px" }} />
                        {getContactOrg(selectedContact.contact)}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {getContactEmail(selectedContact.contact) && (
                        <button
                          onClick={(e) => handleEmailClick(e, getContactEmail(selectedContact.contact)!)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            background: "#6366f1",
                            color: "#fff",
                            border: "none",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          <Mail style={{ width: "14px", height: "14px" }} />
                          Email
                        </button>
                      )}
                      {getContactPhone(selectedContact.contact) && (
                        <a
                          href={`tel:${getContactPhone(selectedContact.contact)}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            background: "#1a1a1a",
                            color: "#fff",
                            border: "1px solid #2a2a2a",
                            fontSize: "13px",
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          <Phone style={{ width: "14px", height: "14px" }} />
                          Call
                        </a>
                      )}
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "6px",
                          background: "#1a1a1a",
                          color: "#fff",
                          border: "1px solid #2a2a2a",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        <Calendar style={{ width: "14px", height: "14px" }} />
                        Schedule Meeting
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "40px" }}>
                  <div style={{ 
                    padding: "20px", 
                    background: "#0f0f0f", 
                    border: "1px solid #1a1a1a", 
                    borderRadius: "12px" 
                  }}>
                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Last Contact</div>
                    <div style={{ fontSize: "16px", color: "#fff", fontWeight: 500 }}>
                      {selectedContact.lastContact === "Never" ? "Never" : new Date(selectedContact.lastContact).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ 
                    padding: "20px", 
                    background: "#0f0f0f", 
                    border: "1px solid #1a1a1a", 
                    borderRadius: "12px" 
                  }}>
                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Total Emails</div>
                    <div style={{ fontSize: "16px", color: "#fff", fontWeight: 500 }}>{selectedContact.emails.length}</div>
                  </div>
                  <div style={{ 
                    padding: "20px", 
                    background: "#0f0f0f", 
                    border: "1px solid #1a1a1a", 
                    borderRadius: "12px" 
                  }}>
                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Meetings</div>
                    <div style={{ fontSize: "16px", color: "#fff", fontWeight: 500 }}>{selectedContact.meetings.length}</div>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ marginBottom: "40px" }}>
                  <div style={{ fontSize: "14px", color: "#888", marginBottom: "12px", fontWeight: 500 }}>Tags</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                    {selectedContact.tags.map(tag => (
                      <div
                        key={tag}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "#8b5cf6",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        <Tag style={{ width: "12px", height: "12px" }} />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <X style={{ width: "12px", height: "12px", color: "#fff" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        color: "#fff",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={addTag}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        color: "#fff",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <Plus style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ fontSize: "14px", color: "#888", fontWeight: 500 }}>Notes</div>
                    <button
                      onClick={() => setEditingNotes(!editingNotes)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        color: "#888",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {editingNotes ? (
                        <>
                          <Save style={{ width: "12px", height: "12px" }} />
                          Save
                        </>
                      ) : (
                        <>
                          <Edit2 style={{ width: "12px", height: "12px" }} />
                          Edit
                        </>
                      )}
                    </button>
                  </div>
                  {editingNotes ? (
                    <textarea
                      value={selectedContact.notes}
                      onChange={(e) => setSelectedContact({ ...selectedContact, notes: e.target.value })}
                      style={{
                        width: "100%",
                        minHeight: "120px",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        color: "#fff",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        resize: "vertical",
                        outline: "none",
                      }}
                      placeholder="Add notes about this relationship..."
                    />
                  ) : (
                    <div style={{
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#0f0f0f",
                      border: "1px solid #1a1a1a",
                      color: "#aaa",
                      fontSize: "13px",
                      minHeight: "80px",
                    }}>
                      {selectedContact.notes || "No notes yet"}
                    </div>
                  )}
                </div>

                {/* Connections */}
                {selectedContact.connections.length > 0 && (
                  <div style={{ marginBottom: "40px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <Network style={{ width: "16px", height: "16px", color: "#10b981" }} />
                      <div style={{ fontSize: "14px", color: "#888", fontWeight: 500 }}>
                        Connected Through ({selectedContact.connections.length})
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {selectedContact.connections.slice(0, 10).map(email => (
                        <div
                          key={email}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#0f0f0f",
                            border: "1px solid #1a1a1a",
                            color: "#aaa",
                            fontSize: "12px",
                          }}
                        >
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email History */}
                <div style={{ marginBottom: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Mail style={{ width: "16px", height: "16px", color: "#3b82f6" }} />
                    <div style={{ fontSize: "14px", color: "#888", fontWeight: 500 }}>
                      Email History ({selectedContact.emails.length})
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedContact.emails.slice(0, 20).map(email => (
                      <div
                        key={email.id}
                        style={{
                          padding: "16px",
                          borderRadius: "8px",
                          background: "#0f0f0f",
                          border: "1px solid #1a1a1a",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#151515"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#0f0f0f"}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                          <div style={{ fontSize: "14px", color: "#fff", fontWeight: 500 }}>
                            {email.subject || "(no subject)"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap", marginLeft: "12px" }}>
                            {new Date(email.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                          From: {email.from}
                        </div>
                        {expandedEmail === email.id ? (
                          <div style={{ fontSize: "13px", color: "#aaa", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #1a1a1a" }}>
                            {email.snippet}
                          </div>
                        ) : (
                          <div style={{ fontSize: "13px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {email.snippet}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meetings */}
                {selectedContact.meetings.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <Calendar style={{ width: "16px", height: "16px", color: "#f59e0b" }} />
                      <div style={{ fontSize: "14px", color: "#888", fontWeight: 500 }}>
                        Meetings ({selectedContact.meetings.length})
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {selectedContact.meetings.map(meeting => (
                        <div
                          key={meeting.id}
                          style={{
                            padding: "16px",
                            borderRadius: "8px",
                            background: "#0f0f0f",
                            border: "1px solid #1a1a1a",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                            <div style={{ fontSize: "14px", color: "#fff", fontWeight: 500 }}>
                              {meeting.title}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap", marginLeft: "12px" }}>
                              {new Date(meeting.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {meeting.attendees.length} attendees
                          </div>
                          {meeting.notes && (
                            <div style={{ fontSize: "13px", color: "#aaa", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1a1a1a" }}>
                              {meeting.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar */
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: #3a3a3a;
        }
      `}</style>
    </div>
  );
}

export default function RelationshipsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0a" }}>
        <div style={{ color: "#6366f1", fontSize: "14px" }}>Loading...</div>
      </div>
    }>
      <RelationshipsContent />
    </Suspense>
  );
}
