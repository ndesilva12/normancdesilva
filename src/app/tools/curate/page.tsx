"use client";
import { IntelToolHistory } from "@/components/IntelToolHistory";
import { IntelToolNav } from "@/components/IntelToolNav";
import { useState } from "react";
import { Sparkles, Search } from "lucide-react";

export default function CuratePage() {
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("all");
  const [loading, setLoading] = useState(false);

  const handleCurate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic, source }),
      });
      
      if (res.ok) {
        setTopic('');
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
      background: 'linear-gradient(135deg, #8b5cf6 0%, #1e293b 50%, #0f172a 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <IntelToolNav current="curate" />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <Sparkles size={48} style={{ color: '#a78bfa' }} />
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
          }}>
            Curate
          </h1>
        </div>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          AI-powered content curation tailored to your worldview
        </p>

        {/* Search Input */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '48px',
        }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Enter topic to curate..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCurate()}
              style={{
                flex: 1,
                padding: '20px 24px',
                fontSize: '16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
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
                background: loading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
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
              {loading ? 'Curating...' : 'Curate'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['all', 'news', 'twitter', 'youtube', 'reddit'].map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                style={{
                  padding: '10px 20px',
                  background: source === s ? 'rgba(139, 92, 246, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                  border: `1px solid ${source === s ? 'rgba(139, 92, 246, 0.5)' : 'rgba(148, 163, 184, 0.2)'}`,
                  borderRadius: '8px',
                  color: source === s ? '#a78bfa' : '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        <IntelToolHistory toolName="curate" collectionName="curate_history" />
      </div>
    </div>
  );
}
