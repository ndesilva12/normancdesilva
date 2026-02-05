"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Plus, GripVertical, ExternalLink, Trash2 } from "lucide-react";

interface MissionItem {
  id: string;
  title: string;
  description: string;
  links: string[];
  status: 'created' | 'processing' | 'filed';
  order: number;
  created_at: number;
  updated_at: number;
}

export default function MissionPage() {
  const [items, setItems] = useState<MissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', links: '' });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await fetch('/api/mission');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load mission items:', err);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async () => {
    if (!newItem.title.trim()) return;
    
    try {
      const res = await fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItem.title,
          description: newItem.description,
          links: newItem.links.split('\n').filter(l => l.trim()),
        }),
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setNewItem({ title: '', description: '', links: '' });
        loadItems();
      }
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  const moveItem = async (itemId: string, newStatus: MissionItem['status']) => {
    try {
      await fetch(`/api/mission/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadItems();
    } catch (err) {
      console.error('Failed to move item:', err);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    
    try {
      await fetch(`/api/mission/${itemId}`, { method: 'DELETE' });
      loadItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const getItemsByStatus = (status: MissionItem['status']) => 
    items.filter(i => i.status === status).sort((a, b) => a.order - b.order);

  const renderColumn = (
    status: MissionItem['status'],
    title: string,
    color: string,
    compact = false
  ) => {
    const columnItems = getItemsByStatus(status);
    
    return (
      <div style={{
        flex: 1,
        minWidth: 0,
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '75vh',
      }}>
        {/* Column Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {title}
            </h2>
          </div>
          <span style={{
            padding: '4px 12px',
            background: `${color}20`,
            border: `1px solid ${color}40`,
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            color: color,
          }}>
            {columnItems.length}
          </span>
        </div>

        {/* Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? '8px' : '12px',
        }}>
          {columnItems.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
            }}>
              No items yet
            </div>
          ) : (
            columnItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: compact ? '12px' : '16px',
                  padding: compact ? '12px 16px' : '20px',
                  cursor: 'move',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)';
                  e.currentTarget.style.borderColor = color + '40';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <GripVertical size={compact ? 14 : 16} style={{ color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: compact ? '14px' : '16px',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: compact ? '4px' : '8px',
                    }}>
                      {item.title}
                    </h3>
                    
                    {!compact && item.description && (
                      <p style={{
                        fontSize: '14px',
                        color: '#cbd5e1',
                        marginBottom: '12px',
                        lineHeight: '1.6',
                      }}>
                        {item.description}
                      </p>
                    )}
                    
                    {!compact && item.links.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {item.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#a5b4fc',
                              textDecoration: 'none',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                            Link
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {/* Move buttons */}
                    {!compact && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        {status !== 'processing' && (
                          <button
                            onClick={() => moveItem(item.id, 'processing')}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#60a5fa',
                              cursor: 'pointer',
                            }}
                          >
                            → Processing
                          </button>
                        )}
                        {status !== 'filed' && (
                          <button
                            onClick={() => moveItem(item.id, 'filed')}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#10b981',
                              cursor: 'pointer',
                            }}
                          >
                            → Filed
                          </button>
                        )}
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            marginLeft: 'auto',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6366f1 0%, #1e293b 50%, #0f172a 100%)',
        padding: '104px 20px 40px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Header */}
        <div style={{ maxWidth: '1400px', margin: '0 auto 32px auto' }}>
          {/* Back Button */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#cbd5e1',
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '24px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            ← Back to Dashboard
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '8px',
              }}>
                Mission Control
              </h1>
              <p style={{ fontSize: '18px', color: '#cbd5e1' }}>
                Kanban workflow pipeline
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Plus size={20} />
              New Item
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
        }}>
          {renderColumn('created', 'Created', '#fbbf24')}
          {renderColumn('processing', 'Processing', '#60a5fa')}
          {renderColumn('filed', 'Filed', '#10b981', true)}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '600px',
                background: 'rgba(30, 41, 59, 0.98)',
                borderRadius: '20px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                padding: '32px',
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '24px' }}>
                Create New Item
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Enter title..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
                    Description
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Enter description..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>
                    Links (one per line)
                  </label>
                  <textarea
                    value={newItem.links}
                    onChange={(e) => setNewItem({ ...newItem, links: e.target.value })}
                    placeholder="https://example.com"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    onClick={createItem}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: '#cbd5e1',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
