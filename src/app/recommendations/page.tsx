'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  Plus,
  Search,
  RefreshCw,
  Check,
  Archive,
  Trash2,
  X,
  ExternalLink,
  CloudDownload,
  Film,
  BookOpen,
  FileText,
  Video,
  Headphones,
  User,
  Hash,
  MoreHorizontal
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  status: 'pending' | 'completed' | 'archived';
  createdAt: number;
  completedAt?: number;
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  movie: { icon: Film, color: '#f43f5e', label: 'Movie' },
  book: { icon: BookOpen, color: '#8b5cf6', label: 'Book' },
  article: { icon: FileText, color: '#3b82f6', label: 'Article' },
  video: { icon: Video, color: '#ef4444', label: 'Video' },
  podcast: { icon: Headphones, color: '#10b981', label: 'Podcast' },
  person: { icon: User, color: '#f59e0b', label: 'Person' },
  topic: { icon: Hash, color: '#6366f1', label: 'Topic' },
  other: { icon: MoreHorizontal, color: '#6b7280', label: 'Other' },
};

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'archived'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'article',
    title: '',
    description: '',
    source: '',
    url: '',
  });

  const loadRecommendations = useCallback(async () => {
    try {
      const res = await fetch(`/api/recommendations?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const filteredRecommendations = searchQuery
    ? recommendations.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.source?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recommendations;

  // Group by type
  const groupedByType = filteredRecommendations.reduce((acc, rec) => {
    const type = rec.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(rec);
    return acc;
  }, {} as Record<string, Recommendation[]>);

  const syncFromNotion = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync: true }),
      });
      if (res.ok) {
        loadRecommendations();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setSyncing(false);
  };

  const updateStatus = async (id: string, status: 'pending' | 'completed' | 'archived') => {
    try {
      const res = await fetch('/api/recommendations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(prev => prev.map(r => r.id === id ? data.recommendation : r));
        // If the item no longer matches the filter, remove it
        if (statusFilter !== 'all' && status !== statusFilter) {
          setRecommendations(prev => prev.filter(r => r.id !== id));
        }
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const deleteRecommendation = async (id: string) => {
    try {
      const res = await fetch(`/api/recommendations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecommendations(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const addRecommendation = async () => {
    if (!formData.title.trim()) return;

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(prev => [data.recommendation, ...prev]);
        setShowAddModal(false);
        setFormData({ type: 'article', title: '', description: '', source: '', url: '' });
      }
    } catch (err) {
      console.error('Add failed:', err);
    }
  };

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-pink-400" />
          <p className="text-gray-400">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white">
      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Bookmark size={48} />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                Recommendations
              </h1>
              <p className="text-gray-400">Things to watch, read, and explore</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={syncFromNotion}
              disabled={syncing}
              className="px-4 py-2 bg-white/10 rounded-xl font-medium flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <CloudDownload size={18} className={syncing ? 'animate-pulse' : ''} />
              {syncing ? 'Syncing...' : 'Sync Notion'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-pink-500/20 transition-all"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1200px] mx-auto px-8 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            {(['pending', 'completed', 'archived', 'all'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recommendations..."
              className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-8 pb-12">
        {Object.keys(groupedByType).length === 0 ? (
          <div className="text-center py-16">
            <Bookmark size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No recommendations found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByType).map(([type, items]) => {
              const config = typeConfig[type] || typeConfig.other;
              const Icon = config.icon;

              return (
                <div key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${config.color}20` }}
                    >
                      <Icon size={18} style={{ color: config.color }} />
                    </div>
                    <h2 className="text-xl font-bold" style={{ color: config.color }}>
                      {config.label}
                    </h2>
                    <span className="text-gray-500 text-sm">({items.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((rec) => (
                      <motion.div
                        key={rec.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold line-clamp-2">{rec.title}</h3>
                          {rec.url && (
                            <a
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                            >
                              <ExternalLink size={14} className="text-gray-400" />
                            </a>
                          )}
                        </div>

                        {rec.description && (
                          <p className="text-gray-400 text-sm line-clamp-2 mb-3">{rec.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {rec.source && <span>From {rec.source}</span>}
                            {!rec.source && <span>{formatDate(rec.createdAt)}</span>}
                          </div>

                          <div className="flex gap-1">
                            {rec.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(rec.id, 'completed')}
                                  className="p-1.5 hover:bg-green-500/20 rounded transition-colors"
                                  title="Mark complete"
                                >
                                  <Check size={14} className="text-green-400" />
                                </button>
                                <button
                                  onClick={() => updateStatus(rec.id, 'archived')}
                                  className="p-1.5 hover:bg-gray-500/20 rounded transition-colors"
                                  title="Archive"
                                >
                                  <Archive size={14} className="text-gray-400" />
                                </button>
                              </>
                            )}
                            {rec.status === 'completed' && (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <Check size={12} /> Done
                              </span>
                            )}
                            {rec.status === 'archived' && (
                              <button
                                onClick={() => updateStatus(rec.id, 'pending')}
                                className="text-xs text-gray-500 hover:text-white"
                              >
                                Restore
                              </button>
                            )}
                            <button
                              onClick={() => deleteRecommendation(rec.id)}
                              className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl max-w-lg w-full border border-white/10"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Add Recommendation</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(typeConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setFormData(prev => ({ ...prev, type: key }))}
                          className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                            formData.type === key
                              ? 'border-pink-500 bg-pink-500/20'
                              : 'border-white/10 bg-black/20 hover:bg-white/5'
                          }`}
                        >
                          <Icon size={16} style={{ color: config.color }} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What was recommended?"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Source</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="Who recommended it?"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={2}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addRecommendation}
                  disabled={!formData.title.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl font-medium disabled:opacity-50"
                >
                  Add Recommendation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
