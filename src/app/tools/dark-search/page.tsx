"use client";
import { IntelToolHistory } from "@/components/IntelToolHistory";
import { IntelToolNav } from "@/components/IntelToolNav";

import { useState } from "react";
import { Lock, Search, RefreshCw } from "lucide-react";

export default function DarkSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dark-search', {
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
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #000000 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <IntelToolNav current="dark" />
        
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: '#dc2626',
          marginTop: '24px',
          marginBottom: '12px'
        }}>
          Dark Search
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '40px' }}>
          Deep web research & hidden insights
        </p>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Enter sensitive research query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '20px 24px',
              fontSize: '16px',
              background: 'rgba(26, 26, 26, 0.9)',
              border: '1px solid rgba(107, 114, 128, 0.3)',
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
              background: loading ? 'rgba(220, 38, 38, 0.5)' : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
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
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '16px',
            padding: '32px',
          }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626', marginBottom: '24px' }}>
              Results
            </h2>
            <div style={{ fontSize: '16px', color: '#9ca3af', lineHeight: '1.8' }}>
              {JSON.stringify(results, null, 2)}
            </div>
          </div>
        )}

        {/* History */}
        <IntelToolHistory toolName="dark-search" collectionName="dark_search_history" />
      </div>
    </div>
  );
}
