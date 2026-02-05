"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Mail, Phone, MessageSquare } from "lucide-react";

export default function RelationshipIntelPage() {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await fetch('/api/relationship-intel/projects/cinderella/contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Relationship Intel</h1>
                <p className="text-slate-400">{contacts.length} contacts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search - Solid Container */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, company, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-800/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 pb-12">
        {loading ? (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-16 shadow-2xl text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-16 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Users size={32} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No contacts yet</h3>
            <p className="text-slate-400">Start building your network</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="bg-[#1e293b] hover:bg-[#1e293b]/80 border border-slate-700/50 rounded-2xl p-6 cursor-pointer transition-all shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
                      <span className="text-xl font-bold text-white">{contact.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{contact.name}</h3>
                      <p className="text-slate-400 mb-3">{contact.email}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare size={14} />
                          {contact.interaction_count || 0} interactions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors">
                      <Mail size={16} className="text-slate-300" />
                    </button>
                    <button className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors">
                      <Phone size={16} className="text-slate-300" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
