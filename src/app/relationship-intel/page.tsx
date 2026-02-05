"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Mail, Calendar, Search, Star, MessageSquare, Phone } from "lucide-react";

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
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Relationship Intel</h1>
                  <p className="text-slate-400">Professional network insights</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{contacts.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Contacts</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">
                  {contacts.filter(c => c.interaction_count > 5).length}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, company, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/70 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur rounded-2xl border border-white/10 p-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <Users size={28} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No contacts yet</h3>
              <p className="text-slate-400">Start building your network by adding your first contact</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="group bg-slate-800/30 backdrop-blur hover:bg-slate-800/50 border border-white/10 hover:border-white/20 rounded-2xl p-6 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <span className="text-xl font-bold text-white">
                        {contact.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1">{contact.name}</h3>
                      <p className="text-slate-400 text-sm mb-3">{contact.email}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare size={14} />
                          {contact.interaction_count || 0} interactions
                        </span>
                        {contact.last_seen && (
                          <span>Last: {new Date(contact.last_seen).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-slate-700/50 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors">
                      <Mail size={16} className="text-slate-300" />
                    </button>
                    <button className="p-2.5 bg-slate-700/50 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors">
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
