"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { ProductivityToolNav } from "@/components/ProductivityToolNav";
import { Handshake, RefreshCw, ExternalLink, User, Search, Filter, CheckCircle, Clock, Archive } from "lucide-react";

interface Recommendation {
  id: string;
  notionId?: string;
  type: string;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  status: 'pending' | 'completed' | 'archived';
  createdAt: number;
  completedAt?: number;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadRecommendations();
  }, [statusFilter]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== 'all'
        ? `/api/recommendations?status=${statusFilter}`
        : '/api/recommendations';
      const res = await fetch(url);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync: true }),
      });
      const data = await res.json();

      if (data.success) {
        alert(`✅ Synced ${data.synced} recommendations from Notion!`);
        loadRecommendations();
      } else {
        alert(`❌ Sync failed: ${data.error || data.message}`);
      }
    } catch (err: any) {
      alert(`❌ Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/recommendations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      loadRecommendations();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = !searchQuery ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.source?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || rec.type.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  const types = ['all', ...Array.from(new Set(recommendations.map(r => r.type).filter(Boolean)))];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'pending': return <Clock size={16} style={{ color: '#f59e0b' }} />;
      case 'archived': return <Archive size={16} style={{ color: '#64748b' }} />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      book: '#3b82f6',
      movie: '#ec4899',
      restaurant: '#f59e0b',
      product: '#10b981',
      service: '#8b5cf6',
      tool: '#14b8a6',
      other: '#64748b',
    };
    return colors[type.toLowerCase()] || colors.other;
  };

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
          <ProductivityToolNav current="recommendations" />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <Handshake size={48} style={{ color: "#ec4899" }} />
                <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "white", margin: 0 }}>
                  Recommendations
                </h1>
              </div>
              <p style={{ fontSize: "18px", color: "#94a3b8", marginBottom: "0" }}>
                Track suggestions and recommendations
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
                background: syncing ? "#475569" : "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
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
                placeholder="Search recommendations..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <Filter size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
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
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recommendations List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "64px", color: "#64748b" }}>
              Loading recommendations...
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "64px 24px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
            }}>
              <Handshake size={48} style={{ color: "#64748b", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "white", marginBottom: "8px" }}>
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'No matching recommendations' : 'No recommendations yet'}
              </h3>
              <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "24px" }}>
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Sync from Notion to import your recommendations'}
              </p>
              {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
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
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "20px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(236, 72, 153, 0.3)";
                    e.currentTarget.style.background = "rgba(236, 72, 153, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "white", margin: 0 }}>
                          {rec.title}
                        </h3>
                        <div style={{ display: "inline-block", padding: "4px 10px", background: `${getTypeColor(rec.type)}20`, border: `1px solid ${getTypeColor(rec.type)}40`, borderRadius: "12px", fontSize: "11px", fontWeight: "600", color: getTypeColor(rec.type), textTransform: "capitalize" }}>
                          {rec.type}
                        </div>
                      </div>

                      {rec.description && (
                        <p style={{ fontSize: "14px", color: "#cbd5e1", marginBottom: "12px", lineHeight: "1.6" }}>
                          {rec.description}
                        </p>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        {rec.source && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <User size={14} style={{ color: "#64748b" }} />
                            <span style={{ fontSize: "13px", color: "#94a3b8" }}>From: {rec.source}</span>
                          </div>
                        )}

                        {rec.url && (
                          <a href={rec.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#60a5fa", textDecoration: "none" }}>
                            <ExternalLink size={14} />
                            View Link
                          </a>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {getStatusIcon(rec.status)}
                          <span style={{ fontSize: "13px", color: "#94a3b8", textTransform: "capitalize" }}>{rec.status}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {rec.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(rec.id, 'completed')}
                          style={{
                            padding: "8px 12px",
                            background: "rgba(16, 185, 129, 0.2)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            borderRadius: "6px",
                            color: "#10b981",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          ✓ Mark Done
                        </button>
                      )}
                      {rec.status !== 'archived' && (
                        <button
                          onClick={() => handleStatusChange(rec.id, 'archived')}
                          style={{
                            padding: "8px 12px",
                            background: "rgba(100, 116, 139, 0.2)",
                            border: "1px solid rgba(100, 116, 139, 0.3)",
                            borderRadius: "6px",
                            color: "#94a3b8",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {!loading && recommendations.length > 0 && (
            <div style={{ marginTop: "32px", padding: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>
              Showing {filteredRecommendations.length} of {recommendations.length} recommendations
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
