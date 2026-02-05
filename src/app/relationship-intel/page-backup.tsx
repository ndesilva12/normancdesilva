'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Mail,
  Calendar,
  Tag,
  RefreshCw,
  Plus,
  X,
  ArrowLeft,
  Users,
  Clock,
  Phone,
  Building2,
  Settings,
  ChevronRight,
  ChevronDown,
  StickyNote,
  Trash2,
  Check
} from 'lucide-react';
import {
  getTagCategories,
  saveRelationshipMetadata,
  getRelationshipMetadata,
  saveTagCategories,
  TagCategory,
  RelationshipMetadata
} from '@/lib/relationships-db';

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

interface Project {
  id: string;
  name: string;
  contact_count: number;
  interaction_count: number;
  last_sync: number;
}

// Color palette from DESIGN_SPEC.md
const colors = {
  bg: '#0a0a0a',
  bgSecondary: '#0f0f0f',
  card: '#1a1a1a',
  borderPrimary: '#1a1a1a',
  borderSecondary: '#2a2a2a',
  textPrimary: '#ffffff',
  textSecondary: '#888888',
  textMuted: '#666666',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#f87171',
  primary: '#6366f1',
  hover: '#151515',
};

const categoryColors: { [key: string]: string } = {
  interest_level: '#10b981',
  industry: '#3b82f6',
  relationship_type: '#8b5cf6',
  priority: '#f59e0b',
};

