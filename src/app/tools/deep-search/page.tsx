"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { IntelToolNav } from "@/components/IntelToolNav";

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
      background: 'linear-gradient(135deg, #030712 0%, #0c1220 50%, #1e293b 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <IntelToolNav current="deep" />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <Search size={48} style={{ color: '#3b82f6' }} />
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
          }}>
            Deep Search
          </h1>
        </div>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          Expert-level research reports with nuanced insights
        </p>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '48px' }}>
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
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
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
              background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Brief Overview Card */}
            {results.report.briefOverview && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa', marginBottom: '16px' }}>
                  Overview
                </h2>
                <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: '1.8', margin: 0 }}>
                  {results.report.briefOverview}
                </p>
              </div>
            )}

            {/* Sections */}
            {results.report.sections?.map((section: any, idx: number) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '16px' }}>
                  {section.title}
                </h3>
                <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {section.content}
                </p>
                {section.links && section.links.length > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                          padding: '6px 12px',
                          background: 'rgba(96, 165, 250, 0.1)',
                          borderRadius: '8px',
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

            {/* Hidden Mechanics Card */}
            {results.report.hiddenMechanics && results.report.hiddenMechanics.length > 0 && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#a78bfa', marginBottom: '16px' }}>
                  Hidden Mechanics
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                  {results.report.hiddenMechanics.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Counterintuitive Insights Card */}
            {results.report.counterintuitiveInsights && results.report.counterintuitiveInsights.length > 0 && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#34d399', marginBottom: '16px' }}>
                  Counterintuitive Insights
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                  {results.report.counterintuitiveInsights.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expert Debates Card */}
            {results.report.expertDebates && results.report.expertDebates.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fbbf24', marginBottom: '16px' }}>
                  Expert Debates
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                  {results.report.expertDebates.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Underreported Angles Card */}
            {results.report.underreportedAngles && results.report.underreportedAngles.length > 0 && (
              <div style={{
                background: 'rgba(236, 72, 153, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(236, 72, 153, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f472b6', marginBottom: '16px' }}>
                  Underreported Angles
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                  {results.report.underreportedAngles.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sources Card */}
            {results.report.links && results.report.links.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '16px' }}>
                  Sources ({results.report.links.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        borderRadius: '10px',
                        border: '1px solid rgba(96, 165, 250, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{link.title}</span>
                      <span style={{ opacity: 0.7 }}>→</span>
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
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
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
