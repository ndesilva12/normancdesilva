"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function RelationshipIntelPage() {
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 40px auto' }}>
        <Link href="/" style={{ 
          color: '#94a3b8', 
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'inline-block'
        }}>
          ← Back to Dashboard
        </Link>
        
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: 'white',
          marginBottom: '12px'
        }}>
          Relationship Intel
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8' }}>
          {contacts.length} contacts tracked
        </p>
      </div>

      {/* Search */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 40px auto' }}>
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '20px 24px',
            fontSize: '16px',
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            color: 'white',
            outline: 'none',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px', 
            color: '#94a3b8' 
          }}>
            Loading contacts...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px',
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '12px' }}>
              No contacts found
            </h3>
            <p style={{ color: '#94a3b8' }}>
              {searchQuery ? 'Try a different search' : 'Start building your network'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: '16px',
                  padding: '32px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.95)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: 'white',
                    flexShrink: 0,
                  }}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      fontSize: '24px', 
                      fontWeight: '600', 
                      color: 'white',
                      marginBottom: '8px'
                    }}>
                      {contact.name}
                    </h3>
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#94a3b8',
                      marginBottom: '16px'
                    }}>
                      {contact.email}
                    </p>
                    {contact.company && (
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#64748b',
                        marginBottom: '16px'
                      }}>
                        {contact.company}
                      </p>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      gap: '24px',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      <span>
                        💬 {contact.interaction_count || 0} interactions
                      </span>
                      <span>
                        📧 Last: {contact.last_contact ? new Date(contact.last_contact).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${contact.email}`;
                      }}
                      style={{
                        padding: '12px 24px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        color: '#60a5fa',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                      }}
                    >
                      Email
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
