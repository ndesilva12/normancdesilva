'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command } from 'lucide-react';

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
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'start',
            justifyContent: 'center',
            paddingTop: '20vh',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '900px',
              margin: '0 24px',
            }}
          >
            {/* Glass Search Input */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}>
              <Search size={28} style={{ color: '#94a3b8', flexShrink: 0 }} />
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
                  fontSize: '22px',
                  fontWeight: 400,
                  outline: 'none',
                  border: 'none',
                  letterSpacing: '-0.01em',
                }}
              />
              {loading && (
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(99, 102, 241, 0.3)',
                  borderTopColor: '#6366f1',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
              )}
              <div style={{ 
                fontSize: '13px', 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}>
                <Command size={14} />
                <span>K</span>
              </div>
            </div>

            {/* Results Panel - only show when there are results */}
            {query.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                style={{
                  marginTop: '16px',
                  background: 'rgba(30, 41, 59, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                }}
              >
                {results.length === 0 && !loading ? (
                  <div style={{ padding: '48px 32px', textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ fontSize: '16px' }}>No results found</p>
                  </div>
                ) : (
                  <div style={{ padding: '8px' }}>
                    {results.map((result, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={result.id}
                          onClick={() => navigateToResult(result)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          style={{
                            width: '100%',
                            padding: '18px 20px',
                            display: 'flex',
                            alignItems: 'start',
                            gap: '16px',
                            textAlign: 'left',
                            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                            color: 'white',
                          }}
                          onMouseOver={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)';
                          }}
                          onMouseOut={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '16px', 
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
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
