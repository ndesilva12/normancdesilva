"use client";

import { useState } from "react";
import Link from "next/link";

export default function CuratePage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleCurate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
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
      background: 'linear-gradient(135deg, #8b5cf6 0%, #1e293b 50%, #0f172a 100%)',
      padding: '40px 20px',
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
          Curate
        </h1>
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          AI-powered content curation
        </p>

        {/* Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
          <input
            type="text"
            placeholder="Enter a topic to curate content about..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCurate()}
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
            onClick={handleCurate}
            disabled={loading}
            style={{
              padding: '20px 40px',
              background: loading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Curating...' : 'Curate'}
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
              Curated Content
            </h2>
            <div style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: '1.8' }}>
              {JSON.stringify(results, null, 2)}
            </div>
          </div>
        )}

        {!results && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px',
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '12px' }}>
              Ready to curate
            </h3>
            <p style={{ color: '#94a3b8' }}>
              Enter a topic above to discover curated content
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
