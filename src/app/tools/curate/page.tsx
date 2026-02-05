"use client";
import { IntelToolHistory } from "@/components/IntelToolHistory";
import { IntelToolNav } from "@/components/IntelToolNav";
import { useState } from "react";
import { Sparkles, Search, AlertCircle } from "lucide-react";

export default function CuratePage() {
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCurate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic, source }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Curation started! Processing: "${topic}". Check history below for results.`);
        setTopic('');
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || 'Failed to start curation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Enter topic to curate..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCurate()}
              disabled={loading}
              style={{
                flex: 1,
                padding: '20px 24px',
                fontSize: '16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'text',
              }}
            />
            <button
              onClick={handleCurate}
              disabled={loading || !topic.trim()}
              style={{
                padding: '20px 40px',
                background: loading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
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
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: source === s ? 'rgba(139, 92, 246, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                  border: `1px solid ${source === s ? 'rgba(139, 92, 246, 0.5)' : 'rgba(148, 163, 184, 0.2)'}`,
                  borderRadius: '8px',
                  color: source === s ? '#a78bfa' : '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textTransform: 'capitalize',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <AlertCircle size={20} style={{ color: '#fca5a5', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ color: '#fca5a5', fontSize: '14px' }}>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#86efac',
            fontSize: '14px',
          }}>
            ✓ {success}
          </div>
        )}

        {/* History */}
        <IntelToolHistory toolName="curate" collectionName="curate_history" />
      </div>
    </div>
  );
}
