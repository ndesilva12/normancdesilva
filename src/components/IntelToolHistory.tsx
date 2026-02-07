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

  const renderFullResults = (results: any) => {
    if (!results) return <div style={{ color: '#64748b' }}>No results available</div>;

    // Curate results
    if (results.sections && Array.isArray(results.sections) && results.sections[0]?.sources) {
      return (
        <div>
          {results.summary && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#e2e8f0' }}>{results.summary}</div>
            </div>
          )}
          {results.sections.map((section: any, idx: number) => (
            <div key={idx} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6', marginBottom: '8px' }}>{section.title}</h3>
              {section.description && <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>{section.description}</p>}
              {section.sources && section.sources.map((source: any, sidx: number) => (
                <div key={sidx} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
                    {source.title}
                  </a>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase' }}>{source.type}</div>
                  {source.annotation && <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '8px' }}>{source.annotation}</div>}
                </div>
              ))}
            </div>
          ))}
          {results.keyTakeaways && results.keyTakeaways.length > 0 && (
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', marginBottom: '8px' }}>Key Takeaways</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {results.keyTakeaways.map((takeaway: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // L3D results
    if (results.recentDevelopments) {
      return (
        <div>
          {results.summary && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#e2e8f0' }}>{results.summary}</div>
            </div>
          )}
          {results.recentDevelopments.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6', marginBottom: '12px' }}>Recent Developments</h3>
              {results.recentDevelopments.map((dev: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '16px', padding: '14px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa', margin: 0 }}>{dev.title}</h4>
                    {dev.date && <span style={{ fontSize: '11px', color: '#64748b' }}>{dev.date}</span>}
                  </div>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px', lineHeight: '1.6' }}>{dev.description}</p>
                  {dev.url && (
                    <a href={dev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
                      {dev.source || 'Read more →'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {results.keyTrends && results.keyTrends.length > 0 && (
            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', marginBottom: '8px' }}>Key Trends</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {results.keyTrends.map((trend: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>{trend}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Deep/Dark Search results
    if (results.briefOverview || results.hiddenMechanics || results.keyTakeaways || results.alternativePerspectives) {
      return (
        <div>
          {(results.briefOverview || results.summary) && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#e2e8f0' }}>{results.briefOverview || results.summary}</div>
            </div>
          )}
          {results.sections && results.sections.map((section: any, idx: number) => (
            <div key={idx} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6', marginBottom: '10px' }}>{section.title}</h3>
              <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#cbd5e1', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{section.content}</div>
            </div>
          ))}
          {results.hiddenMechanics && results.hiddenMechanics.length > 0 && (
            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#a78bfa', marginBottom: '8px' }}>Hidden Mechanics</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {results.hiddenMechanics.map((item: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {results.counterintuitiveInsights && results.counterintuitiveInsights.length > 0 && (
            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(251, 146, 60, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 146, 60, 0.3)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fb923c', marginBottom: '8px' }}>Counterintuitive Insights</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {results.counterintuitiveInsights.map((item: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {results.keyTakeaways && results.keyTakeaways.length > 0 && (
            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', marginBottom: '8px' }}>Key Takeaways</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {results.keyTakeaways.map((item: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {results.alternativePerspectives && results.alternativePerspectives.length > 0 && (
            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '8px', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#ec4899', marginBottom: '8px' }}>Alternative Perspectives</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {results.alternativePerspectives.map((item: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {results.links && results.links.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', marginBottom: '10px' }}>Sources</h3>
              {results.links.map((link: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '13px', textDecoration: 'none' }}>
                    {link.title} <span style={{ color: '#64748b', fontSize: '11px' }}>({link.type})</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Fallback: Show as formatted JSON
    return (
      <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', color: '#94a3b8' }}>
        {JSON.stringify(results, null, 2)}
      </div>
    );
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
              fontSize: '14px',
              color: '#cbd5e1',
              lineHeight: '1.8',
              maxHeight: '60vh',
              overflowY: 'auto',
            }}>
              {renderFullResults(fullReportItem.results)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
