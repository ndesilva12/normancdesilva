"use client";

import { ExternalLink } from "lucide-react";

interface DeepSearchResultsProps {
  results: any;
  color: string;
}

export function DeepSearchResults({ results, color }: DeepSearchResultsProps) {
  if (!results) return null;

  const renderSection = (title: string, content: any, sectionColor: string) => {
    if (!content) return null;

    return (
      <div
        style={{
          background: `${sectionColor}10`,
          border: `1px solid ${sectionColor}30`,
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: sectionColor,
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </h3>
        <div
          style={{
            fontSize: "14px",
            color: "#cbd5e1",
            lineHeight: "1.7",
            whiteSpace: "pre-wrap",
          }}
        >
          {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        </div>
      </div>
    );
  };

  const renderLinks = (links: any[]) => {
    if (!links || !Array.isArray(links) || links.length === 0) return null;

    return (
      <div
        style={{
          background: "rgba(59, 130, 246, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#3b82f6",
            marginBottom: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Sources
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {links.map((link: any, idx: number) => {
            const url = typeof link === 'string' ? link : link.url || link.link;
            const title = typeof link === 'object' ? link.title || link.name : url;
            
            return (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  borderRadius: "8px",
                  color: "#60a5fa",
                  textDecoration: "none",
                  fontSize: "13px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
                }}
              >
                <ExternalLink style={{ width: "14px", height: "14px", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {title || url}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "rgba(30, 41, 59, 0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(148, 163, 184, 0.15)",
        borderRadius: "16px",
        padding: "32px",
        marginBottom: "32px",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "white",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        Results
      </h2>

      {/* Try to intelligently parse the results */}
      {results.overview && renderSection("Overview", results.overview, "#8b5cf6")}
      {results.summary && renderSection("Summary", results.summary, "#8b5cf6")}
      {results.keyTakeaways && renderSection("Key Takeaways", results.keyTakeaways, "#10b981")}
      {results.key_takeaways && renderSection("Key Takeaways", results.key_takeaways, "#10b981")}
      {results.insights && renderSection("Insights", results.insights, "#10b981")}
      {results.counterintuitive && renderSection("Counterintuitive Insights", results.counterintuitive, "#06b6d4")}
      {results.alternative_perspectives && renderSection("Alternative Perspectives", results.alternative_perspectives, "#06b6d4")}
      {results.debates && renderSection("Expert Debates", results.debates, "#f59e0b")}
      {results.expert_debates && renderSection("Expert Debates", results.expert_debates, "#f59e0b")}
      {results.unanswered && renderSection("Unanswered Questions", results.unanswered, "#f59e0b")}
      {results.underreported && renderSection("Underreported Angles", results.underreported, "#ec4899")}
      {results.underreported_angles && renderSection("Underreported Angles", results.underreported_angles, "#ec4899")}
      {results.hidden_mechanics && renderSection("Hidden Mechanics", results.hidden_mechanics, "#6366f1")}
      
      {/* Sources/Links */}
      {results.sources && renderLinks(results.sources)}
      {results.links && renderLinks(results.links)}
      {results.urls && renderLinks(results.urls)}

      {/* Fallback: display everything else */}
      {Object.keys(results).filter(key => 
        !['overview', 'summary', 'keyTakeaways', 'key_takeaways', 'insights', 
          'counterintuitive', 'alternative_perspectives', 'debates', 'expert_debates',
          'unanswered', 'underreported', 'underreported_angles', 'hidden_mechanics',
          'sources', 'links', 'urls'].includes(key)
      ).map(key => (
        renderSection(
          key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          results[key],
          color
        )
      ))}
    </div>
  );
}
