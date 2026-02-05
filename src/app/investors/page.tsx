"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Plus, User, Mail, Phone, Building2, DollarSign, Calendar, MessageSquare } from "lucide-react";

interface Investor {
  id: string;
  name: string;
  firm: string;
  email?: string;
  phone?: string;
  checkSize?: string;
  focus?: string;
  status: 'cold' | 'warm' | 'active' | 'committed' | 'passed';
  lastContact?: string;
  nextAction?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [newInvestor, setNewInvestor] = useState({
    name: '',
    firm: '',
    email: '',
    phone: '',
    checkSize: '',
    focus: '',
    notes: '',
  });

  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    try {
      const res = await fetch('/api/investors');
      const data = await res.json();
      setInvestors(data.investors || []);
    } catch (err) {
      console.error('Failed to load investors:', err);
    } finally {
      setLoading(false);
    }
  };

  const createInvestor = async () => {
    if (!newInvestor.name.trim()) return;
    
    try {
      const res = await fetch('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvestor),
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setNewInvestor({ name: '', firm: '', email: '', phone: '', checkSize: '', focus: '', notes: '' });
        loadInvestors();
      }
    } catch (err) {
      console.error('Failed to create investor:', err);
    }
  };

  const updateStatus = async (investorId: string, newStatus: Investor['status']) => {
    try {
      await fetch(`/api/investors/${investorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadInvestors();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getInvestorsByStatus = (status: Investor['status']) =>
    investors.filter(i => i.status === status);

  const getStatusColor = (status: Investor['status']) => {
    switch (status) {
      case 'cold': return '#64748b';
      case 'warm': return '#fbbf24';
      case 'active': return '#3b82f6';
      case 'committed': return '#10b981';
      case 'passed': return '#ef4444';
      default: return '#64748b';
    }
  };

  const renderPipelineColumn = (
    status: Investor['status'],
    title: string
  ) => {
    const columnInvestors = getInvestorsByStatus(status);
    const color = getStatusColor(status);
    
    return (
      <div style={{
        flex: 1,
        minWidth: 0,
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '75vh',
      }}>
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
            {columnInvestors.length}
          </span>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {columnInvestors.length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
            }}>
              No investors yet
            </div>
          ) : (
            columnInvestors.map((investor) => (
              <div
                key={investor.id}
                onClick={() => setSelectedInvestor(investor)}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
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
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '8px',
                }}>
                  {investor.name}
                </h3>
                
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                  {investor.firm}
                </div>
                
                {investor.checkSize && (
                  <div style={{
                    fontSize: '13px',
                    color: '#10b981',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <DollarSign size={14} />
                    {investor.checkSize}
                  </div>
                )}

                {investor.nextAction && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fbbf24',
                  }}>
                    Next: {investor.nextAction}
                  </div>
                )}
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
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e293b 50%, #0f172a 100%)',
        padding: '104px 20px 40px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto 32px auto' }}>
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
                Investor Pipeline
              </h1>
              <p style={{ fontSize: '18px', color: '#cbd5e1' }}>
                Track all investor relationships for Listid & Cinderella
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Plus size={20} />
              Add Investor
            </button>
          </div>
        </div>

        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '24px',
        }}>
          {renderPipelineColumn('cold', 'Cold')}
          {renderPipelineColumn('warm', 'Warm')}
          {renderPipelineColumn('active', 'Active')}
          {renderPipelineColumn('committed', 'Committed')}
          {renderPipelineColumn('passed', 'Passed')}
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
                Add Investor
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  type="text"
                  value={newInvestor.name}
                  onChange={(e) => setNewInvestor({ ...newInvestor, name: e.target.value })}
                  placeholder="Name *"
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
                
                <input
                  type="text"
                  value={newInvestor.firm}
                  onChange={(e) => setNewInvestor({ ...newInvestor, firm: e.target.value })}
                  placeholder="Firm"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="email"
                    value={newInvestor.email}
                    onChange={(e) => setNewInvestor({ ...newInvestor, email: e.target.value })}
                    placeholder="Email"
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  
                  <input
                    type="tel"
                    value={newInvestor.phone}
                    onChange={(e) => setNewInvestor({ ...newInvestor, phone: e.target.value })}
                    placeholder="Phone"
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="text"
                    value={newInvestor.checkSize}
                    onChange={(e) => setNewInvestor({ ...newInvestor, checkSize: e.target.value })}
                    placeholder="Check Size (e.g. $500k-1M)"
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  
                  <input
                    type="text"
                    value={newInvestor.focus}
                    onChange={(e) => setNewInvestor({ ...newInvestor, focus: e.target.value })}
                    placeholder="Focus (e.g. Fintech, Sports)"
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                
                <textarea
                  value={newInvestor.notes}
                  onChange={(e) => setNewInvestor({ ...newInvestor, notes: e.target.value })}
                  placeholder="Notes"
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
                    fontFamily: 'inherit',
                  }}
                />
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    onClick={createInvestor}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Add
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

        {/* Investor Detail Modal - TODO: Build detailed view */}
        {selectedInvestor && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setSelectedInvestor(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '800px',
                background: 'rgba(30, 41, 59, 0.98)',
                borderRadius: '20px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                padding: '32px',
              }}
            >
              <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '24px' }}>
                {selectedInvestor.name}
              </h2>
              <p style={{ color: '#cbd5e1' }}>
                Detail view coming soon: interaction timeline, documents, next actions, etc.
              </p>
              <button
                onClick={() => setSelectedInvestor(null)}
                style={{
                  marginTop: '24px',
                  padding: '12px 24px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
