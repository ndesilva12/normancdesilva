"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Layers, CheckCircle2, Clock, Archive } from "lucide-react";

interface MissionItem {
  id: string;
  title: string;
  description?: string;
  status: 'created' | 'processing' | 'filed';
}

export default function MissionPage() {
  const [items, setItems] = useState<MissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await fetch('/api/mission');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load mission items:', err);
    } finally {
      setLoading(false);
    }
  };

  const getItemsByStatus = (status: string) => items.filter(i => i.status === status);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'created') return <Clock size={16} className="text-amber-400" />;
    if (status === 'processing') return <Layers size={16} className="text-blue-400" />;
    return <CheckCircle2 size={16} className="text-emerald-400" />;
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
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Layers size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Mission Control</h1>
                  <p className="text-slate-400">Workflow pipeline</p>
                </div>
              </div>
            </div>
            <button className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-semibold transition-colors flex items-center gap-2">
              <Plus size={18} />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Created */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-400" />
                <h2 className="font-semibold text-white">Created</h2>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-medium text-amber-400">
                {getItemsByStatus('created').length}
              </span>
            </div>
            <div className="space-y-3">
              {getItemsByStatus('created').map(item => (
                <div key={item.id} className="group bg-slate-800/40 backdrop-blur hover:bg-slate-800/60 border border-white/10 hover:border-amber-500/30 rounded-xl p-5 cursor-pointer transition-all">
                  <h3 className="font-medium text-white mb-2 group-hover:text-amber-400 transition-colors">{item.title}</h3>
                  {item.description && <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>}
                </div>
              ))}
              {getItemsByStatus('created').length === 0 && (
                <div className="bg-slate-800/20 border border-white/5 rounded-xl p-12 text-center">
                  <Clock size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">No pending tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Processing */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-blue-400" />
                <h2 className="font-semibold text-white">Processing</h2>
              </div>
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-400">
                {getItemsByStatus('processing').length}
              </span>
            </div>
            <div className="space-y-3">
              {getItemsByStatus('processing').map(item => (
                <div key={item.id} className="group bg-slate-800/40 backdrop-blur hover:bg-slate-800/60 border border-white/10 hover:border-blue-500/30 rounded-xl p-5 cursor-pointer transition-all">
                  <h3 className="font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                  {item.description && <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>}
                </div>
              ))}
              {getItemsByStatus('processing').length === 0 && (
                <div className="bg-slate-800/20 border border-white/5 rounded-xl p-12 text-center">
                  <Layers size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Nothing in progress</p>
                </div>
              )}
            </div>
          </div>

          {/* Filed */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <h2 className="font-semibold text-white">Filed</h2>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-medium text-emerald-400">
                {getItemsByStatus('filed').length}
              </span>
            </div>
            <div className="space-y-2">
              {getItemsByStatus('filed').map(item => (
                <div key={item.id} className="bg-slate-800/20 border border-white/5 hover:border-white/10 rounded-lg p-4 cursor-pointer transition-all">
                  <h3 className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors">{item.title}</h3>
                </div>
              ))}
              {getItemsByStatus('filed').length === 0 && (
                <div className="bg-slate-800/20 border border-white/5 rounded-xl p-12 text-center">
                  <Archive size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Archive empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
