"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { IntelToolNav } from "@/components/IntelToolNav";
import { IntelToolHistory } from "@/components/IntelToolHistory";

export default function DarkSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    if (!searchQuery) setQuery(q);
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/dark-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, mode: 'long' })
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: any) => {
    setResults({ report: item.results });
    setQuery(item.query);
  };

  const handleRefreshSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #030712 0%, #0c1220 50%, #1e293b 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <IntelToolNav current="dark" />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <Moon size={48} style={{ color: '#ef4444' }} />
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
          }}>
            Dark Search
          </h1>
        </div>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          All perspectives research - controversial, fringe, and alternative viewpoints
        </p>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '48px' }}>
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
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
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
              background: loading ? 'rgba(239, 68, 68, 0.5)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
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
            {/* Summary Card */}
            {results.report.summary && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f87171', marginBottom: '16px' }}>
                  Summary
                </h2>
                <p style={{ fontSize: '16px', color: '#cbd5e1', lineHeight: '1.8', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {results.report.summary}
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
                          color: '#f87171',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        {link.title} →
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Key Takeaways Card */}
            {results.report.keyTakeaways && results.report.keyTakeaways.length > 0 && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#a78bfa', marginBottom: '16px' }}>
                  Key Takeaways
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                  {results.report.keyTakeaways.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternative Perspectives Card */}
            {results.report.alternativePerspectives && results.report.alternativePerspectives.length > 0 && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#34d399', marginBottom: '16px' }}>
                  Alternative Perspectives
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                  {results.report.alternativePerspectives.map((item: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unanswered Questions Card */}
            {results.report.unansweredQuestions && results.report.unansweredQuestions.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fbbf24', marginBottom: '16px' }}>
                  Unanswered Questions
                </h3>
                <ul style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                  {results.report.unansweredQuestions.map((item: string, idx: number) => (
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
                        color: '#f87171',
                        textDecoration: 'none',
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
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
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '24px' }}>
              Recent Searches
            </h2>
            <IntelToolHistory
              collection="dark"
              onSelectResult={handleSelectHistory}
              onRefreshSearch={handleRefreshSearch}
            />
          </div>
        )}
      </div>
    </div>
  );
}
