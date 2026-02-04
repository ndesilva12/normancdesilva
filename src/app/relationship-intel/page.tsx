'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  Calendar,
  Tag,
  RefreshCw,
  X,
  ArrowLeft,
  Users,
  Zap,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  Phone,
  Building,
  Star,
  StarOff,
  ExternalLink,
  Filter,
  SortAsc
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
  interestLevel?: number;
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
  direction?: 'inbound' | 'outbound';
}

interface EmailData {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to?: string;
  snippet: string;
  body?: string;
  date: string;
  direction: 'inbound' | 'outbound';
}

interface CalendarEventData {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
}

interface ContactDetailData {
  contact: Contact;
  emails: EmailData[];
  calendarEvents: CalendarEventData[];
  summary: {
    fullHistorySummary: string;
    recentSummary: string;
    lastUpdated: number;
  } | null;
  stats: {
    emailCount: number;
    meetingCount: number;
    totalInteractions: number;
  };
}

interface Project {
  id: string;
  name: string;
  contact_count: number;
  interaction_count: number;
  last_sync: number;
}

type SortOption = 'recent' | 'name' | 'interactions' | 'interest';

export default function RelationshipIntel() {
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactDetail, setContactDetail] = useState<ContactDetailData | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Section collapse states
  const [aiSummaryExpanded, setAiSummaryExpanded] = useState(true);
  const [recentSummaryExpanded, setRecentSummaryExpanded] = useState(true);
  const [emailsExpanded, setEmailsExpanded] = useState(true);
  const [meetingsExpanded, setMeetingsExpanded] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
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

      // Extract all unique tags
      const tags = new Set<string>();
      contactsData.forEach((c: Contact) => {
        c.tags?.forEach(t => tags.add(t));
      });
      setAllTags(Array.from(tags).sort());

      setLoading(false);
    } catch (err) {
      console.error('Load error:', err);
      setLoading(false);
    }
  }, []);

  const loadContactDetail = useCallback(async (contact: Contact) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(
        `/api/relationship-intel/contacts/${encodeURIComponent(contact.email)}/data`
      );
      if (res.ok) {
        const data = await res.json();
        setContactDetail(data);
      }
    } catch (err) {
      console.error('Failed to load contact detail:', err);
    }
    setLoadingDetail(false);
  }, []);

  const generateSummary = useCallback(async () => {
    if (!selectedContact || !contactDetail) return;

    setGeneratingSummary(true);
    try {
      const res = await fetch(
        `/api/relationship-intel/contacts/${encodeURIComponent(selectedContact.email)}/summary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactName: selectedContact.name,
            emails: contactDetail.emails.map(e => ({
              subject: e.subject,
              snippet: e.snippet,
              date: e.date,
              direction: e.direction,
            })),
            meetings: contactDetail.calendarEvents.map(m => ({
              summary: m.summary,
              start: m.start,
              attendees: m.attendees,
            })),
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setContactDetail(prev => prev ? {
          ...prev,
          summary: {
            fullHistorySummary: data.summary.fullHistorySummary,
            recentSummary: data.summary.recentSummary,
            lastUpdated: Date.now(),
          }
        } : null);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    }
    setGeneratingSummary(false);
  }, [selectedContact, contactDetail]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/relationship-intel/sync', { method: 'POST' });
      setTimeout(() => {
        loadData();
        setSyncing(false);
      }, 10000);
    } catch {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let filtered = [...contacts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.notes?.toLowerCase().includes(query) ||
        c.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => getStatus(c.last_seen).type === statusFilter);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(c =>
        selectedTags.some(tag => c.tags?.includes(tag))
      );
    }

    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'interactions':
        filtered.sort((a, b) => (b.interaction_count || 0) - (a.interaction_count || 0));
        break;
      case 'interest':
        filtered.sort((a, b) => (b.interestLevel || 0) - (a.interestLevel || 0));
        break;
    }

    setFilteredContacts(filtered);
  }, [searchQuery, statusFilter, sortBy, contacts, selectedTags]);

  const getStatus = (lastSeen: number) => {
    const daysSince = (Date.now() - lastSeen * 1000) / 86400000;
    if (daysSince < 7) return { type: 'active', label: 'Active', color: '#10b981' };
    if (daysSince < 30) return { type: 'warm', label: 'Warm', color: '#f59e0b' };
    return { type: 'cold', label: 'Cold', color: '#6b7280' };
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(parseInt(timestamp)) : new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const openContactDetail = (contact: Contact) => {
    setSelectedContact(contact);
    setContactDetail(null);
    loadContactDetail(contact);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const activeCount = contacts.filter(c => getStatus(c.last_seen).type === 'active').length;
  const warmCount = contacts.filter(c => getStatus(c.last_seen).type === 'warm').length;
  const coldCount = contacts.filter(c => getStatus(c.last_seen).type === 'cold').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-400">Loading your network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Relationship Intel
          </h1>
        </div>

        <p className="text-gray-400 text-lg">
          Your professional network intelligence dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Contacts', value: project?.contact_count || 0, icon: Users, gradient: 'from-purple-500 to-indigo-600' },
            { label: 'Active (7d)', value: activeCount, icon: Zap, color: '#10b981' },
            { label: 'Warm (30d)', value: warmCount, icon: TrendingUp, color: '#f59e0b' },
            { label: 'Cold (>30d)', value: coldCount, icon: Clock, color: '#6b7280' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="backdrop-blur-xl rounded-2xl p-5 border"
              style={{
                background: stat.color ? `rgba(${stat.color === '#10b981' ? '16,185,129' : stat.color === '#f59e0b' ? '245,158,11' : '107,114,128'}, 0.1)` : 'rgba(255,255,255,0.05)',
                borderColor: stat.color ? `${stat.color}33` : 'rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: stat.gradient ? `linear-gradient(135deg, var(--tw-gradient-stops))` : `${stat.color}33`,
                  }}
                >
                  <stat.icon size={20} style={{ color: stat.color || '#fff' }} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</div>
                  <div className="text-2xl font-bold" style={{ color: stat.color || '#fff' }}>{stat.value}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-6xl mx-auto px-6 mb-6">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name A-Z</option>
              <option value="interactions">Most Active</option>
              <option value="interest">Interest Level</option>
            </select>

            {/* Sync Button */}
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <Filter size={14} />
                Tags:
              </span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact List */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filteredContacts.map((contact, i) => {
              const status = getStatus(contact.last_seen);
              return (
                <motion.div
                  key={contact.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => openContactDetail(contact)}
                  className="p-5 hover:bg-white/5 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg truncate group-hover:text-purple-400 transition-colors">
                            {contact.name}
                          </h3>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: `${status.color}20`,
                              color: status.color,
                            }}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm truncate">{contact.email}</p>
                        {contact.company && (
                          <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                            <Building size={12} />
                            {contact.position && `${contact.position} at `}{contact.company}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-gray-400 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">{contact.interaction_count}</div>
                        <div className="text-xs">interactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm">{formatDate(contact.last_seen)}</div>
                        <div className="text-xs">last contact</div>
                      </div>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="hidden md:flex gap-1">
                          {contact.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact Detail Modal */}
      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedContact(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                    <p className="text-gray-400">{selectedContact.email}</p>
                    {selectedContact.company && (
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <Building size={14} />
                        {selectedContact.position && `${selectedContact.position} at `}{selectedContact.company}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                  >
                    <Mail size={16} />
                    Send Email
                  </a>
                  {selectedContact.tags?.map(tag => (
                    <span key={tag} className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm flex items-center gap-1">
                      <Tag size={14} />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats Row */}
                {contactDetail && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-black/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-purple-400">{contactDetail.stats.emailCount}</div>
                      <div className="text-xs text-gray-400">Emails</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-indigo-400">{contactDetail.stats.meetingCount}</div>
                      <div className="text-xs text-gray-400">Meetings</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-cyan-400">{contactDetail.stats.totalInteractions}</div>
                      <div className="text-xs text-gray-400">Total</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw size={24} className="animate-spin text-purple-400" />
                  </div>
                ) : contactDetail ? (
                  <>
                    {/* AI Relationship Summary */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-500/20 overflow-hidden">
                      <button
                        onClick={() => setAiSummaryExpanded(!aiSummaryExpanded)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles size={20} className="text-purple-400" />
                          <span className="font-semibold">AI Relationship Summary</span>
                        </div>
                        {aiSummaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {aiSummaryExpanded && (
                        <div className="px-4 pb-4">
                          {contactDetail.summary ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {contactDetail.summary.fullHistorySummary}
                              </p>
                              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <span>Last updated: {formatDate(contactDetail.summary.lastUpdated / 1000)}</span>
                                <button
                                  onClick={generateSummary}
                                  disabled={generatingSummary}
                                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                                >
                                  <RefreshCw size={12} className={generatingSummary ? 'animate-spin' : ''} />
                                  Regenerate
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-400 mb-3">No summary generated yet</p>
                              <button
                                onClick={generateSummary}
                                disabled={generatingSummary}
                                className="px-4 py-2 bg-purple-500 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto hover:bg-purple-600 transition-colors"
                              >
                                <Sparkles size={16} className={generatingSummary ? 'animate-pulse' : ''} />
                                {generatingSummary ? 'Generating...' : 'Generate Summary'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recent Summary */}
                    {contactDetail.summary?.recentSummary && (
                      <div className="bg-indigo-500/10 rounded-2xl border border-indigo-500/20 overflow-hidden">
                        <button
                          onClick={() => setRecentSummaryExpanded(!recentSummaryExpanded)}
                          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Clock size={20} className="text-indigo-400" />
                            <span className="font-semibold">Recent Activity Summary (Last 3 Months)</span>
                          </div>
                          {recentSummaryExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {recentSummaryExpanded && (
                          <div className="px-4 pb-4">
                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {contactDetail.summary.recentSummary}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Email History */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setEmailsExpanded(!emailsExpanded)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Mail size={20} className="text-cyan-400" />
                          <span className="font-semibold">Email History ({contactDetail.emails.length})</span>
                        </div>
                        {emailsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {emailsExpanded && (
                        <div className="divide-y divide-white/5">
                          {contactDetail.emails.length > 0 ? contactDetail.emails.slice(0, 20).map((email) => (
                            <div
                              key={email.id}
                              onClick={() => setSelectedEmail(email)}
                              className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      email.direction === 'inbound'
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'bg-purple-500/20 text-purple-400'
                                    }`}>
                                      {email.direction === 'inbound' ? 'Received' : 'Sent'}
                                    </span>
                                    <span className="text-xs text-gray-500">{formatDate(email.date)}</span>
                                  </div>
                                  <h4 className="font-medium truncate">{email.subject}</h4>
                                  <p className="text-gray-400 text-sm truncate">{email.snippet}</p>
                                </div>
                                <ExternalLink size={16} className="text-gray-500 flex-shrink-0" />
                              </div>
                            </div>
                          )) : (
                            <div className="p-8 text-center text-gray-400">
                              No emails found with this contact
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Meetings & Events */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setMeetingsExpanded(!meetingsExpanded)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar size={20} className="text-amber-400" />
                          <span className="font-semibold">Meetings & Events ({contactDetail.calendarEvents.length})</span>
                        </div>
                        {meetingsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      {meetingsExpanded && (
                        <div className="divide-y divide-white/5">
                          {contactDetail.calendarEvents.length > 0 ? contactDetail.calendarEvents.map((event) => (
                            <div key={event.id} className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-amber-400 mb-1">
                                    {new Date(event.start).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                  <h4 className="font-medium">{event.summary}</h4>
                                  {event.location && (
                                    <p className="text-gray-400 text-sm">{event.location}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="p-8 text-center text-gray-400">
                              No meetings found with this contact
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Detail Modal */}
      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedEmail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-white/10 flex flex-col"
            >
              <div className="p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-xl font-bold mb-2">{selectedEmail.subject}</h3>
                    <div className="text-sm text-gray-400">
                      <p>From: {selectedEmail.from}</p>
                      {selectedEmail.to && <p>To: {selectedEmail.to}</p>}
                      <p className="text-gray-500">{formatDate(selectedEmail.date)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">
                    {selectedEmail.body || selectedEmail.snippet}
                  </pre>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
