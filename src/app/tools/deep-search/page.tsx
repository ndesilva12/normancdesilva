"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Radar, RefreshCw, ExternalLink, Lightbulb, AlertTriangle, MessageSquare, Headphones, History, Trash2, ChevronRight } from "lucide-react";

interface DeepSearchReport {
  topic: string;
  briefOverview: string;
  sections: Array<{
    title: string;
    content: string;
    links?: Array<{ title: string; url: string; type: string }>;
  }>;
  hiddenMechanics: string[];
  counterintuitiveInsights: string[];
  expertDebates: string[];
  underreportedAngles: string[];
  socialMediaHighlights: Array<{
    platform: string;
    author: string;
    content: string;
    url: string;
  }>;
  podcastReferences: Array<{
    title: string;
    episode: string;
    timestamp?: string;
    summary: string;
    url: string;
  }>;
}

interface HistoryItem {
  id: string;
  query: string;
  results: DeepSearchReport;
  timestamp: number;
}

export default function DeepSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DeepSearchReport | null>(null);
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
      const res = await fetch('/api/intel-history?tool=deep_search&limit=20');
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

  const saveToHistory = async (q: string, reportData: DeepSearchReport) => {
    try {
      await fetch('/api/intel-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'deep_search',
          query: q,
          results: reportData,
        }),
      });
      loadHistory();
    } catch (err) {
      console.error('Failed to save to history:', err);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await fetch(`/api/intel-history?tool=deep_search&id=${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setQuery(item.query);
    setReport(item.results);
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
    setReport(null);

    try {
      const response = await fetch("/api/deep-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to perform deep search");
      }

      const data = await response.json();
      setReport(data.report);

      // Save to history
      if (data.report) {
        await saveToHistory(query.trim(), data.report);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1a] via-[#1a1a2e] to-[#16213e] text-white">
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
                    <History size={18} className="text-blue-400" />
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
                              <div className="text-xs text-gray-500 mt-1">{formatDate(item.timestamp)}</div>
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Radar size={24} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Deep Search
              </h1>
            </div>

            <p className="text-gray-400 text-lg">
              Multi-source deep research with hidden mechanics and expert insights.
            </p>
          </div>

          {/* Search Interface */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <label className="block text-sm font-semibold text-gray-400 mb-2">What do you want to research deeply?</label>
              <div className="relative mb-4">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Quantum computing applications, AI regulation..."
                  className="w-full pl-12 pr-4 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
              >
                {loading ? (<><RefreshCw size={20} className="animate-spin" /> Researching...</>) : (<><Radar size={20} /> Deep Search</>)}
              </button>

              {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}
            </div>
          </div>

          {/* Results */}
          {report && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Overview */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">Overview</h2>
                <p className="text-gray-300 leading-relaxed">{report.briefOverview}</p>
              </div>

              {/* Hidden Mechanics */}
              {report.hiddenMechanics?.length > 0 && (
                <div className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Lightbulb size={18} className="text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-purple-400">Hidden Mechanics</h2>
                  </div>
                  <ul className="space-y-3">
                    {report.hiddenMechanics.map((m, i) => (
                      <li key={i} className="text-gray-300 leading-relaxed pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-purple-400 before:font-bold">{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Counterintuitive Insights */}
              {report.counterintuitiveInsights?.length > 0 && (
                <div className="backdrop-blur-xl bg-white/5 border border-amber-500/20 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle size={18} className="text-amber-400" />
                    </div>
                    <h2 className="text-xl font-bold text-amber-400">Counterintuitive Insights</h2>
                  </div>
                  <ul className="space-y-3">
                    {report.counterintuitiveInsights.map((insight, i) => (
                      <li key={i} className="text-gray-300 leading-relaxed pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-amber-400 before:font-bold">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expert Debates */}
              {report.expertDebates?.length > 0 && (
                <div className="backdrop-blur-xl bg-white/5 border border-red-500/20 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <MessageSquare size={18} className="text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-red-400">Expert Debates</h2>
                  </div>
                  <ul className="space-y-3">
                    {report.expertDebates.map((debate, i) => (
                      <li key={i} className="text-gray-300 leading-relaxed pl-6 relative before:content-['•'] before:absolute before:left-0 before:text-red-400 before:font-bold">{debate}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Social Media Highlights */}
              {report.socialMediaHighlights?.length > 0 && (
                <div className="backdrop-blur-xl bg-white/5 border border-blue-500/20 rounded-2xl p-6 md:p-8">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">Social Media Highlights</h3>
                  <div className="space-y-3">
                    {report.socialMediaHighlights.map((h, i) => (
                      <a key={i} href={h.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-black/30 rounded-lg border border-white/10 hover:border-blue-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-blue-400 uppercase">{h.platform}</span>
                          <ExternalLink size={14} className="text-gray-500" />
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed mb-2">{h.content}</p>
                        <p className="text-xs text-gray-500">— {h.author}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Podcast References */}
              {report.podcastReferences?.length > 0 && (
                <div className="backdrop-blur-xl bg-white/5 border border-violet-500/20 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Headphones size={18} className="text-violet-400" />
                    <h3 className="text-lg font-bold text-violet-400">Podcast References</h3>
                  </div>
                  <div className="space-y-3">
                    {report.podcastReferences.map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-black/30 rounded-lg border border-white/10 hover:border-violet-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-200">{p.title}</h4>
                          <ExternalLink size={14} className="text-gray-500" />
                        </div>
                        <p className="text-sm text-violet-400 mb-2">{p.episode}{p.timestamp && ` • ${p.timestamp}`}</p>
                        <p className="text-sm text-gray-400 leading-relaxed">{p.summary}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !report && (
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center mx-auto mb-6">
                <Radar size={40} className="text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Ready to Research</h3>
              <p className="text-gray-400">Enter any topic to get a comprehensive deep search report with hidden mechanics, expert insights, and social context.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
