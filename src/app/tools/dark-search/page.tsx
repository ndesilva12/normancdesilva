"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Lock, RefreshCw, ExternalLink, Eye, FileSearch, Link2, History, Trash2, ChevronRight } from "lucide-react";

interface DarkSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  type: "long" | "short" | "links";
}

interface HistoryItem {
  id: string;
  query: string;
  results: DarkSearchResult[];
  parameters?: { outputMode?: string };
  timestamp: number;
}

export default function DarkSearchPage() {
  const [query, setQuery] = useState("");
  const [outputMode, setOutputMode] = useState<"long" | "short" | "links">("long");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DarkSearchResult[]>([]);
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
      const res = await fetch('/api/intel-history?tool=dark_search&limit=20');
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

  const saveToHistory = async (q: string, items: DarkSearchResult[]) => {
    try {
      await fetch('/api/intel-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'dark_search',
          query: q,
          results: items,
          parameters: { outputMode },
        }),
      });
      loadHistory();
    } catch (err) {
      console.error('Failed to save to history:', err);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await fetch(`/api/intel-history?tool=dark_search&id=${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setQuery(item.query);
    setResults(item.results);
    if (item.parameters?.outputMode) {
      setOutputMode(item.parameters.outputMode as any);
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

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/dark-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          outputMode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to perform dark search");
      }

      const data = await response.json();
      const items = data.results || [];
      setResults(items);

      if (items.length > 0) {
        await saveToHistory(query.trim(), items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getOutputModeIcon = (mode: string) => {
    switch (mode) {
      case "long": return <FileSearch size={16} />;
      case "short": return <Eye size={16} />;
      case "links": return <Link2 size={16} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0f] via-[#2a1a1e] to-[#1e1626] text-white">
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
                    <History size={18} className="text-red-400" />
                    <span className="font-semibold">Search History</span>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-white/10 rounded">
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loadingHistory ? (
                    <div className="p-4 text-center text-gray-400">
                      <RefreshCw size={20} className="animate-spin mx-auto" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No search history yet</div>
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
                              onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
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
          {!showHistory && !isMobile && (
            <button onClick={() => setShowHistory(true)} className="fixed left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-10">
              <History size={20} />
            </button>
          )}

          {/* Header */}
          <div className="max-w-5xl mx-auto mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <Lock size={24} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Dark Search
              </h1>
            </div>

            <p className="text-gray-400 text-lg">
              Discover hidden content beyond the surface web.
            </p>
          </div>

          {/* Search Interface */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-400 mb-2">What are you searching for?</label>
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Zero-day exploits, academic research..."
                    className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  />
                </div>
              </div>

              {/* Output Mode Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-400 mb-2">Output Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "long", label: "Long Report", desc: "Detailed analysis" },
                    { value: "short", label: "Short Summary", desc: "Quick overview" },
                    { value: "links", label: "Links Only", desc: "Just the sources" },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setOutputMode(mode.value as any)}
                      className={`p-3 rounded-lg border text-sm font-semibold flex flex-col items-center gap-1 transition-all ${
                        outputMode === mode.value
                          ? 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {getOutputModeIcon(mode.value)}
                      <span>{mode.label}</span>
                      <span className="text-xs font-normal opacity-70">{mode.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-red-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
              >
                {loading ? (<><RefreshCw size={20} className="animate-spin" /> Searching...</>) : (<><Lock size={20} /> Dark Search</>)}
              </button>

              {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-w-5xl mx-auto space-y-4">
              {results.map((result, idx) => (
                <a
                  key={idx}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 hover:border-red-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent" />

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-white leading-tight flex-1">{result.title}</h3>
                    <ExternalLink size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  </div>

                  {outputMode !== "links" && (
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">{result.snippet}</p>
                  )}

                  <span className="inline-block text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-semibold">
                    {result.source}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && (
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-700/20 flex items-center justify-center mx-auto mb-6">
                <Lock size={40} className="text-red-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Ready to Explore</h3>
              <p className="text-gray-400">Enter your query to discover hidden content, academic papers, and hard-to-find resources.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
