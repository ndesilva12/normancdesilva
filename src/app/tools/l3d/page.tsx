"use client";
import { IntelToolHistory } from "@/components/IntelToolHistory";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Search, Clock, CheckCircle, XCircle } from "lucide-react";

interface HistoryItem {
  id: string;
  query: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  completed_at?: string;
  results?: any;
  error?: string;
}

export default function L3DPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/l3d');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/l3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      if (res.ok) {
        setQuery('');
        loadHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10b981 0%, #1e293b 50%, #0f172a 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link href="/" style={{ 
          color: '#94a3b8', 
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'inline-block'
        }}>
          ← Back to Dashboard
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', marginTop: '24px' }}>
          <TrendingUp size={48} style={{ color: '#34d399' }} />
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
          }}>
            L3D (Last 30 Days)
          </h1>
        </div>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          Research recent trends & insights from the last 30 days
        </p>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '48px' }}>
          <input
            type="text"
            placeholder="Enter topic to research recent trends..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '20px 24px',
              fontSize: '16px',
              background: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: 'white',
              outline: 'none',
            }}
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '20px 40px',
              background: loading ? 'rgba(16, 185, 129, 0.5)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Search size={18} />
            {loading ? 'Researching...' : 'Research'}
          </button>
        </div>

        {/* History */}
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: 'white',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <Clock size={24} />
            Research History
          </h2>

          {history.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              background: 'rgba(30, 41, 59, 0.4)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <TrendingUp size={48} style={{ color: '#64748b', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', color: 'white', marginBottom: '8px' }}>
                No research yet
              </h3>
              <p style={{ color: '#94a3b8' }}>
                Enter a topic above to research recent trends
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.status === 'completed' && setSelectedResult(item)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    cursor: item.status === 'completed' ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (item.status === 'completed') {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        {item.status === 'running' && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: '3px solid rgba(16, 185, 129, 0.3)',
                            borderTopColor: '#10b981',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }} />
                        )}
                        {item.status === 'completed' && <CheckCircle size={20} style={{ color: '#10b981' }} />}
                        {item.status === 'failed' && <XCircle size={20} style={{ color: '#ef4444' }} />}
                        
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: 'white',
                          margin: 0,
                        }}>
                          {item.query}
                        </h3>
                      </div>
                      
                      <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                        {new Date(item.timestamp).toLocaleString()}
                        {item.status === 'completed' && ' • Click to view results'}
                        {item.status === 'failed' && ` • Error: ${item.error}`}
                      </div>
                    </div>

                    <div style={{
                      padding: '6px 16px',
                      background: item.status === 'running' ? 'rgba(251, 191, 36, 0.15)' : 
                                 item.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' :
                                 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${item.status === 'running' ? 'rgba(251, 191, 36, 0.3)' : 
                                           item.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' :
                                           'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: item.status === 'running' ? '#fbbf24' : 
                             item.status === 'completed' ? '#10b981' :
                             '#ef4444',
                      textTransform: 'capitalize',
                    }}>
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Modal */}
        {selectedResult && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setSelectedResult(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '900px',
                maxHeight: '80vh',
                background: 'rgba(30, 41, 59, 0.98)',
                borderRadius: '20px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '32px',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0 }}>
                  {selectedResult.query}
                </h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
              
              <pre style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '20px',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#cbd5e1',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflow: 'auto',
              }}>
                {JSON.stringify(selectedResult.results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
