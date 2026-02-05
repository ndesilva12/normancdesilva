'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'contact' | 'interaction' | 'mission' | 'curate' | 'deep_search' | 'dark_search' | 'recommendation' | 'person';
  title: string;
  subtitle?: string;
  snippet?: string;
  url?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

const typeLabels: Record<string, string> = {
  contact: 'Contact',
  interaction: 'Interaction',
  mission: 'Mission',
  curate: 'Curate',
  deep_search: 'Deep Search',
  dark_search: 'Dark Search',
  recommendation: 'Recommendation',
  person: 'Person',
};

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(q)}&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(() => {
        search(query);
      }, 200);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, search]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const navigateToResult = (result: SearchResult) => {
    if (result.url) {
      router.push(result.url);
      onClose();
    }
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'center',
            paddingTop: '15vh',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '700px',
              margin: '0 16px',
            }}
          >
            {/* Search Container */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.98)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}>
              {/* Search Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
              }}>
                <Search size={22} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search everything..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: 'white',
                    fontSize: '18px',
                    outline: 'none',
                    border: 'none',
                  }}
                />
                {loading && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #6366f1',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                )}
                <button
                  onClick={onClose}
                  style={{
                    padding: '6px',
                    background: 'rgba(148, 163, 184, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Results */}
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {query.length < 2 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <Search size={40} style={{ color: '#475569', margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '20px' }}>
                      Search across all your data
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                      {['Contacts', 'Emails', 'Meetings', 'Search History', 'Recommendations'].map(tag => (
                        <span key={tag} style={{
                          padding: '6px 12px',
                          background: 'rgba(148, 163, 184, 0.08)',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#64748b',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : results.length === 0 && !loading ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ fontSize: '15px' }}>No results found for &quot;{query}&quot;</p>
                  </div>
                ) : (
                  <div style={{ padding: '8px 0' }}>
                    {results.map((result, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={result.id}
                          onClick={() => navigateToResult(result)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          style={{
                            width: '100%',
                            padding: '16px 24px',
                            display: 'flex',
                            alignItems: 'start',
                            gap: '16px',
                            textAlign: 'left',
                            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                            color: 'white',
                          }}
                          onMouseOver={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                          }}
                          onMouseOut={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '15px', 
                              fontWeight: 600, 
                              color: 'white',
                              marginBottom: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div style={{ 
                                fontSize: '14px', 
                                color: '#cbd5e1',
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {result.subtitle}
                              </div>
                            )}
                            {result.snippet && (
                              <div style={{ 
                                fontSize: '13px', 
                                color: '#94a3b8',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {result.snippet}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '4px', flexShrink: 0 }}>
                            <span style={{
                              fontSize: '11px',
                              color: '#64748b',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                            }}>
                              {typeLabels[result.type] || result.type}
                            </span>
                            {result.timestamp && (
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {formatTimestamp(result.timestamp)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {results.length > 0 && (
                <div style={{
                  padding: '12px 24px',
                  borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#64748b',
                }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span>↑↓ navigate</span>
                    <span>↵ select</span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Command size={12} />
                    <span>K to search</span>
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
