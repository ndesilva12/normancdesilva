"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PeoplePage() {
  const [people, setPeople] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const res = await fetch('/api/people');
      const data = await res.json();
      setPeople(data.people || []);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    </>
  );

  return (
    <>
      <TopNav />
      <BottomNav />
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #065f46 0%, #1e293b 50%, #0f172a 100%)',
      padding: '104px 20px 40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 40px auto' }}>
        <Link href="/" style={{ 
          color: '#94a3b8', 
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'inline-block'
        }}>
          ← Back to Dashboard
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
          <div>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: 'bold', 
              color: 'white',
              marginBottom: '8px'
            }}>
              People Database
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8' }}>
              {people.length} people in your network
            </p>
          </div>
          <button style={{
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            + Add Person
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 40px auto' }}>
        <input
          type="text"
          placeholder="Search people..."
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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px', 
            color: '#94a3b8' 
          }}>
            Loading people...
          </div>
        ) : filteredPeople.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px',
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '12px' }}>
              No people found
            </h3>
            <p style={{ color: '#94a3b8' }}>
              {searchQuery ? 'Try a different search' : 'Start building your network'}
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px 24px', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Name
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px 24px', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Relationship
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px 24px', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Tags
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px 24px', 
                    fontSize: '12px', 
                    fontWeight: '600', 
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map((person, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: 'white',
                        }}>
                          {person.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: '500', color: 'white' }}>
                          {person.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '15px', color: '#94a3b8' }}>
                      {person.relationship || '-'}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {person.tags?.map((tag: string, i: number) => (
                          <span key={i} style={{
                            padding: '6px 12px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#10b981'
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {person.email && (
                          <a 
                            href={`mailto:${person.email}`} 
                            style={{
                              padding: '8px 16px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: '#60a5fa',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            📧 Email
                          </a>
                        )}
                        {person.phone && (
                          <a 
                            href={`tel:${person.phone}`}
                            style={{
                              padding: '8px 16px',
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: '#22c55e',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            📞 Call
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
