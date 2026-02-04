'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Mail, 
  Calendar, 
  Tag, 
  MoreVertical,
  RefreshCw,
  Plus,
  ChevronDown,
  ExternalLink,
  Clock,
  User,
  Phone,
  Building,
  MessageSquare,
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
  from_email?: string;
  from_name?: string;
  participants?: Array<{ email: string; name: string; role: string }>;
}

interface Project {
  id: string;
  name: string;
  contact_count: number;
  interaction_count: number;
  last_sync: number;
}

export default function RelationshipIntel() {
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactInteractions, setContactInteractions] = useState<Interaction[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'interactions'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectRes, contactsRes] = await Promise.all([
        fetch('/api/relationship-intel/projects/cinderella'),
        fetch('/api/relationship-intel/projects/cinderella/contacts')
      ]);

      if (!projectRes.ok || !contactsRes.ok) {
        throw new Error('Failed to load data');
      }

      const projectData = await projectRes.json();
      const contactsData = await contactsRes.json();

      setProject(projectData);
      setContacts(contactsData);
      setFilteredContacts(contactsData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadContactInteractions = async (email: string) => {
    try {
      const res = await fetch(
        `/api/relationship-intel/contacts/${encodeURIComponent(email)}/interactions?projectId=cinderella`
      );
      if (res.ok) {
        const data = await res.json();
        setContactInteractions(data);
      }
    } catch (err) {
      console.error('Failed to load interactions:', err);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/relationship-intel/sync', { method: 'POST' });
      setTimeout(() => {
        loadData();
        setSyncing(false);
      }, 10000);
    } catch (err) {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...contacts];

    // Search
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => getStatus(c.last_seen).type === statusFilter);
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => b.last_seen - a.last_seen);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'interactions') {
      filtered.sort((a, b) => b.interaction_count - a.interaction_count);
    }

    setFilteredContacts(filtered);
  }, [searchQuery, statusFilter, sortBy, contacts]);

  const getStatus = (lastSeen: number) => {
    const daysSince = (Date.now() - lastSeen * 1000) / 86400000;
    if (daysSince < 7) return { type: 'active', label: 'Active', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (daysSince < 30) return { type: 'warm', label: 'Warm', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    return { type: 'cold', label: 'Cold', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openContactDetail = (contact: Contact) => {
    setSelectedContact(contact);
    loadContactInteractions(contact.email);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0f0f14]">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Relationship Intel</h1>
              <p className="text-sm text-gray-400 mt-1">Cinderella Project</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Emails'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition">
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Contacts</div>
              <div className="text-2xl font-semibold">{project?.contact_count || 0}</div>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Interactions</div>
              <div className="text-2xl font-semibold">{project?.interaction_count || 0}</div>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Active (7d)</div>
              <div className="text-2xl font-semibold text-emerald-400">
                {contacts.filter(c => getStatus(c.last_seen).type === 'active').length}
              </div>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Last Sync</div>
              <div className="text-sm font-medium">{project?.last_sync ? formatDate(project.last_sync) : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-gray-800 bg-[#0f0f14]">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search contacts, tags, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name A-Z</option>
              <option value="interactions">Most Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="bg-[#0f0f14] border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Contact</th>
                <th className="px-6 py-4 font-medium">Interactions</th>
                <th className="px-6 py-4 font-medium">Tags</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredContacts.map((contact) => {
                const status = getStatus(contact.last_seen);
                return (
                  <tr
                    key={contact.email}
                    onClick={() => openContactDetail(contact)}
                    className="hover:bg-gray-900/30 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(contact.last_seen)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{contact.interaction_count}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {contact.tags && contact.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-1.5 hover:bg-gray-800 rounded transition">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#0f0f14] border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-semibold">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedContact.name}</h2>
                  <p className="text-sm text-gray-400">{selectedContact.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-1">Total Interactions</div>
                    <div className="text-2xl font-semibold">{selectedContact.interaction_count}</div>
                  </div>
                  <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-1">Last Contact</div>
                    <div className="text-sm font-medium">{formatDate(selectedContact.last_seen)}</div>
                  </div>
                  <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-1">Status</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatus(selectedContact.last_seen).class}`}>
                      {getStatus(selectedContact.last_seen).label}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {selectedContact.notes && (
                  <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Notes</div>
                    <div className="text-sm text-gray-400">{selectedContact.notes}</div>
                  </div>
                )}

                {/* Interaction History */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Interaction History</h3>
                  <div className="space-y-3">
                    {contactInteractions.map((interaction, idx) => (
                      <div key={idx} className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {interaction.type === 'email' ? (
                              <Mail className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Calendar className="w-4 h-4 text-purple-400" />
                            )}
                            <span className="text-sm font-medium">
                              {interaction.subject || interaction.title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(interaction.date)}</span>
                        </div>
                        {interaction.snippet && (
                          <p className="text-sm text-gray-400 line-clamp-2">{interaction.snippet}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition">
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition">
                <MessageSquare className="w-4 h-4" />
                Add Note
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition">
                <Tag className="w-4 h-4" />
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
