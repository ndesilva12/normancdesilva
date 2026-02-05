"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Users, Mail, Phone, Tag } from "lucide-react";

export default function PeoplePage() {
  const [people, setPeople] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const res = await fetch('/api/people');
      const data = await res.json();
      setPeople(data.people || []);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">People</h1>
                  <p className="text-slate-400">{people.length} in your network</p>
                </div>
              </div>
            </div>
            <button className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-semibold transition-colors flex items-center gap-2">
              <Plus size={18} />
              Add Person
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/70 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur rounded-2xl border border-white/10 p-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <Users size={28} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No people found</h3>
              <p className="text-slate-400">Start building your network</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Relationship</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPeople.map((person, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
                            <span className="text-sm font-bold text-white">
                              {person.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-white">{person.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-slate-400">{person.relationship || '-'}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {person.tags?.map((tag: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-700/50 border border-white/10 rounded-lg text-xs font-medium text-slate-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {person.email && (
                            <a href={`mailto:${person.email}`} className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-white/10 rounded-lg transition-colors">
                              <Mail size={14} className="text-slate-300" />
                            </a>
                          )}
                          {person.phone && (
                            <a href={`tel:${person.phone}`} className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-white/10 rounded-lg transition-colors">
                              <Phone size={14} className="text-slate-300" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
