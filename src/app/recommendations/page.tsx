"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Plus, ExternalLink, Check, Clock, Bookmark, Sparkles } from "lucide-react";

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

  const getTypeIcon = (type: string) => {
    if (type === 'video' || type === 'movie') return '🎬';
    if (type === 'book') return '📚';
    if (type === 'article') return '📰';
    if (type === 'podcast') return '🎙️';
    return '⭐';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Bookmark size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Recommendations</h1>
                  <p className="text-slate-400">Curated content to explore</p>
                </div>
              </div>
            </div>
            <button className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-semibold transition-colors flex items-center gap-2">
              <Plus size={18} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/30 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {['all', 'pending', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-lg shadow-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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
                className="w-full pl-12 pr-4 py-2.5 bg-slate-800/50 backdrop-blur border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 focus:bg-slate-800/70 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur rounded-2xl border border-white/10 p-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={28} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No recommendations yet</h3>
              <p className="text-slate-400">Add your first recommendation to get started</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecs.map((rec, i) => (
              <div key={i} className="group bg-slate-800/30 backdrop-blur hover:bg-slate-800/50 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                    {rec.status === 'completed' && (
                      <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <Check size={14} className="text-emerald-400" />
                      </div>
                    )}
                  </div>
                  {rec.type && (
                    <span className="px-2.5 py-1 bg-slate-700/50 border border-white/10 rounded-lg text-xs font-medium text-slate-300 capitalize">
                      {rec.type}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-white mb-2 group-hover:text-pink-400 transition-colors line-clamp-2">
                  {rec.title}
                </h3>

                {rec.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">{rec.description}</p>
                )}

                {rec.source && (
                  <div className="mb-4 text-xs text-slate-500">
                    Recommended by {rec.source}
                  </div>
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
