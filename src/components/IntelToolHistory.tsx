"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

interface HistoryItem {
  id: string;
  query: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: any;
  completed_at?: any;
  results?: any;
  error?: string;
}

interface IntelToolHistoryProps {
  toolName: string;
  collectionName: string;
  onResultClick?: (item: HistoryItem) => void;
}

export function IntelToolHistory({ toolName, collectionName, onResultClick }: IntelToolHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fullReportItem, setFullReportItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [collectionName]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/intel-history?collection=${collectionName}`);
      const data = await res.json();
      setHistory(data.history || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load history:', err);
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const itemQuery = item.query?.toLowerCase() || "";
      const resultsStr = JSON.stringify(item.results || "").toLowerCase();
      const errorStr = (item.error || "").toLowerCase();
      
      return itemQuery.includes(query) || resultsStr.includes(query) || errorStr.includes(query);
    }
    
    return true;
  });

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown";

    try {
      let date: Date | null = null;

      // Handle Firestore Timestamp objects with toDate method
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle ISO strings
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      // Handle milliseconds (number)
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Handle Date objects
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Fallback
      else {
        return "Unknown";
      }

      // Validate the date
      if (!date || isNaN(date.getTime())) {
        return "Unknown";
      }

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return "Unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock size={16} className="animate-spin" style={{ color: '#3b82f6' }} />;
      case 'completed':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'failed':
        return <XCircle size={16} style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderSummary = (results: any) => {
    if (!results) return "No results available";

    // Handle different result structures
    if (results.briefOverview) {
      return results.briefOverview;
    }
    if (results.summary) {
      return results.summary;
    }
    if (typeof results === 'string') {
      return results.substring(0, 300) + (results.length > 300 ? '...' : '');
    }
    if (results.output) {
      return results.output.substring(0, 300) + (results.output.length > 300 ? '...' : '');
    }

    // Fallback: stringify and truncate
    const str = JSON.stringify(results);
    return str.substring(0, 300) + (str.length > 300 ? '...' : '');
  };

  return (
    <div style={{
      marginTop: '48px',
      background: 'rgba(30, 41, 59, 0.4)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '24px',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px',
        }}>
          History
        </h2>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>
          Past {toolName} searches and results
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
          }} />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 44px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Filter size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
            pointerEvents: 'none',
          }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 40px 10px 44px',
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading history...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No history found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (expandedId === item.id) {
                    setExpandedId(null);
                  } else {
                    setExpandedId(item.id);
                    onResultClick?.(item);
                  }
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  {getStatusIcon(item.status)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.query}
                  </div>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  flexShrink: 0,
                }}>
                  {formatTimestamp(item.timestamp)}
                </div>

                <div style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: `${getStatusColor(item.status)}20`,
                  color: getStatusColor(item.status),
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  flexShrink: 0,
                }}>
                  {item.status}
                </div>

                <div style={{ flexShrink: 0, color: '#64748b' }}>
                  {expandedId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedId === item.id && (
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(0, 0, 0, 0.2)',
                }}>
                  {item.status === 'failed' && item.error && (
                    <div style={{
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      color: '#fca5a5',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}>
                      <strong>Error:</strong> {item.error}
                    </div>
                  )}

                  {item.status === 'completed' && item.results && (
                    <div>
                      <div style={{
                        fontSize: '13px',
                        color: '#cbd5e1',
                        lineHeight: '1.6',
                        marginBottom: '12px',
                        padding: '12px',
                        borderRadius: '6px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}>
                        {renderSummary(item.results)}
                      </div>
                      <button
                        onClick={() => setFullReportItem(item)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                        }}
                      >
                        View Full Report →
                      </button>
                    </div>
                  )}

                  {item.status === 'running' && (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#64748b',
                    }}>
                      Processing... check back in a moment
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full Report Modal */}
      {fullReportItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                  marginBottom: '4px',
                }}>
                  Full Report
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  margin: 0,
                }}>
                  {fullReportItem.query}
                </p>
              </div>
              <button
                onClick={() => setFullReportItem(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '20px',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              fontSize: '12px',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '60vh',
              overflowY: 'auto',
            }}>
              {JSON.stringify(fullReportItem.results, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
