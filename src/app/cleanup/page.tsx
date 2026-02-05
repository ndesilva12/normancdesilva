"use client";

import { useState } from "react";

export default function CleanupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cleanup-stuck', { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #030712 0%, #0c1220 50%, #1e293b 100%)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: '600px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>
          Cleanup Stuck Searches
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px' }}>
          Mark old "running" searches as failed (from previous deployments)
        </p>

        <button
          onClick={handleCleanup}
          disabled={loading}
          style={{
            padding: '16px 32px',
            background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
          }}
        >
          {loading ? 'Cleaning...' : 'Clean Up Now'}
        </button>

        {result && (
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: result.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${result.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '12px',
            textAlign: 'left',
          }}>
            <pre style={{ 
              fontSize: '14px', 
              color: result.error ? '#fca5a5' : '#6ee7b7',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
