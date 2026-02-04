'use client';

import { useEffect, useState } from 'react';

interface Contact {
  email: string;
  name: string;
  first_seen: number;
  last_seen: number;
  notes?: string;
  status?: string;
  interaction_count: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'interactions'>('recent');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load project stats
      const projectRes = await fetch('/api/relationship-intel/projects/cinderella');
      const projectData = await projectRes.json();
      setProject(projectData);

      // Load contacts
      const contactsRes = await fetch('/api/relationship-intel/projects/cinderella/contacts');
      const contactsData = await contactsRes.json();
      setContacts(contactsData);
      setFilteredContacts(contactsData);

      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    // Filter contacts
    const filtered = contacts.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sort contacts
    const sorted = [...filtered];
    if (sortBy === 'recent') {
      sorted.sort((a, b) => b.last_seen - a.last_seen);
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'interactions') {
      sorted.sort((a, b) => b.interaction_count - a.interaction_count);
    }

    setFilteredContacts(sorted);
  }, [searchQuery, sortBy, contacts]);

  const triggerSync = async () => {
    try {
      await fetch('/api/relationship-intel/sync', { method: 'POST' });
      alert('Sync started! This will take 30-60 seconds. Page will refresh automatically.');
      setTimeout(loadData, 10000);
    } catch (err: any) {
      alert('Sync failed: ' + err.message);
    }
  };

  const getStatus = (lastSeen: number) => {
    const daysSince = (Date.now() - lastSeen * 1000) / 86400000;
    if (daysSince < 7) return { label: 'Active', class: 'bg-emerald-900 text-emerald-100' };
    if (daysSince < 30) return { label: 'Warm', class: 'bg-amber-900 text-amber-100' };
    return { label: 'Cold', class: 'bg-gray-700 text-gray-300' };
  };

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const thisWeekCount = contacts.filter(c => {
    const weekAgo = Date.now() - 7 * 86400000;
    return c.last_seen * 1000 > weekAgo;
  }).length;

  return (
    <div className="min-h-screen bg-black text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Relationship Intel</h1>
          <p className="text-gray-400">
            Project: <span className="text-blue-400 font-semibold">Cinderella</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Total Contacts</div>
            <div className="text-3xl font-bold">{project?.contact_count || 0}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Total Interactions</div>
            <div className="text-3xl font-bold">{project?.interaction_count || 0}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">This Week</div>
            <div className="text-3xl font-bold text-blue-400">{thisWeekCount}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Last Sync</div>
            <div className="text-sm font-semibold">
              {project?.last_sync ? formatRelativeTime(project.last_sync) : '-'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Refresh
          </button>
          <button
            onClick={triggerSync}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            Sync Emails
          </button>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name A-Z</option>
            <option value="interactions">Most Interactions</option>
          </select>
        </div>

        {/* Auto-refresh */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="auto-refresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="auto-refresh" className="text-gray-400">
            Auto-refresh every 5 minutes
          </label>
          {lastUpdated && (
            <span className="text-gray-500 ml-4">Last updated: {lastUpdated}</span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        )}

        {/* Contacts List */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No contacts found</div>
            ) : (
              filteredContacts.map((contact) => {
                const status = getStatus(contact.last_seen);
                return (
                  <div
                    key={contact.email}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-6 rounded-lg transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{contact.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded ${status.class}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">{contact.email}</div>
                        {contact.notes && (
                          <div className="text-sm text-gray-300 mt-2">{contact.notes}</div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-400">Last contact</div>
                        <div className="font-semibold">
                          {formatRelativeTime(contact.last_seen)}
                        </div>
                        <div className="text-gray-500 mt-2">
                          {contact.interaction_count} interactions
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
