"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Filter, Plus, ExternalLink, Check } from "lucide-react";

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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">Recommendations</h1>
              <p className="text-gray-400">Things to watch, read, and explore</p>
            </div>
            <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Plus size={16} />
              Add Recommendation
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/[0.08] bg-black/20">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              {['all', 'pending', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : filteredRecs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No recommendations found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecs.map((rec, i) => (
              <div key={i} className="p-5 bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.15] rounded-lg transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1 line-clamp-2">{rec.title}</h3>
                    {rec.type && (
                      <span className="inline-block px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded text-xs text-gray-400 capitalize">
                        {rec.type}
                      </span>
                    )}
                  </div>
                  {rec.status === 'completed' && (
                    <Check size={16} className="text-green-500 flex-shrink-0 ml-2" />
                  )}
                </div>

                {rec.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{rec.description}</p>
                )}

                {rec.url && (
                  <a 
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    View <ExternalLink size={12} />
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
