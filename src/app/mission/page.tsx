"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Layers, Clock, CheckCircle2, Archive } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Header - Contained */}
      <div className="bg-[#1e293b]/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Layers size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Mission Control</h1>
                <p className="text-slate-400">Workflow pipeline</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2">
              <Plus size={18} />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Solid Container */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-3 gap-6">
          {/* Created Column */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock size={20} className="text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Created</h2>
              </div>
              <span className="px-3 py-1.5 bg-amber-500/10 rounded-lg text-sm font-medium text-amber-400">
                {getItemsByStatus('created').length}
              </span>
            </div>
            
            <div className="space-y-3">
              {getItemsByStatus('created').map(item => (
                <div key={item.id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer transition-all">
                  <h3 className="font-medium text-white mb-1">{item.title}</h3>
                  {item.description && <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>}
                </div>
              ))}
              {getItemsByStatus('created').length === 0 && (
                <div className="bg-slate-800/30 rounded-xl p-8 text-center">
                  <Clock size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No pending tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Processing Column */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Layers size={20} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Processing</h2>
              </div>
              <span className="px-3 py-1.5 bg-blue-500/10 rounded-lg text-sm font-medium text-blue-400">
                {getItemsByStatus('processing').length}
              </span>
            </div>
            
            <div className="space-y-3">
              {getItemsByStatus('processing').map(item => (
                <div key={item.id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer transition-all">
                  <h3 className="font-medium text-white mb-1">{item.title}</h3>
                  {item.description && <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>}
                </div>
              ))}
              {getItemsByStatus('processing').length === 0 && (
                <div className="bg-slate-800/30 rounded-xl p-8 text-center">
                  <Layers size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Nothing in progress</p>
                </div>
              )}
            </div>
          </div>

          {/* Filed Column */}
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Filed</h2>
              </div>
              <span className="px-3 py-1.5 bg-emerald-500/10 rounded-lg text-sm font-medium text-emerald-400">
                {getItemsByStatus('filed').length}
              </span>
            </div>
            
            <div className="space-y-2">
              {getItemsByStatus('filed').map(item => (
                <div key={item.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-800/50 transition-all">
                  <h3 className="text-sm font-medium text-slate-400">{item.title}</h3>
                </div>
              ))}
              {getItemsByStatus('filed').length === 0 && (
                <div className="bg-slate-800/30 rounded-xl p-8 text-center">
                  <Archive size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Archive empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
