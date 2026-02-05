"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Bookmark, ExternalLink, Check } from "lucide-react";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecs = recommendations
    .filter(r => r.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(r => statusFilter === 'all' || r.status === statusFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Header */}
      <div className="bg-[#1e293b]/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Bookmark size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Recommendations</h1>
                <p className="text-slate-400">Curated content</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-pink-600/30 transition-all flex items-center gap-2">
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {['all', 'pending', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 pb-12">
        {loading ? (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-16 shadow-2xl text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-16 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Bookmark size={32} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No recommendations yet</h3>
            <p className="text-slate-400">Add your first recommendation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecs.map((rec, i) => (
              <div key={i} className="bg-[#1e293b] hover:bg-[#1e293b]/80 border border-slate-700/50 rounded-2xl p-6 transition-all shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  {rec.type && (
                    <span className="px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-xs font-medium text-slate-300 capitalize">
                      {rec.type}
                    </span>
                  )}
                  {rec.status === 'completed' && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <Check size={16} className="text-emerald-400" />
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-white mb-2 line-clamp-2">{rec.title}</h3>

                {rec.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">{rec.description}</p>
                )}

                {rec.url && (
                  <a 
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    View
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
