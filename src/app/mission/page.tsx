"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, GripVertical } from "lucide-react";

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
              <h1 className="text-3xl font-semibold tracking-tight mb-2">Mission Control</h1>
              <p className="text-gray-400">Track tasks through your workflow</p>
            </div>
            <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Plus size={16} />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Created */}
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-400 mb-1">CREATED</h2>
              <div className="text-xs text-gray-600">{getItemsByStatus('created').length} items</div>
            </div>
            <div className="space-y-3">
              {getItemsByStatus('created').map(item => (
                <div key={item.id} className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg hover:bg-white/[0.04] hover:border-white/[0.15] transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <GripVertical size={16} className="text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1">
                      <h3 className="font-medium mb-1 text-sm">{item.title}</h3>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
              {getItemsByStatus('created').length === 0 && (
                <div className="text-center py-12 text-gray-600 text-sm">No tasks</div>
              )}
            </div>
          </div>

          {/* Processing */}
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-400 mb-1">PROCESSING</h2>
              <div className="text-xs text-gray-600">{getItemsByStatus('processing').length} items</div>
            </div>
            <div className="space-y-3">
              {getItemsByStatus('processing').map(item => (
                <div key={item.id} className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg hover:bg-white/[0.04] hover:border-white/[0.15] transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <GripVertical size={16} className="text-gray-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1">
                      <h3 className="font-medium mb-1 text-sm">{item.title}</h3>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
              {getItemsByStatus('processing').length === 0 && (
                <div className="text-center py-12 text-gray-600 text-sm">No tasks</div>
              )}
            </div>
          </div>

          {/* Filed */}
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-400 mb-1">FILED</h2>
              <div className="text-xs text-gray-600">{getItemsByStatus('filed').length} items</div>
            </div>
            <div className="space-y-3">
              {getItemsByStatus('filed').map(item => (
                <div key={item.id} className="p-3 bg-white/[0.01] border border-white/[0.05] rounded-lg hover:bg-white/[0.02] hover:border-white/[0.1] transition-all cursor-pointer">
                  <h3 className="font-medium text-sm text-gray-500">{item.title}</h3>
                </div>
              ))}
              {getItemsByStatus('filed').length === 0 && (
                <div className="text-center py-12 text-gray-600 text-sm">No tasks</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
