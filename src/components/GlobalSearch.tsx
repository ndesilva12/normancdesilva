'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Users,
  Mail,
  Calendar,
  FileText,
  Bookmark,
  User,
  Layers,
  Zap,
  Eye,
  ArrowRight,
  Command
} from 'lucide-react';

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

const typeConfig = {
  contact: { icon: Users, color: '#a855f7', label: 'Contact' },
  interaction: { icon: Mail, color: '#06b6d4', label: 'Interaction' },
  mission: { icon: Layers, color: '#f59e0b', label: 'Mission' },
  curate: { icon: Zap, color: '#10b981', label: 'Curate' },
  deep_search: { icon: Eye, color: '#6366f1', label: 'Deep Search' },
  dark_search: { icon: Eye, color: '#ef4444', label: 'Dark Search' },
  recommendation: { icon: Bookmark, color: '#ec4899', label: 'Recommendation' },
  person: { icon: User, color: '#8b5cf6', label: 'Person' },
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

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-4"
          >
            {/* Search Container */}
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Search size={20} className="text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search everything..."
                  className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-500"
                />
                {loading && (
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                )}
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">esc</kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto">
                {query.length < 2 ? (
                  <div className="p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <Search size={32} className="mx-auto mb-3 opacity-50" />
                      <p>Search across all your data</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-white/5 rounded">Contacts</span>
                      <span className="px-2 py-1 bg-white/5 rounded">Emails</span>
                      <span className="px-2 py-1 bg-white/5 rounded">Meetings</span>
                      <span className="px-2 py-1 bg-white/5 rounded">Search History</span>
                      <span className="px-2 py-1 bg-white/5 rounded">Recommendations</span>
                    </div>
                  </div>
                ) : results.length === 0 && !loading ? (
                  <div className="p-8 text-center text-gray-400">
                    <p>No results found for &quot;{query}&quot;</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {Object.entries(groupedResults).map(([type, typeResults]) => {
                      const config = typeConfig[type as keyof typeof typeConfig];
                      const Icon = config?.icon || FileText;

                      return (
                        <div key={type}>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Icon size={14} style={{ color: config?.color }} />
                            {config?.label || type}
                          </div>
                          {typeResults.map((result) => {
                            const currentIndex = flatIndex++;
                            const isSelected = currentIndex === selectedIndex;

                            return (
                              <button
                                key={result.id}
                                onClick={() => navigateToResult(result)}
                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                                  isSelected ? 'bg-purple-500/20' : 'hover:bg-white/5'
                                }`}
                              >
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ background: `${config?.color}20` }}
                                >
                                  <Icon size={20} style={{ color: config?.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white truncate">{result.title}</div>
                                  {result.subtitle && (
                                    <div className="text-sm text-gray-400 truncate">{result.subtitle}</div>
                                  )}
                                  {result.snippet && (
                                    <div className="text-xs text-gray-500 truncate mt-0.5">{result.snippet}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {result.timestamp && (
                                    <span className="text-xs text-gray-500">{formatTimestamp(result.timestamp)}</span>
                                  )}
                                  {isSelected && <ArrowRight size={16} className="text-purple-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd>
                    select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Command size={12} />
                  <span>K to search</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
