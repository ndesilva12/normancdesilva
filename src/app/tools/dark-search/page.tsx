"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Lock, RefreshCw, ExternalLink, Eye, FileSearch, Link2, History, Trash2, ChevronRight } from "lucide-react";

interface DarkSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export default function DarkSearchPage() {
  const [query, setQuery] = useState("");
  const [outputMode, setOutputMode] = useState<"long" | "short" | "links">("long");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DarkSearchResult[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch('/api/dark-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), outputMode })
      });
      
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a0f] via-[#2a1a1e] to-[#1e1626] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
          ← Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
            <Lock size={24} />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            Dark Search
          </h1>
        </div>
        <p className="text-gray-400 text-lg mb-8">Discover hidden content beyond the surface web.</p>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-3">Search Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "long", icon: FileSearch, label: "Long", desc: "Full report" },
                { value: "short", icon: Eye, label: "Short", desc: "2 paragraphs, 3 links" },
                { value: "links", icon: Link2, label: "Links", desc: "3 sentences, 10+ links" }
              ].map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    onClick={() => setOutputMode(mode.value as any)}
                    disabled={loading}
                    className={`p-4 rounded-xl border-2 font-semibold flex flex-col items-center gap-2 transition-all ${
                      outputMode === mode.value
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Icon size={24} />
                    <div className="text-center">
                      <div className="font-bold">{mode.label}</div>
                      <div className="text-xs font-normal opacity-70 mt-1">{mode.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-sm font-semibold text-gray-400 mb-2">What are you searching for?</label>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g., Zero-day exploits, academic research..."
              className="flex-1 px-4 py-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-red-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Lock size={20} />
                Dark Search
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 hover:border-red-500 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-white flex-1">{result.title}</h3>
                  <ExternalLink size={16} className="text-red-400 flex-shrink-0" />
                </div>
                {outputMode !== "links" && (
                  <p className="text-gray-400 text-sm mb-3">{result.snippet}</p>
                )}
                <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-semibold">
                  {result.source}
                </span>
              </a>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-700/20 flex items-center justify-center mx-auto mb-6">
              <Lock size={40} className="text-red-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Ready to Explore</h3>
            <p className="text-gray-400">Enter your query to discover hidden content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
