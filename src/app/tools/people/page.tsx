"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { ProductivityToolNav } from "@/components/ProductivityToolNav";
import { Users, RefreshCw, Mail, Phone, Building2, Tag, Search, Filter } from "lucide-react";

interface Person {
  id: string;
  notionId?: string;
  name: string;
  relationship?: string;
  tags?: string[];
  notes?: string;
  email?: string;
  phone?: string;
  company?: string;
  lastSynced?: number;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState("all");

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/people');
      const data = await res.json();
      setPeople(data.people || []);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync: true }),
      });
      const data = await res.json();

      if (data.success) {
        alert(`✅ Synced ${data.synced} people from Notion!`);
        loadPeople();
      } else {
        alert(`❌ Sync failed: ${data.error || data.message}`);
      }
    } catch (err: any) {
      alert(`❌ Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const filteredPeople = people.filter(person => {
    const matchesSearch = !searchQuery ||
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRelationship = selectedRelationship === 'all' ||
      person.relationship?.toLowerCase() === selectedRelationship.toLowerCase();

    return matchesSearch && matchesRelationship;
  });

  const relationships = ['all', ...Array.from(new Set(people.map(p => p.relationship).filter(Boolean)))];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)",
      width: "100%"
    }}>
      <Header />
      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1200px", width: "90%", margin: "0 auto", padding: "32px 20px" }}>
          <RemindersBanner />
          <ProductivityToolNav current="people" />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <Users size={48} style={{ color: "#06b6d4" }} />
                <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "white", margin: 0 }}>
                  People
                </h1>
              </div>
              <p style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "0" }}>
                Manage your contacts and relationships
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: syncing ? "#475569" : "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                cursor: syncing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={16} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {syncing ? 'Syncing...' : 'Sync from Notion'}
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 44px",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ position: "relative" }}>
              <Filter size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
              <select
                value={selectedRelationship}
                onChange={(e) => setSelectedRelationship(e.target.value)}
                style={{
                  padding: "10px 40px 10px 44px",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {relationships.map(rel => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>
          </div>

          {/* People Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "64px", color: "#64748b" }}>
              Loading people...
            </div>
          ) : filteredPeople.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "64px 24px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
            }}>
              <Users size={48} style={{ color: "#64748b", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "white", marginBottom: "8px" }}>
                {searchQuery || selectedRelationship !== 'all' ? 'No matching people' : 'No people yet'}
              </h3>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>
                {searchQuery || selectedRelationship !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Sync from Notion to import your people database'}
              </p>
              {!searchQuery && selectedRelationship === 'all' && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={16} />
                  Sync from Notion
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {filteredPeople.map((person) => (
                <div
                  key={person.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "20px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
                    e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: "white", marginBottom: "8px" }}>
                    {person.name}
                  </h3>

                  {person.relationship && (
                    <div style={{ display: "inline-block", padding: "4px 10px", background: "rgba(6, 182, 212, 0.2)", border: "1px solid rgba(6, 182, 212, 0.3)", borderRadius: "12px", fontSize: "12px", fontWeight: "600", color: "#22d3ee", marginBottom: "12px", textTransform: "capitalize" }}>
                      {person.relationship}
                    </div>
                  )}

                  {person.company && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Building2 size={14} style={{ color: "#64748b" }} />
                      <span style={{ fontSize: "13px", color: "#cbd5e1" }}>{person.company}</span>
                    </div>
                  )}

                  {person.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Mail size={14} style={{ color: "#64748b" }} />
                      <a href={`mailto:${person.email}`} style={{ fontSize: "13px", color: "#60a5fa", textDecoration: "none" }}>
                        {person.email}
                      </a>
                    </div>
                  )}

                  {person.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <Phone size={14} style={{ color: "#64748b" }} />
                      <a href={`tel:${person.phone}`} style={{ fontSize: "13px", color: "#60a5fa", textDecoration: "none" }}>
                        {person.phone}
                      </a>
                    </div>
                  )}

                  {person.tags && person.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                      {person.tags.map((tag, idx) => (
                        <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: "rgba(100, 116, 139, 0.2)", borderRadius: "6px", fontSize: "11px", color: "#94a3b8" }}>
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {person.notes && (
                    <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                      {person.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {!loading && people.length > 0 && (
            <div style={{ marginTop: "32px", padding: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
              Showing {filteredPeople.length} of {people.length} people
              {people[0]?.lastSynced && ` • Last synced: ${new Date(people[0].lastSynced).toLocaleString()}`}
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
