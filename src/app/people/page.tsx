"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Users, Mail, Phone } from "lucide-react";

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
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">People</h1>
                <p className="text-slate-400">{people.length} in your network</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2">
              <Plus size={18} />
              Add Person
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-800/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 pb-12">
        {loading ? (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-16 shadow-2xl text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-16 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Users size={32} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No people found</h3>
            <p className="text-slate-400">Start building your network</p>
          </div>
        ) : (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Relationship</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredPeople.map((person, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
                          <span className="text-sm font-bold text-white">{person.name?.charAt(0) || '?'}</span>
                        </div>
                        <span className="font-medium text-white">{person.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-400">{person.relationship || '-'}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {person.tags?.map((tag: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-lg text-xs font-medium text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {person.email && (
                          <a href={`mailto:${person.email}`} className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors">
                            <Mail size={14} className="text-slate-300" />
                          </a>
                        )}
                        {person.phone && (
                          <a href={`tel:${person.phone}`} className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors">
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
        )}
      </div>
    </div>
  );
}
