"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, RefreshCw, Search, ChevronDown } from "lucide-react";

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
  collection: "curate" | "l3d" | "deep" | "dark";
  onSelectResult: (item: HistoryItem) => void;
  onRefreshSearch: (query: string) => void;
}

export function IntelToolHistory({ collection, onSelectResult, onRefreshSearch }: IntelToolHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [collection]);

  const loadHistory = async () => {
    try {
      const endpoint = collection === "curate" ? "/api/curate"
        : collection === "l3d" ? "/api/l3d"
        : collection === "deep" ? "/api/deep-search-history"
        : "/api/dark-search-history";
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedHistory = showAll ? filteredHistory : filteredHistory.slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'running': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'failed': return <XCircle size={16} />;
      case 'running': return <Clock size={16} className="animate-spin" />;
      default: return <Clock size={16} />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <Clock size={48} style={{ color: '#94a3b8', marginBottom: '16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '8px' }}>
          No searches yet
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Your search history will appear here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search within history */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <Search size={16} style={{ color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: '14px',
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* History items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayedHistory.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '16px',
              cursor: item.status === 'completed' ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
            onClick={() => item.status === 'completed' && onSelectResult(item)}
            onMouseEnter={(e) => {
              if (item.status === 'completed') {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: getStatusColor(item.status) }}>
                    {getStatusIcon(item.status)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <p style={{ fontSize: '15px', color: 'white', fontWeight: '500', margin: 0 }}>
                  {item.query}
                </p>
                {item.error && (
                  <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px', margin: 0 }}>
                    {item.error}
                  </p>
                )}
              </div>
              {item.status === 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefreshSearch(item.query);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    color: '#60a5fa',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  }}
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show more button */}
      {filteredHistory.length > 10 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Show {filteredHistory.length - 10} more
          <ChevronDown size={16} />
        </button>
      )}

      {showAll && filteredHistory.length > 10 && (
        <button
          onClick={() => setShowAll(false)}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Show less
        </button>
      )}
    </div>
  );
}
