'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Mail,
  Calendar,
  RefreshCw,
  ArrowLeft,
  Users,
  Clock,
  Phone,
  Building2,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';

interface Contact {
  email: string;
  name: string;
  first_seen: number;
  last_seen: number;
  notes?: string;
  status?: string;
  tags?: string[];
  interaction_count: number;
  company?: string;
  position?: string;
}

interface Interaction {
  id: string;
  type: 'email' | 'meeting';
  date: number;
  subject?: string;
  title?: string;
  snippet?: string;
  body?: string;
  from_email?: string;
  from_name?: string;
  participants?: Array<{ email: string; name: string; role: string }>;
}

export default function RelationshipIntel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactInteractions, setContactInteractions] = useState<Interaction[]>([]);
  const [expandedInteraction, setExpandedInteraction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'interactions'>('recent');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const getStatus = (lastSeen: number) => {
    const daysSince = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return { label: 'Active', color: '#10b981' };
    if (daysSince < 30) return { label: 'Warm', color: '#f59e0b' };
    return { label: 'Cold', color: '#6b7280' };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/relationship-intel/projects/cinderella/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setFilteredContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load:', err);
    }
    setLoading(false);
  };

  const syncData = async () => {
    setSyncing(true);
    try {
      await fetch('/api/relationship-intel/projects/cinderella/sync', { method: 'POST' });
      await loadData();
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setSyncing(false);
  };

  const loadContactInteractions = async (email: string) => {
    try {
      const res = await fetch(`/api/relationship-intel/projects/cinderella/contacts/${encodeURIComponent(email)}/interactions`);
      if (res.ok) {
        const data = await res.json();
        setContactInteractions(data.interactions || []);
      }
    } catch (err) {
      console.error('Failed to load interactions:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = contacts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => getStatus(c.last_seen).label.toLowerCase() === statusFilter);
    }

    if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'interactions') {
      filtered = [...filtered].sort((a, b) => b.interaction_count - a.interaction_count);
    } else {
      filtered = [...filtered].sort((a, b) => b.last_seen - a.last_seen);
    }

    setFilteredContacts(filtered);
  }, [contacts, searchQuery, statusFilter, sortBy]);

  const openContactDetail = (contact: Contact) => {
    setSelectedContact(contact);
    loadContactInteractions(contact.email);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-violet-400" />
          <p className="text-gray-400">Loading relationship intel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-12 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-200 text-sm mb-8"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                Relationship Intel
              </h1>
              <p className="text-gray-400 text-lg">{contacts.length} contacts • Cinderella Project</p>
            </div>
          </div>

          <button
            onClick={syncData}
            disabled={syncing}
            className="px-6 py-3 backdrop-blur-xl bg-white/10 border border-white/10 rounded-xl font-medium flex items-center gap-2 hover:bg-white/20 hover:border-white/20 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Gmail'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Contact List */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              {/* Search & Filters */}
              <div className="p-6 border-b border-white/10 space-y-4">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="recent">Recent</option>
                    <option value="name">Name</option>
                    <option value="interactions">Activity</option>
                  </select>
                </div>
              </div>

              {/* Contact List */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredContacts.map((contact) => {
                  const status = getStatus(contact.last_seen);
                  const isSelected = selectedContact?.email === contact.email;

                  return (
                    <div
                      key={contact.email}
                      onClick={() => openContactDetail(contact)}
                      className={`p-4 border-b border-white/5 cursor-pointer transition-all duration-200 ${
                        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                          style={{ background: status.color }}
                        >
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{contact.name}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {contact.company || contact.email}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredContacts.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  {searchQuery ? 'No contacts found' : 'No contacts yet'}
                </div>
              )}
            </div>
          </div>

          {/* Right: Contact Detail */}
          <div className="lg:col-span-2">
            {selectedContact ? (
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                {/* Contact Header */}
                <div className="p-8 border-b border-white/10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                        style={{ background: getStatus(selectedContact.last_seen).color }}
                      >
                        {selectedContact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{selectedContact.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="px-2 py-1 rounded text-xs font-medium" style={{
                            background: `${getStatus(selectedContact.last_seen).color}20`,
                            color: getStatus(selectedContact.last_seen).color
                          }}>
                            {getStatus(selectedContact.last_seen).label}
                          </span>
                          <span>•</span>
                          <span>{selectedContact.interaction_count} interactions</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedContact(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail size={16} />
                      <span className="truncate">{selectedContact.email}</span>
                    </div>
                    {selectedContact.company && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Building2 size={16} />
                        <span>{selectedContact.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactions */}
                <div className="p-8">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Clock size={18} />
                    Interaction History
                  </h3>

                  <div className="space-y-4">
                    {contactInteractions.map((interaction) => {
                      const isExpanded = expandedInteraction === interaction.id;

                      return (
                        <div
                          key={interaction.id}
                          className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-all duration-200"
                        >
                          <div
                            onClick={() => setExpandedInteraction(isExpanded ? null : interaction.id)}
                            className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {interaction.type === 'email' ? (
                                    <Mail size={16} className="text-blue-400 flex-shrink-0" />
                                  ) : (
                                    <Calendar size={16} className="text-green-400 flex-shrink-0" />
                                  )}
                                  <span className="font-medium truncate">
                                    {interaction.subject || interaction.title}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(interaction.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <ChevronDown
                                size={18}
                                className={`text-gray-500 flex-shrink-0 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-white/10">
                              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                {interaction.snippet || interaction.body || 'No content available'}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {contactInteractions.length === 0 && (
                      <div className="text-center py-12 text-gray-400 text-sm">
                        No interactions found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-16 text-center">
                <Users size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg">Select a contact to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
