'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Mail, 
  Calendar, 
  Tag, 
  RefreshCw,
  Plus,
  ExternalLink,
  Clock,
  User,
  Building,
  MessageSquare,
  X,
  ArrowLeft,
  Users,
  Zap,
  TrendingUp,
  Filter,
  ChevronDown,
  Send,
  StickyNote,
  Phone
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
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'interactions'>('recent');
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
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
    if (daysSince < 7) return { 
      type: 'active', 
      label: 'Active', 
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    };
    if (daysSince < 30) return { 
      type: 'warm', 
      label: 'Warm', 
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    };
    return { 
      type: 'cold', 
      label: 'Cold', 
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)'
    };
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

  const activeCount = contacts.filter(c => getStatus(c.last_seen).type === 'active').length;
  const warmCount = contacts.filter(c => getStatus(c.last_seen).type === 'warm').length;
  const coldCount = contacts.filter(c => getStatus(c.last_seen).type === 'cold').length;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#9ca3af' }}>Loading your network...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#ffffff',
      padding: isMobile ? '16px' : '32px',
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '48px',
      }}>
        <Link 
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#9ca3af',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '24px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#ffffff'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = '#9ca3af'}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Users size={24} />
          </div>
          <h1 style={{
            fontSize: isMobile ? '32px' : '48px',
            fontWeight: '800',
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Relationship Intel
          </h1>
        </div>
        
        <p style={{
          fontSize: isMobile ? '14px' : '18px',
          color: '#9ca3af',
          margin: 0,
          lineHeight: '1.6',
        }}>
          Track and manage your professional relationships for the Cinderella project.
          <br />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {project?.contact_count || 0} contacts • {project?.interaction_count || 0} interactions • Last synced {project?.last_sync ? formatDate(project.last_sync) : 'never'}
          </span>
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 32px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
        gap: '16px',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Contacts
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>
                {project?.contact_count || 0}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active (7d)
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                {activeCount}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Warm (30d)
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
                {warmCount}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(107, 114, 128, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(107, 114, 128, 0.2)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(107, 114, 128, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={20} style={{ color: '#6b7280' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cold (&gt;30d)
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#6b7280' }}>
                {coldCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Controls */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 24px',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: isMobile ? '20px' : '24px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto auto',
            gap: '12px',
            alignItems: 'center',
          }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={20} 
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts, tags, notes..."
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 48px',
                  fontSize: '15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name A-Z</option>
              <option value="interactions">Most Active</option>
            </select>

            {/* Sync Button */}
            <button
              onClick={triggerSync}
              disabled={syncing}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                background: syncing ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                cursor: syncing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!syncing) {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <RefreshCw size={16} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* Contacts Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '16px',
        }}>
          {filteredContacts.map((contact) => {
            const status = getStatus(contact.last_seen);
            return (
              <div
                key={contact.email}
                onClick={() => openContactDetail(contact)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                  (e.currentTarget as HTMLElement).style.borderColor = status.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${status.color} 0%, ${status.color}CC 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {contact.name}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {contact.email}
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: status.bgColor,
                    border: `1px solid ${status.color}40`,
                    fontSize: '11px',
                    fontWeight: '600',
                    color: status.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {status.label}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Last Contact</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{formatDate(contact.last_seen)}</div>
                  </div>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Interactions</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} style={{ color: '#667eea' }} />
                      {contact.interaction_count}
                    </div>
                  </div>
                </div>

                {contact.notes && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <StickyNote size={12} />
                      Note
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#e5e7eb',
                      lineHeight: '1.5',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {contact.notes}
                    </div>
                  </div>
                )}

                {contact.tags && contact.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {contact.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'rgba(102, 126, 234, 0.15)',
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: '#a78bfa',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '24px',
          }}
          onClick={() => setSelectedContact(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '18px',
                    background: `linear-gradient(135deg, ${getStatus(selectedContact.last_seen).color} 0%, ${getStatus(selectedContact.last_seen).color}CC 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: '700',
                  }}>
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
                      {selectedContact.name}
                    </h2>
                    <p style={{ fontSize: '15px', color: '#9ca3af', margin: 0 }}>{selectedContact.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Mail size={16} />
                  Send Email
                </button>
                <button style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <MessageSquare size={16} />
                  Add Note
                </button>
                <button style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Tag size={16} />
                  Add Tag
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '32px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: '#667eea' }} />
                Interaction History ({contactInteractions.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contactInteractions.map((interaction, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedInteraction(interaction)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
                      (e.currentTarget as HTMLElement).style.borderColor = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        {interaction.type === 'email' ? (
                          <Mail size={18} style={{ color: '#667eea', flexShrink: 0 }} />
                        ) : (
                          <Calendar size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '15px', fontWeight: '600' }}>
                          {interaction.subject || interaction.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0, marginLeft: '12px' }}>
                        {formatDate(interaction.date)}
                      </span>
                    </div>
                    {interaction.snippet && (
                      <p style={{
                        fontSize: '13px',
                        color: '#9ca3af',
                        margin: 0,
                        lineHeight: '1.5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {interaction.snippet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Detail Modal */}
      {selectedInteraction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '24px',
          }}
          onClick={() => setSelectedInteraction(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Email Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
                    {selectedInteraction.subject || selectedInteraction.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    From: {selectedInteraction.from_name || selectedInteraction.from_email}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {formatDate(selectedInteraction.date)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInteraction(null)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Email Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
            }}>
              <div style={{
                fontSize: '14px',
                lineHeight: '1.7',
                color: '#e5e7eb',
                whiteSpace: 'pre-wrap',
              }}>
                {selectedInteraction.body || selectedInteraction.snippet || 'No content available'}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