export default function RelationshipIntel() {
  const [project, setProject] = useState<Project | null>(null);
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
  const [isMobile, setIsMobile] = useState(false);

  // Tag categories state
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [contactMetadata, setContactMetadata] = useState<RelationshipMetadata | null>(null);
  const [contactTags, setContactTags] = useState<{ [categoryId: string]: string }>({});
  const [contactNotes, setContactNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings panel state
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryOptions, setNewCategoryOptions] = useState('');
  const [newOptionInput, setNewOptionInput] = useState('');

  // Auto-save debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load tag categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const categories = await getTagCategories();
      setTagCategories(categories);
    };
    loadCategories();
  }, []);

  const loadData = async () => {
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
      setLoading(false);
    } catch (err: any) {
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

  const loadContactMetadata = async (contactId: string) => {
    const metadata = await getRelationshipMetadata(contactId);
    if (metadata) {
      setContactMetadata(metadata);
      setContactTags(metadata.tags || {});
      setContactNotes(metadata.notes || '');
    } else {
      setContactMetadata(null);
      setContactTags({});
      setContactNotes('');
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

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => getStatus(c.last_seen).type === statusFilter);
    }

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
    if (daysSince < 7) return { type: 'active', label: 'Active', color: colors.green };
    if (daysSince < 30) return { type: 'warm', label: 'Warm', color: colors.orange };
    return { type: 'cold', label: 'Cold', color: colors.textMuted };
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openContactDetail = async (contact: Contact) => {
    setSelectedContact(contact);
    setExpandedInteraction(null);
    loadContactInteractions(contact.email);
    await loadContactMetadata(contact.email.replace(/[^a-zA-Z0-9]/g, '_'));
  };

  // Auto-save function
  const autoSave = useCallback(async (tags: { [key: string]: string }, notes: string) => {
    if (!selectedContact) return;

    setSaving(true);
    const contactId = selectedContact.email.replace(/[^a-zA-Z0-9]/g, '_');

    await saveRelationshipMetadata({
      contactId,
      contactEmail: selectedContact.email,
      contactName: selectedContact.name,
      tags,
      notes,
      customFields: {},
    });

    setTimeout(() => setSaving(false), 500);
  }, [selectedContact]);

  // Handle tag change with auto-save
  const handleTagChange = (categoryId: string, value: string) => {
    const newTags = { ...contactTags, [categoryId]: value };
    if (!value) {
      delete newTags[categoryId];
    }
    setContactTags(newTags);

    // Debounced auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newTags, contactNotes);
    }, 500);
  };

  // Handle notes change with auto-save
  const handleNotesChange = (value: string) => {
    setContactNotes(value);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(contactTags, value);
    }, 1000);
  };

  // Settings panel functions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const options = newCategoryOptions.split(',').map(o => o.trim()).filter(o => o);
    const newCategory: TagCategory = {
      id: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
      name: newCategoryName.trim(),
      color: '#8b5cf6',
      options: options.length > 0 ? options : ['Option 1', 'Option 2'],
    };

    const updated = [...tagCategories, newCategory];
    await saveTagCategories(updated);
    setTagCategories(updated);
    setNewCategoryName('');
    setNewCategoryOptions('');
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const updated = tagCategories.filter(c => c.id !== categoryId);
    await saveTagCategories(updated);
    setTagCategories(updated);
  };

  const handleAddOption = async (categoryId: string) => {
    if (!newOptionInput.trim()) return;

    const updated = tagCategories.map(c => {
      if (c.id === categoryId) {
        return { ...c, options: [...c.options, newOptionInput.trim()] };
      }
      return c;
    });

    await saveTagCategories(updated);
    setTagCategories(updated);
    setNewOptionInput('');
    setEditingCategory(null);
  };

  const handleRemoveOption = async (categoryId: string, option: string) => {
    const updated = tagCategories.map(c => {
      if (c.id === categoryId) {
        return { ...c, options: c.options.filter(o => o !== option) };
      }
      return c;
    });

    await saveTagCategories(updated);
    setTagCategories(updated);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textPrimary,
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: colors.textSecondary, fontSize: '13px' }}>Loading contacts...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      color: colors.textPrimary,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${colors.borderPrimary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: colors.bg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/"
            style={{
              color: colors.textSecondary,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} style={{ color: colors.primary }} />
            <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
              Relationship Intel
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: colors.textMuted }}>
            {project?.contact_count || 0} contacts
          </span>
          <button
            onClick={triggerSync}
            disabled={syncing}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '500',
              background: colors.primary,
              border: 'none',
              borderRadius: '6px',
              color: colors.textPrimary,
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: syncing ? 0.7 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Main Content - Master Detail Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left Panel - Contact List */}
        <div style={{
          width: isMobile && selectedContact ? '0' : '360px',
          minWidth: isMobile && selectedContact ? '0' : '360px',
          background: colors.bgSecondary,
          borderRight: `1px solid ${colors.borderPrimary}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}>
          {/* Search and Settings */}
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${colors.borderPrimary}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: colors.card,
                borderRadius: '8px',
                padding: '10px 14px',
                border: `1px solid ${colors.borderSecondary}`,
              }}>
                <Search size={16} style={{ color: colors.textMuted }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: colors.textPrimary,
                    fontSize: '13px',
                  }}
                />
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: showSettings ? colors.card : 'transparent',
                  border: showSettings ? `1px solid ${colors.borderSecondary}` : 'none',
                  cursor: 'pointer',
                  color: showSettings ? colors.primary : colors.textSecondary,
                  transition: 'all 0.15s ease',
                }}
              >
                <Settings size={16} />
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: colors.card,
                  border: `1px solid ${colors.borderSecondary}`,
                  borderRadius: '6px',
                  color: colors.textPrimary,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  background: colors.card,
                  border: `1px solid ${colors.borderSecondary}`,
                  borderRadius: '6px',
                  color: colors.textPrimary,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="recent">Recent</option>
                <option value="name">Name</option>
                <option value="interactions">Activity</option>
              </select>
            </div>
          </div>

          {/* Contact List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredContacts.map((contact) => {
              const status = getStatus(contact.last_seen);
              const isSelected = selectedContact?.email === contact.email;

              return (
                <div
                  key={contact.email}
                  onClick={() => openContactDetail(contact)}
                  style={{
                    padding: '14px 24px',
                    borderBottom: `1px solid ${colors.borderPrimary}`,
                    cursor: 'pointer',
                    background: isSelected ? colors.card : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = colors.hover;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: status.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: colors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {contact.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: colors.textSecondary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {contact.company || contact.email}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: colors.textMuted, flexShrink: 0 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Contact Detail or Settings */}
        <div style={{
          flex: 1,
          background: colors.bg,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {showSettings ? (
            // Settings Panel
            <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                  Tag Categories Settings
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: colors.card,
                    border: `1px solid ${colors.borderSecondary}`,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <X size={14} />
                  Close
                </button>
              </div>

              {/* Add New Category */}
              <div style={{
                background: colors.bgSecondary,
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary, margin: '0 0 16px 0' }}>
                  Add New Category
                </h3>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: colors.card,
                      border: `1px solid ${colors.borderSecondary}`,
                      color: colors.textPrimary,
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={newCategoryOptions}
                    onChange={(e) => setNewCategoryOptions(e.target.value)}
                    placeholder="Options (comma-separated)"
                    style={{
                      flex: 2,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: colors.card,
                      border: `1px solid ${colors.borderSecondary}`,
                      color: colors.textPrimary,
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAddCategory}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: colors.primary,
                      border: 'none',
                      color: colors.textPrimary,
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tagCategories.map((category) => (
                  <div
                    key={category.id}
                    style={{
                      background: colors.bgSecondary,
                      border: `1px solid ${colors.borderPrimary}`,
                      borderRadius: '12px',
                      padding: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '2px',
                          background: categoryColors[category.id] || category.color,
                        }} />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{category.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: colors.red,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {category.options.map((option) => (
                        <div
                          key={option}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: categoryColors[category.id] || category.color,
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          {option}
                          <button
                            onClick={() => handleRemoveOption(category.id, option)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: colors.textPrimary,
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              opacity: 0.7,
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {editingCategory?.id === category.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newOptionInput}
                          onChange={(e) => setNewOptionInput(e.target.value)}
                          placeholder="New option"
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: colors.card,
                            border: `1px solid ${colors.borderSecondary}`,
                            color: colors.textPrimary,
                            fontSize: '13px',
                            outline: 'none',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddOption(category.id);
                          }}
                        />
                        <button
                          onClick={() => handleAddOption(category.id)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: colors.green,
                            border: 'none',
                            color: colors.textPrimary,
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => { setEditingCategory(null); setNewOptionInput(''); }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: colors.card,
                            border: `1px solid ${colors.borderSecondary}`,
                            color: colors.textPrimary,
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingCategory(category)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: colors.card,
                          border: `1px solid ${colors.borderSecondary}`,
                          color: colors.textSecondary,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Plus size={12} />
                        Add Option
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : selectedContact ? (
            // Contact Detail Panel
            <div style={{ padding: isMobile ? '20px' : '40px 48px', maxWidth: '900px' }}>
              {/* Back button for mobile */}
              {isMobile && (
                <button
                  onClick={() => setSelectedContact(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 0',
                    marginBottom: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: colors.textSecondary,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={14} />
                  Back to contacts
                </button>
              )}

              {/* Header Section */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: getStatus(selectedContact.last_seen).color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: '600',
                    flexShrink: 0,
                  }}>
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}>
                      {selectedContact.name}
                    </h2>
                    {selectedContact.company && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.textSecondary, fontSize: '14px' }}>
                        <Building2 size={14} />
                        {selectedContact.company}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: colors.primary,
                    border: 'none',
                    color: colors.textPrimary,
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <Mail size={14} />
                    Email
                  </button>
                  <button style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: colors.card,
                    border: `1px solid ${colors.borderSecondary}`,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <Phone size={14} />
                    Call
                  </button>
                  <button style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: colors.card,
                    border: `1px solid ${colors.borderSecondary}`,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <Calendar size={14} />
                    Schedule
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '40px',
              }}>
                <div style={{
                  background: colors.bgSecondary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: '12px',
                  padding: '20px',
                }}>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '6px' }}>Last Contact</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{formatDate(selectedContact.last_seen)}</div>
                </div>
                <div style={{
                  background: colors.bgSecondary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: '12px',
                  padding: '20px',
                }}>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '6px' }}>Interactions</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{selectedContact.interaction_count}</div>
                </div>
                <div style={{
                  background: colors.bgSecondary,
                  border: `1px solid ${colors.borderPrimary}`,
                  borderRadius: '12px',
                  padding: '20px',
                }}>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '6px' }}>Status</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: getStatus(selectedContact.last_seen).color
                  }}>
                    {getStatus(selectedContact.last_seen).label}
                  </div>
                </div>
              </div>

              {/* Tag Categories */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary, margin: 0 }}>
                    CLASSIFICATION
                  </h3>
                  {saving && (
                    <span style={{ fontSize: '11px', color: colors.green, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} />
                      Saved
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                }}>
                  {tagCategories.map((category) => (
                    <div
                      key={category.id}
                      style={{
                        background: colors.bgSecondary,
                        border: `1px solid ${colors.borderPrimary}`,
                        borderRadius: '8px',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '2px',
                          background: categoryColors[category.id] || category.color,
                        }} />
                        <span style={{ fontSize: '13px', fontWeight: '500', color: colors.textSecondary }}>
                          {category.name}
                        </span>
                      </div>
                      <select
                        value={contactTags[category.id] || ''}
                        onChange={(e) => handleTagChange(category.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: colors.card,
                          border: `1px solid ${colors.borderSecondary}`,
                          color: colors.textPrimary,
                          fontSize: '13px',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select...</option>
                        {category.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary, margin: '0 0 16px 0' }}>
                  NOTES
                </h3>
                <textarea
                  value={contactNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add notes about this contact..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: colors.bgSecondary,
                    border: `1px solid ${colors.borderPrimary}`,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Email Timeline */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary, margin: '0 0 16px 0' }}>
                  INTERACTION HISTORY ({contactInteractions.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {contactInteractions.map((interaction) => {
                    const isExpanded = expandedInteraction === interaction.id;

                    return (
                      <div
                        key={interaction.id}
                        onClick={() => setExpandedInteraction(isExpanded ? null : interaction.id)}
                        style={{
                          background: colors.bgSecondary,
                          border: `1px solid ${colors.borderPrimary}`,
                          borderRadius: '8px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = colors.hover;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = colors.bgSecondary;
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            {interaction.type === 'email' ? (
                              <Mail size={14} style={{ color: colors.blue, flexShrink: 0 }} />
                            ) : (
                              <Calendar size={14} style={{ color: colors.orange, flexShrink: 0 }} />
                            )}
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: isExpanded ? 'normal' : 'nowrap',
                            }}>
                              {interaction.subject || interaction.title}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: colors.textMuted, flexShrink: 0, marginLeft: '12px' }}>
                            {formatDate(interaction.date)}
                          </span>
                        </div>

                        {interaction.from_name && (
                          <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>
                            From: {interaction.from_name}
                          </div>
                        )}

                        {interaction.snippet && (
                          <p style={{
                            fontSize: '13px',
                            color: isExpanded ? '#aaaaaa' : colors.textMuted,
                            margin: 0,
                            lineHeight: '1.5',
                            overflow: isExpanded ? 'visible' : 'hidden',
                            textOverflow: isExpanded ? 'clip' : 'ellipsis',
                            display: isExpanded ? 'block' : '-webkit-box',
                            WebkitLineClamp: isExpanded ? 'unset' : 2,
                            WebkitBoxOrient: 'vertical',
                            whiteSpace: isExpanded ? 'pre-wrap' : 'normal',
                          }}>
                            {isExpanded ? (interaction.body || interaction.snippet) : interaction.snippet}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {contactInteractions.length === 0 && (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: colors.textMuted,
                      fontSize: '13px',
                    }}>
                      No interactions found
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Empty State
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
            }}>
              <div style={{ textAlign: 'center' }}>
                <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px', margin: 0 }}>Select a contact to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        *::-webkit-scrollbar-track {
          background: ${colors.bg};
        }

        *::-webkit-scrollbar-thumb {
          background: ${colors.borderSecondary};
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: #3a3a3a;
        }
      `}</style>
    </div>
  );
}
