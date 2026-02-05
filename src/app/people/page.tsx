'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Mail,
  Phone,
  Building,
  Tag,
  Save,
  CloudDownload
} from 'lucide-react';

interface Person {
  id: string;
  notionId?: string;
  name: string;
  relationship?: string;
  tags?: string[];
  notes?: string;
  email?: string;
  phone?: string;
  company?: string;
  lastSynced?: number;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    company: '',
    tags: '',
    notes: '',
  });

  const loadPeople = useCallback(async () => {
    try {
      const res = await fetch('/api/people');
      if (res.ok) {
        const data = await res.json();
        setPeople(data.people);
        setFilteredPeople(data.people);
      }
    } catch (err) {
      console.error('Failed to load people:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      setFilteredPeople(people.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.relationship?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      ));
    } else {
      setFilteredPeople(people);
    }
  }, [searchQuery, people]);

  const syncFromNotion = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.people) {
          loadPeople();
        }
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setSyncing(false);
  };

  const savePerson = async () => {
    const { name, relationship, email, phone, company, tags, notes } = formData;

    if (!name.trim()) return;

    const personData = {
      name: name.trim(),
      relationship: relationship.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
    };

    try {
      if (editingPerson) {
        // Update
        const res = await fetch('/api/people', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPerson.id, ...personData }),
        });
        if (res.ok) {
          const data = await res.json();
          setPeople(prev => prev.map(p => p.id === editingPerson.id ? data.person : p));
        }
      } else {
        // Create
        const res = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personData),
        });
        if (res.ok) {
          const data = await res.json();
          setPeople(prev => [...prev, data.person]);
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
    }

    closeModal();
  };

  const deletePerson = async (id: string) => {
    try {
      const res = await fetch(`/api/people?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPeople(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const openEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      relationship: person.relationship || '',
      email: person.email || '',
      phone: person.phone || '',
      company: person.company || '',
      tags: person.tags?.join(', ') || '',
      notes: person.notes || '',
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingPerson(null);
    setFormData({
      name: '',
      relationship: '',
      email: '',
      phone: '',
      company: '',
      tags: '',
      notes: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-violet-400" />
          <p className="text-gray-400">Loading people database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white">
      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Users size={48} />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                People Database
              </h1>
              <p className="text-gray-400">{people.length} people in your network</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={syncFromNotion}
              disabled={syncing}
              className="px-4 py-2 bg-white/10 rounded-xl font-medium flex items-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <CloudDownload size={18} className={syncing ? 'animate-pulse' : ''} />
              {syncing ? 'Syncing...' : 'Sync Notion'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-violet-500/20 transition-all"
            >
              <Plus size={20} />
              Add Person
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-[1200px] mx-auto px-8 mb-6">
        <div className="relative max-w-md">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1200px] mx-auto px-8 pb-12">
        <div className="backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Relationship</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Company</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Tags</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map((person) => (
                  <tr key={person.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{person.name}</div>
                      {person.notes && (
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{person.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {person.relationship && (
                        <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded text-xs font-medium">
                          {person.relationship}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {person.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Mail size={12} />
                            <span className="truncate max-w-[150px]">{person.email}</span>
                          </div>
                        )}
                        {person.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Phone size={12} />
                            <span>{person.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {person.company && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Building size={12} />
                          <span>{person.company}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {person.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-white/10 text-gray-300 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {person.tags && person.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{person.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(person)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => deletePerson(person.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPeople.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              {searchQuery ? 'No people found matching your search' : 'No people in the database yet'}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingPerson) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl max-w-lg w-full border border-white/10"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    {editingPerson ? 'Edit Person' : 'Add New Person'}
                  </h2>
                  <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Relationship</label>
                    <input
                      type="text"
                      value={formData.relationship}
                      onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                      placeholder="Friend, Colleague, etc."
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company name"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 555 000 0000"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="investor, advisor, mentor"
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePerson}
                  disabled={!formData.name.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {editingPerson ? 'Save Changes' : 'Add Person'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
