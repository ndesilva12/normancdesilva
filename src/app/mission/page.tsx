"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MissionItem {
  id: string;
  title: string;
  description?: string;
  status: 'created' | 'processing' | 'filed';
}

export default function MissionPage() {
  const [items, setItems] = useState<MissionItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getItemsByStatus = (status: string) => items.filter(i => i.status === status);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #6366f1 0%, #1e293b 50%, #0f172a 100%)',
      padding: '40px 20px',
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
              Mission Control
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8' }}>
              Workflow pipeline
            </p>
          </div>
          <button style={{
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            + New Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px'
      }}>
        {/* Created Column */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>
              ⏱️ Created
            </h2>
            <span style={{
              padding: '6px 12px',
              background: 'rgba(251, 191, 36, 0.15)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#fbbf24'
            }}>
              {getItemsByStatus('created').length}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getItemsByStatus('created').map(item => (
              <div key={item.id} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
            {getItemsByStatus('created').length === 0 && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.3)',
                borderRadius: '12px',
                padding: '48px 16px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: '#64748b' }}>No pending tasks</p>
              </div>
            )}
          </div>
        </div>

        {/* Processing Column */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>
              ⚙️ Processing
            </h2>
            <span style={{
              padding: '6px 12px',
              background: 'rgba(59, 130, 246, 0.15)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#60a5fa'
            }}>
              {getItemsByStatus('processing').length}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getItemsByStatus('processing').map(item => (
              <div key={item.id} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '500', 
                  color: 'white',
                  marginBottom: '8px'
                }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
            {getItemsByStatus('processing').length === 0 && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.3)',
                borderRadius: '12px',
                padding: '48px 16px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Nothing in progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Filed Column */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>
              ✅ Filed
            </h2>
            <span style={{
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.15)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#10b981'
            }}>
              {getItemsByStatus('filed').length}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getItemsByStatus('filed').map(item => (
              <div key={item.id} style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(148, 163, 184, 0.08)',
                borderRadius: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
              }}>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#94a3b8'
                }}>
                  {item.title}
                </h3>
              </div>
            ))}
            {getItemsByStatus('filed').length === 0 && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.3)',
                borderRadius: '12px',
                padding: '48px 16px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Archive empty</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
