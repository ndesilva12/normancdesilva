"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Search, Filter, RefreshCw, ExternalLink, Clock, TrendingUp, Zap, BookOpen, History, Trash2, ChevronRight } from "lucide-react";

interface CuratedItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  duration: string;
  category: 'short-unique' | 'short-trending' | 'long-unique' | 'long-trending';
}

interface HistoryItem {
  id: string;
  query: string;
  results: CuratedItem[];
  parameters?: { source?: string };
  timestamp: number;
}

export default function CuratePage() {
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CuratedItem[]>([]);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/intel-history?tool=curate&limit=20');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const saveToHistory = async (query: string, items: CuratedItem[]) => {
    try {
      await fetch('/api/intel-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'curate',
          query,
          results: items,
          parameters: { source },
        }),
      });
      loadHistory();
    } catch (err) {
      console.error('Failed to save to history:', err);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await fetch(`/api/intel-history?tool=curate&id=${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setTopic(item.query);
    setResults(item.results);
    if (item.parameters?.source) {
      setSource(item.parameters.source);
    }
  };

  const handleCurate = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() || "general", source }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to curate content");
      }

      const data = await response.json();
      const items = data.items || [];
      setResults(items);

      // Save to history
      if (items.length > 0) {
        await saveToHistory(topic.trim() || "general", items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'short-unique': return <Zap size={16} />;
      case 'short-trending': return <TrendingUp size={16} />;
      case 'long-unique': return <BookOpen size={16} />;
      case 'long-trending': return <Sparkles size={16} />;
      default: return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'short-unique': return 'Quick Insight';
      case 'short-trending': return 'Trending Now';
      case 'long-unique': return 'Deep Dive';
      case 'long-trending': return 'Popular Deep Dive';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'short-unique': return '#8b5cf6';
      case 'short-trending': return '#f59e0b';
      case 'long-unique': return '#3b82f6';
      case 'long-trending': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group results by category
  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CuratedItem[]>);

  const categoryOrder = ['short-unique', 'short-trending', 'long-unique', 'long-trending'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white">
      <div className="flex">
        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && !isMobile && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-screen sticky top-0 border-r border-white/10 overflow-hidden"
            >
              <div className="w-80 h-full flex flex-col bg-black/20">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History size={18} className="text-purple-400" />
                    <span className="font-semibold">Search History</span>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="p-4 text-center text-gray-400">
                      <RefreshCw size={20} className="animate-spin mx-auto" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No search history yet
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="group p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                          onClick={() => loadFromHistory(item)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.query}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                <span>{formatDate(item.timestamp)}</span>
                                <span>•</span>
                                <span>{item.results.length} results</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(item.id);
                              }}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8">
          {/* Show History Button (when hidden) */}
          {!showHistory && !isMobile && (
            <button
              onClick={() => setShowHistory(true)}
              className="fixed left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-10"
            >
              <History size={20} />
            </button>
          )}

          {/* Header */}
          <div className="max-w-5xl mx-auto mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Curate
              </h1>
            </div>

            <p className="text-gray-400 text-lg">
              Discover intellectually rigorous content tailored to your worldview.
            </p>
          </div>

          {/* Search Interface */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-[1fr,200px] gap-4 mb-4">
                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Topic or &quot;general&quot; for chaos mode
                  </label>
                  <div className="relative">
                    <Search
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Federal Reserve, Austrian economics..."
                      className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCurate();
                      }}
                    />
                  </div>
                </div>

                {/* Source Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Source Filter
                  </label>
                  <div className="relative">
                    <Filter
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer appearance-none"
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
              </div>

              {/* Curate Button */}
              <button
                onClick={handleCurate}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Curating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Curate Content
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-w-5xl mx-auto">
              {categoryOrder.map((category) => {
                const items = groupedResults[category];
                if (!items || items.length === 0) return null;

                return (
                  <div key={category} className="mb-12">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b-2" style={{ borderColor: getCategoryColor(category) }}>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${getCategoryColor(category)}20`, color: getCategoryColor(category) }}
                      >
                        {getCategoryIcon(category)}
                      </div>
                      <h2 className="text-2xl font-bold" style={{ color: getCategoryColor(category) }}>
                        {getCategoryLabel(category)}
                      </h2>
                      <span className="text-gray-500 font-semibold">({items.length})</span>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {items.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 hover:border-opacity-50 hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden group"
                          style={{ ['--hover-color' as string]: getCategoryColor(category) }}
                        >
                          {/* Gradient Accent */}
                          <div
                            className="absolute top-0 left-0 right-0 h-0.5"
                            style={{ background: `linear-gradient(90deg, ${getCategoryColor(category)}, transparent)` }}
                          />

                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-bold text-white leading-tight flex-1">
                              {item.title}
                            </h3>
                            <ExternalLink
                              size={16}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: getCategoryColor(category) }}
                            />
                          </div>

                          <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            {item.summary}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <span className="text-xs text-gray-500 font-semibold">{item.source}</span>
                            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: getCategoryColor(category) }}>
                              <Clock size={14} />
                              {item.duration}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && (
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={40} className="text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Ready to Discover</h3>
              <p className="text-gray-400">
                Enter a topic you want to explore, or leave it blank for a curated mix of fascinating content.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
