"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Lock, RefreshCw, ExternalLink, Eye, FileSearch, Link2, History, Trash2, ChevronRight } from "lucide-react";

export default function DarkSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dark-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #000000 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link href="/" style={{ 
          color: '#6b7280', 
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'inline-block'
        }}>
          ← Back to Dashboard
        </Link>
        
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: '#dc2626',
          marginTop: '24px',
          marginBottom: '12px'
        }}>
          Dark Search
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '40px' }}>
          Deep web research & hidden insights
        </p>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Enter sensitive research query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '20px 24px',
              fontSize: '16px',
              background: 'rgba(26, 26, 26, 0.9)',
              border: '1px solid rgba(107, 114, 128, 0.3)',
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
              background: loading ? 'rgba(220, 38, 38, 0.5)' : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '16px',
            padding: '32px',
          }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626', marginBottom: '24px' }}>
              Results
            </h2>
            <div style={{ fontSize: '16px', color: '#9ca3af', lineHeight: '1.8' }}>
              {JSON.stringify(results, null, 2)}
            </div>
          </div>
        )}

        {!results && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px',
            background: 'rgba(26, 26, 26, 0.5)',
            borderRadius: '16px',
            border: '1px solid rgba(107, 114, 128, 0.2)'
          }}>
            <h3 style={{ fontSize: '24px', color: '#dc2626', marginBottom: '12px' }}>
              Ready to investigate
            </h3>
            <p style={{ color: '#6b7280' }}>
              Enter a query above for deep web research
            </p>
          </div>
        )}

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
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-400 mb-3">Search Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setOutputMode("long")}
                    disabled={loading}
                    className={`p-4 rounded-xl border-2 font-semibold flex flex-col items-center gap-2 transition-all ${
                      outputMode === "long"
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <FileSearch size={24} />
                    <div className="text-center">
                      <div className="font-bold">Long</div>
                      <div className="text-xs font-normal opacity-70 mt-1">Full report</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setOutputMode("short")}
                    disabled={loading}
                    className={`p-4 rounded-xl border-2 font-semibold flex flex-col items-center gap-2 transition-all ${
                      outputMode === "short"
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Eye size={24} />
                    <div className="text-center">
                      <div className="font-bold">Short</div>
                      <div className="text-xs font-normal opacity-70 mt-1">2 paragraphs, 3 links</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setOutputMode("links")}
                    disabled={loading}
                    className={`p-4 rounded-xl border-2 font-semibold flex flex-col items-center gap-2 transition-all ${
                      outputMode === "links"
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : 'bg-black/30 border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Link2 size={24} />
                    <div className="text-center">
                      <div className="font-bold">Links</div>
                      <div className="text-xs font-normal opacity-70 mt-1">3 sentences, 10+ links</div>
                    </div>
                  </button>
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
