"use client";
import { IntelToolHistory } from "@/components/IntelToolHistory";
import { IntelToolNav } from "@/components/IntelToolNav";

import { useState } from "react";
import { TrendingUp, Search } from "lucide-react";

export default function L3DPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/l3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      if (res.ok) {
        setQuery('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10b981 0%, #1e293b 50%, #0f172a 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <IntelToolNav current="l3d" />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <TrendingUp size={48} style={{ color: '#34d399' }} />
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
          }}>
            L3D (Last 30 Days)
          </h1>
        </div>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          Research recent trends & insights from the last 30 days
        </p>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '48px' }}>
          <input
            type="text"
            placeholder="Enter topic to research recent trends..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '20px 24px',
              fontSize: '16px',
              background: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: 'white',
              outline: 'none',
            }}
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '20px 40px',
              background: loading ? 'rgba(16, 185, 129, 0.5)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Search size={18} />
            {loading ? 'Researching...' : 'Research'}
          </button>
        </div>

        {/* History */}
        <IntelToolHistory toolName="l3d" />
      </div>
    </div>
  );
}
