"use client";
import { IntelToolHistory } from "@/components/IntelToolHistory";
import { IntelToolNav } from "@/components/IntelToolNav";

import { useState } from "react";
import { Radar, Search, RefreshCw } from "lucide-react";

export default function DeepSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/deep-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #6366f1 0%, #1e293b 50%, #0f172a 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <IntelToolNav current="deep" />
        
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: 'white',
          marginTop: '24px',
          marginBottom: '12px'
        }}>
          Deep Search
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          Advanced research tool
        </p>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Enter your research query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '20px 24px',
              fontSize: '16px',
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
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
              background: loading ? 'rgba(99, 102, 241, 0.5)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '16px',
            padding: '32px',
          }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '24px' }}>
              Results
            </h2>
            <div style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: '1.8' }}>
              {JSON.stringify(results, null, 2)}
            </div>
          </div>
        )}

        {/* History */}
        <IntelToolHistory toolName="deep-search" />
      </div>
    </div>
  );
}
