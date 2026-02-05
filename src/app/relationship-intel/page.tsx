'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Mail, Calendar, RefreshCw, ArrowLeft, Users, Clock, Building2, ChevronRight, ChevronDown, X } from 'lucide-react';

interface Contact {
  email: string;
  name: string;
  first_seen: number;
  last_seen: number;
  interaction_count: number;
  company?: string;
}

interface Interaction {
  id: string;
  type: 'email' | 'meeting';
  date: number;
  subject?: string;
  title?: string;
  snippet?: string;
  body?: string;
}

export default function RelationshipIntel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactInteractions, setContactInteractions] = useState<Interaction[]>([]);
  const [expandedInteraction, setExpandedInteraction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const getStatus = (lastSeen: number) => {
    const daysSince = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return { label: 'Active', color: '#10b981' };
    if (daysSince < 30) return { label: 'Warm', color: '#f59e0b' };
    return { label: 'Cold', color: '#6b7280' };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/relationship-intel/projects/cinderella/contacts');
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts || []);
          setFilteredContacts(data.contacts || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      setFilteredContacts(contacts.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
      ));
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const openContactDetail = async (contact: Contact) => {
    setSelectedContact(contact);
    try {
      const res = await fetch(`/api/relationship-intel/projects/cinderella/contacts/${encodeURIComponent(contact.email)}/interactions`);
      if (res.ok) {
        const data = await res.json();
        setContactInteractions(data.interactions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      await fetch('/api/relationship-intel/projects/cinderella/sync', { method: 'POST' });
      const res = await fetch('/api/relationship-intel/projects/cinderella/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setFilteredContacts(data.contacts || []);
      }
    } catch (err) {
      console.error(err);
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff"
      }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw size={40} style={{ animation: "spin 1s linear infinite", margin: "0 auto 20px", color: "#3b82f6" }} />
          <p style={{ fontSize: "18px", color: "#9ca3af" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
      color: "#ffffff",
      padding: "40px",
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <Link href="/" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "#9ca3af",
          textDecoration: "none",
          fontSize: "14px",
          marginBottom: "32px",
        }}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Users size={32} />
            </div>
            <div>
              <h1 style={{
                fontSize: "48px",
                fontWeight: "800",
                margin: 0,
                background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Relationship Intel
              </h1>
              <p style={{ fontSize: "18px", color: "#9ca3af", margin: "8px 0 0 0" }}>
                {contacts.length} contacts • Cinderella Project
              </p>
            </div>
          </div>

          <button onClick={syncData} disabled={syncing} style={{
            padding: "14px 28px",
            background: "rgba(59, 130, 246, 0.2)",
            border: "2px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "600",
            cursor: syncing ? "not-allowed" : "pointer",
            opacity: syncing ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <RefreshCw size={18} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? 'Syncing...' : 'Sync Gmail'}
          </button>
        </div>

        {/* Main Content */}
        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "40px" }}>
          {/* Left Panel */}
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            padding: "30px",
            maxHeight: "800px",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ position: "relative", marginBottom: "24px" }}>
              <Search size={20} style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6b7280",
              }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredContacts.map((contact) => {
                const status = getStatus(contact.last_seen);
                const isSelected = selectedContact?.email === contact.email;

                return (
                  <div
                    key={contact.email}
                    onClick={() => openContactDetail(contact)}
                    style={{
                      padding: "18px",
                      marginBottom: "12px",
                      borderRadius: "12px",
                      background: isSelected ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.05)"}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: status.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: "700",
                      }}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>
                          {contact.name}
                        </div>
                        <div style={{ fontSize: "13px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {contact.company || contact.email}
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: "#6b7280" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div>
            {selectedContact ? (
              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                padding: "40px",
              }}>
                <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "16px",
                      background: getStatus(selectedContact.last_seen).color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      fontWeight: "700",
                    }}>
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontSize: "32px", fontWeight: "700", margin: "0 0 12px 0" }}>
                        {selectedContact.name}
                      </h2>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "15px" }}>
                        <span style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "600",
                          background: `${getStatus(selectedContact.last_seen).color}30`,
                          color: getStatus(selectedContact.last_seen).color,
                        }}>
                          {getStatus(selectedContact.last_seen).label}
                        </span>
                        <span style={{ color: "#6b7280" }}>•</span>
                        <span style={{ color: "#9ca3af" }}>{selectedContact.interaction_count} interactions</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedContact(null)} style={{
                    padding: "10px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    borderRadius: "10px",
                    color: "#9ca3af",
                    cursor: "pointer",
                  }}>
                    <X size={22} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#9ca3af", fontSize: "15px" }}>
                    <Mail size={18} />
                    {selectedContact.email}
                  </div>
                  {selectedContact.company && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#9ca3af", fontSize: "15px" }}>
                      <Building2 size={18} />
                      {selectedContact.company}
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Clock size={20} />
                  Interaction History
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {contactInteractions.map((interaction) => {
                    const isExpanded = expandedInteraction === interaction.id;
                    return (
                      <div
                        key={interaction.id}
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "14px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          onClick={() => setExpandedInteraction(isExpanded ? null : interaction.id)}
                          style={{ padding: "20px", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                {interaction.type === 'email' ? <Mail size={16} style={{ color: "#3b82f6" }} /> : <Calendar size={16} style={{ color: "#10b981" }} />}
                                <span style={{ fontWeight: "600", fontSize: "15px" }}>{interaction.subject || interaction.title}</span>
                              </div>
                              <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                                {new Date(interaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </div>
                            </div>
                            <ChevronDown size={18} style={{ color: "#6b7280", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "20px" }}>
                            <div style={{ fontSize: "14px", color: "#d1d5db", lineHeight: "1.6" }}>
                              {interaction.snippet || interaction.body || 'No content available'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "20px",
                padding: "120px 60px",
                textAlign: "center",
              }}>
                <Users size={64} style={{ margin: "0 auto 20px", color: "#6b7280" }} />
                <p style={{ fontSize: "20px", color: "#9ca3af" }}>Select a contact to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
