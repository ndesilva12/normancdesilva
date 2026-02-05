"use client";
import { IntelToolHistory } from "@/components/IntelToolHistory";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Search, Clock, CheckCircle, XCircle } from "lucide-react";

interface HistoryItem {
  id: string;
  query: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  completed_at?: string;
  results?: any;
  error?: string;
}

export default function CuratePage() {
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("all");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/curate');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleCurate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic, source }),
      });
      
      if (res.ok) {
        setTopic('');
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
      background: 'linear-gradient(135deg, #8b5cf6 0%, #1e293b 50%, #0f172a 100%)',
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
          <Sparkles size={48} style={{ color: '#a78bfa' }} />
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
          }}>
            Curate
          </h1>
        </div>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          AI-powered content curation tailored to your worldview
        </p>

        {/* Search Input */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '48px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#94a3b8', 
                marginBottom: '8px' 
              }}>
                Topic
              </label>
              <input
                type="text"
                placeholder="Enter topic or 'general' for discovery..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCurate()}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#94a3b8', 
                marginBottom: '8px' 
              }}>
                Source Filter
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23ffffff\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '36px',
                }}
              >
                <option value="all">All Sources</option>
                <option value="x">X (Twitter)</option>
                <option value="reddit">Reddit</option>
                <option value="youtube">YouTube</option>
                <option value="articles">Articles</option>
                <option value="podcasts">Podcasts</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleCurate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <Sparkles size={20} />
            {loading ? 'Curating...' : 'Curate Content'}
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
            Curation History
          </h2>

          {history.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              background: 'rgba(30, 41, 59, 0.4)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <Sparkles size={48} style={{ color: '#64748b', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', color: 'white', marginBottom: '8px' }}>
                No curations yet
              </h3>
              <p style={{ color: '#94a3b8' }}>
                Enter a topic above to start discovering content
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
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
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
                            border: '3px solid rgba(139, 92, 246, 0.3)',
                            borderTopColor: '#8b5cf6',
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
                border: '1px solid rgba(139, 92, 246, 0.3)',
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
