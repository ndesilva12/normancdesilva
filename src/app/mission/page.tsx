'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  X,
  Layers,
  Clock,
  CheckCircle2,
  Archive,
  Link as LinkIcon,
  ExternalLink,
  GripVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

interface MissionItem {
  id: string;
  title: string;
  description?: string;
  links?: string[];
  status: 'created' | 'processing' | 'filed';
  createdAt: number;
  movedToProcessingAt?: number;
  filedAt?: number;
  order: number;
}

type Status = 'created' | 'processing' | 'filed';

const statusConfig = {
  created: {
    label: 'Created',
    icon: Clock,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  processing: {
    label: 'Processing',
    icon: Layers,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  filed: {
    label: 'Filed',
    icon: CheckCircle2,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
};

export default function MissionControl() {
  const [items, setItems] = useState<MissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MissionItem | null>(null);
  const [expandedFiled, setExpandedFiled] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLinks, setNewLinks] = useState('');

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch('/api/mission');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = async () => {
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          links: newLinks.split('\n').map(l => l.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setItems(prev => [...prev, data.item]);
        setNewTitle('');
        setNewDescription('');
        setNewLinks('');
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const updateItem = async (item: MissionItem, updates: Partial<MissionItem>) => {
    try {
      const res = await fetch('/api/mission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...updates }),
      });

      if (res.ok) {
        const data = await res.json();
        setItems(prev => prev.map(i => i.id === item.id ? data.item : i));
      }
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/mission?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const moveItem = async (item: MissionItem, newStatus: Status) => {
    await updateItem(item, { status: newStatus });
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    await updateItem(editingItem, {
      title: newTitle.trim(),
      description: newDescription.trim(),
      links: newLinks.split('\n').map(l => l.trim()).filter(Boolean),
    });

    setEditingItem(null);
    setNewTitle('');
    setNewDescription('');
    setNewLinks('');
  };

  const openEdit = (item: MissionItem) => {
    setEditingItem(item);
    setNewTitle(item.title);
    setNewDescription(item.description || '');
    setNewLinks((item.links || []).join('\n'));
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

  const getItemsByStatus = (status: Status) =>
    items.filter(item => item.status === status).sort((a, b) => a.order - b.order);

  const createdItems = getItemsByStatus('created');
  const processingItems = getItemsByStatus('processing');
  const filedItems = getItemsByStatus('filed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-indigo-400" />
          <p className="text-gray-400">Loading mission items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Layers size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Mission Control
              </h1>
              <p className="text-gray-400">Track and manage your tasks and projects</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Created Column */}
          <div className="backdrop-blur-xl rounded-2xl border overflow-hidden"
            style={{
              background: statusConfig.created.bgColor,
              borderColor: statusConfig.created.borderColor,
            }}>
            <div className="p-4 border-b" style={{ borderColor: statusConfig.created.borderColor }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={20} style={{ color: statusConfig.created.color }} />
                  <span className="font-semibold">Created</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: statusConfig.created.color, color: '#000' }}>
                  {createdItems.length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 min-h-[300px]">
              <AnimatePresence>
                {createdItems.map((item) => (
                  <MissionCard
                    key={item.id}
                    item={item}
                    onMove={moveItem}
                    onEdit={openEdit}
                    onDelete={deleteItem}
                    formatDate={formatDate}
                  />
                ))}
              </AnimatePresence>
              {createdItems.length === 0 && (
                <p className="text-gray-500 text-center py-8 text-sm">No items yet</p>
              )}
            </div>
          </div>

          {/* Processing Column */}
          <div className="backdrop-blur-xl rounded-2xl border overflow-hidden"
            style={{
              background: statusConfig.processing.bgColor,
              borderColor: statusConfig.processing.borderColor,
            }}>
            <div className="p-4 border-b" style={{ borderColor: statusConfig.processing.borderColor }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={20} style={{ color: statusConfig.processing.color }} />
                  <span className="font-semibold">Processing</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: statusConfig.processing.color, color: '#fff' }}>
                  {processingItems.length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 min-h-[300px]">
              <AnimatePresence>
                {processingItems.map((item) => (
                  <MissionCard
                    key={item.id}
                    item={item}
                    onMove={moveItem}
                    onEdit={openEdit}
                    onDelete={deleteItem}
                    formatDate={formatDate}
                  />
                ))}
              </AnimatePresence>
              {processingItems.length === 0 && (
                <p className="text-gray-500 text-center py-8 text-sm">No items in progress</p>
              )}
            </div>
          </div>

          {/* Filed Column */}
          <div className="backdrop-blur-xl rounded-2xl border overflow-hidden"
            style={{
              background: statusConfig.filed.bgColor,
              borderColor: statusConfig.filed.borderColor,
            }}>
            <div className="p-4 border-b" style={{ borderColor: statusConfig.filed.borderColor }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} style={{ color: statusConfig.filed.color }} />
                  <span className="font-semibold">Filed</span>
                </div>
                <button
                  onClick={() => setExpandedFiled(!expandedFiled)}
                  className="flex items-center gap-1"
                >
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: statusConfig.filed.color, color: '#000' }}>
                    {filedItems.length}
                  </span>
                  {expandedFiled ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3 min-h-[300px]">
              <AnimatePresence>
                {(expandedFiled ? filedItems : filedItems.slice(0, 5)).map((item) => (
                  <MissionCard
                    key={item.id}
                    item={item}
                    onMove={moveItem}
                    onEdit={openEdit}
                    onDelete={deleteItem}
                    formatDate={formatDate}
                    compact
                  />
                ))}
              </AnimatePresence>
              {filedItems.length === 0 && (
                <p className="text-gray-500 text-center py-8 text-sm">No filed items</p>
              )}
              {filedItems.length > 5 && !expandedFiled && (
                <button
                  onClick={() => setExpandedFiled(true)}
                  className="w-full text-center py-2 text-sm text-gray-400 hover:text-white"
                >
                  Show {filedItems.length - 5} more...
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingItem) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAddModal(false);
              setEditingItem(null);
              setNewTitle('');
              setNewDescription('');
              setNewLinks('');
            }}
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
                  <h2 className="text-xl font-bold">
                    {editingItem ? 'Edit Item' : 'Add New Item'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingItem(null);
                      setNewTitle('');
                      setNewDescription('');
                      setNewLinks('');
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Add more details..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Links (one per line)</label>
                  <textarea
                    value={newLinks}
                    onChange={(e) => setNewLinks(e.target.value)}
                    placeholder="https://example.com&#10;https://another.com"
                    rows={2}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                    setNewTitle('');
                    setNewDescription('');
                    setNewLinks('');
                  }}
                  className="px-5 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingItem ? saveEdit : addItem}
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-medium disabled:opacity-50"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mission Card Component
function MissionCard({
  item,
  onMove,
  onEdit,
  onDelete,
  formatDate,
  compact = false,
}: {
  item: MissionItem;
  onMove: (item: MissionItem, status: Status) => void;
  onEdit: (item: MissionItem) => void;
  onDelete: (id: string) => void;
  formatDate: (ts: number) => string;
  compact?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all ${
        compact ? 'p-3' : 'p-4'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${compact ? 'text-sm' : 'text-base'} truncate`}>
            {item.title}
          </h3>
          {!compact && item.description && (
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>

        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Edit2 size={14} className="text-gray-400" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Links */}
      {!compact && item.links && item.links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.links.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-cyan-400 hover:bg-white/20 transition-colors"
            >
              <LinkIcon size={12} />
              <span className="truncate max-w-[150px]">
                {new URL(link).hostname}
              </span>
              <ExternalLink size={10} />
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>

        {/* Move buttons */}
        <div className="flex gap-1">
          {item.status !== 'created' && (
            <button
              onClick={() => onMove(item, item.status === 'filed' ? 'processing' : 'created')}
              className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
            >
              ← Back
            </button>
          )}
          {item.status !== 'filed' && (
            <button
              onClick={() => onMove(item, item.status === 'created' ? 'processing' : 'filed')}
              className="px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 transition-colors"
            >
              {item.status === 'created' ? 'Start →' : 'File →'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
