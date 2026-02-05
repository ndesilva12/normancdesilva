"use client";

import { useState } from "react";
import Link from "next/link";

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
        {results && results.report && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '16px',
            padding: '32px',
          }}>
            {/* Brief Overview */}
            {results.report.briefOverview && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>
                  Overview
                </h2>
                <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: '1.8' }}>
                  {results.report.briefOverview}
                </p>
              </div>
            )}

            {/* Sections */}
            {results.report.sections?.map((section: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                  {section.title}
                </h3>
                <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {section.content}
                </p>
                {section.links && section.links.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {section.links.map((link: any, linkIdx: number) => (
                      <a
                        key={linkIdx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '13px',
                          color: '#60a5fa',
                          textDecoration: 'none',
                          padding: '4px 12px',
                          background: 'rgba(96, 165, 250, 0.1)',
                          borderRadius: '6px',
                          border: '1px solid rgba(96, 165, 250, 0.2)',
                        }}
                      >
                        {link.title} →
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Hidden Mechanics */}
            {results.report.hiddenMechanics && results.report.hiddenMechanics.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                  Hidden Mechanics
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
                  {results.report.hiddenMechanics.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Counterintuitive Insights */}
            {results.report.counterintuitiveInsights && results.report.counterintuitiveInsights.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                  Counterintuitive Insights
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
                  {results.report.counterintuitiveInsights.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expert Debates */}
            {results.report.expertDebates && results.report.expertDebates.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                  Expert Debates
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
                  {results.report.expertDebates.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Underreported Angles */}
            {results.report.underreportedAngles && results.report.underreportedAngles.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                  Underreported Angles
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px' }}>
                  {results.report.underreportedAngles.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Links */}
            {results.report.links && results.report.links.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                  Sources
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {results.report.links.map((link: any, idx: number) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '14px',
                        color: '#60a5fa',
                        textDecoration: 'none',
                        padding: '12px 16px',
                        background: 'rgba(96, 165, 250, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                        display: 'block',
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>{link.title}</span>
                      <span style={{ marginLeft: '8px', opacity: 0.7 }}>→</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {results && results.error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            color: '#fca5a5',
          }}>
            Error: {results.error}
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
              Ready to search
            </h3>
            <p style={{ color: '#94a3b8' }}>
              Enter a query above to start deep research
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
