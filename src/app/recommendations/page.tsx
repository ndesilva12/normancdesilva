"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecs = recommendations
    .filter(r => r.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(r => statusFilter === 'all' || r.status === statusFilter);

  return (
    <>
      <TopNav />
      <BottomNav />
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #1e293b 50%, #0f172a 100%)',
      padding: '104px 20px 40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
          marginTop: '24px',
          marginBottom: '12px'
        }}>
          Recommendations
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          Curated content for you
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {['all', 'pending', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '12px 24px',
                background: statusFilter === status ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(30, 41, 59, 0.8)',
                border: '1px solid ' + (statusFilter === status ? 'rgba(139, 92, 246, 0.5)' : 'rgba(148, 163, 184, 0.15)'),
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search recommendations..."
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
            marginBottom: '32px',
          }}
        />

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
            Loading...
          </div>
        ) : filteredRecs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px',
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '12px' }}>
              No recommendations found
            </h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredRecs.map((rec, i) => (
              <div key={i} style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                  {rec.title}
                </h3>
                <p style={{ fontSize: '15px', color: '#94a3b8', marginBottom: '16px' }}>
                  {rec.description}
                </p>
                {rec.url && (
                  <a href={rec.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#8b5cf6',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}>
                    View →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
