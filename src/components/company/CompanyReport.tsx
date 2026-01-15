"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  TrendingUp,
  Users,
  Newspaper,
  MessageSquareQuote,
  DollarSign,
  Scale,
  Layers,
  ChevronDown,
} from "lucide-react";
import { CompanyAnalysis } from "@/types/company";

interface CompanyReportProps {
  report: CompanyAnalysis;
  cached?: boolean;
}

function PoliticalLeaningBadge({ leaning }: { leaning: string }) {
  return (
    <span className="bg-gray-600 rounded-full px-4 py-1.5 text-sm font-medium text-white">
      {leaning}
    </span>
  );
}

function PoliticalCompass({ economicScore, governmentScore, companyName }: { economicScore: number; governmentScore: number; companyName: string }) {
  // Convert scores from -100 to 100 range to 0-100% for positioning
  const xPos = ((economicScore + 100) / 200) * 100;
  const yPos = ((100 - governmentScore) / 200) * 100; // Invert Y so positive is up

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        aspectRatio: "1",
        position: "relative",
        margin: "0 auto",
      }}
    >
      {/* Grid background */}
      <svg
        viewBox="0 0 200 200"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* No colored quadrants - just neutral background */}
        <rect x="0" y="0" width="200" height="200" fill="rgba(128, 128, 128, 0.08)" />

        {/* Grid lines */}
        <line x1="100" y1="0" x2="100" y2="200" stroke="var(--glass-border)" strokeWidth="2" />
        <line x1="0" y1="100" x2="200" y2="100" stroke="var(--glass-border)" strokeWidth="2" />

        {/* Minor grid lines */}
        <line x1="50" y1="0" x2="50" y2="200" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="4,4" />
        <line x1="150" y1="0" x2="150" y2="200" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="4,4" />
        <line x1="0" y1="50" x2="200" y2="50" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="4,4" />
        <line x1="0" y1="150" x2="200" y2="150" stroke="var(--glass-border)" strokeWidth="0.5" strokeDasharray="4,4" />

        {/* Border */}
        <rect x="0" y="0" width="200" height="200" fill="none" stroke="var(--glass-border)" strokeWidth="2" />

        {/* Company marker */}
        <circle
          cx={xPos * 2}
          cy={yPos * 2}
          r="8"
          fill="var(--accent)"
          stroke="var(--background)"
          strokeWidth="2"
        />
        <circle
          cx={xPos * 2}
          cy={yPos * 2}
          r="12"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          opacity="0.5"
        />
      </svg>

      {/* Labels */}
      <div
        style={{
          position: "absolute",
          top: "-28px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--foreground)",
          textAlign: "center",
        }}
      >
        More Government
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "-28px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--foreground)",
          textAlign: "center",
        }}
      >
        Less Government
      </div>
      <div
        style={{
          position: "absolute",
          left: "-8px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--foreground)",
          whiteSpace: "nowrap",
        }}
      >
        Left
      </div>
      <div
        style={{
          position: "absolute",
          right: "-12px",
          top: "50%",
          transform: "translateY(-50%) rotate(90deg)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--foreground)",
          whiteSpace: "nowrap",
        }}
      >
        Right
      </div>

      {/* Quadrant labels - neutral colors */}
      <div style={{ position: "absolute", top: "8px", left: "8px", fontSize: "10px", color: "var(--foreground-muted)", fontWeight: 500 }}>
        Auth Left
      </div>
      <div style={{ position: "absolute", top: "8px", right: "8px", fontSize: "10px", color: "var(--foreground-muted)", fontWeight: 500 }}>
        Auth Right
      </div>
      <div style={{ position: "absolute", bottom: "8px", left: "8px", fontSize: "10px", color: "var(--foreground-muted)", fontWeight: 500 }}>
        Lib Left
      </div>
      <div style={{ position: "absolute", bottom: "8px", right: "8px", fontSize: "10px", color: "var(--foreground-muted)", fontWeight: 500 }}>
        Lib Right
      </div>

      {/* Company name tooltip */}
      <div
        style={{
          position: "absolute",
          left: `${xPos}%`,
          top: `${yPos}%`,
          transform: "translate(-50%, -150%)",
          backgroundColor: "var(--glass-background)",
          border: "1px solid var(--glass-border)",
          borderRadius: "6px",
          padding: "4px 8px",
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--foreground)",
          whiteSpace: "nowrap",
          backdropFilter: "blur(8px)",
        }}
      >
        {companyName}
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  count,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count?: number;
}) {
  // Always expanded - no collapse functionality
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          textAlign: "left",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Icon style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{title}</span>
          {count !== undefined && (
            <span
              style={{
                borderRadius: "9999px",
                backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                padding: "2px 8px",
                fontSize: "12px",
                color: "var(--accent)",
              }}
            >
              {count}
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

// Expandable grid component for subsidiaries and affiliates
function ExpandableGrid<T>({
  items,
  renderItem,
  initialCount = 10,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  initialCount?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayedItems = showAll ? items : items.slice(0, initialCount);
  const hasMore = items.length > initialCount;

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {displayedItems.map((item, i) => renderItem(item, i))}
      </div>
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            marginTop: "20px",
            padding: "12px 20px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--glass-border)",
            color: "var(--foreground-muted)",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <ChevronDown style={{ width: "16px", height: "16px" }} />
          Show {items.length - initialCount} more
        </button>
      )}
    </div>
  );
}

export function CompanyReport({ report, cached }: CompanyReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "80px" }}
    >
      {/* Header */}
      <div className="glass rounded-2xl" style={{ padding: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "space-between" }}>
            <div style={{ flex: 1, minWidth: "280px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>{report.companyName}</h2>
                {report.ticker && (
                  <span
                    style={{
                      borderRadius: "4px",
                      backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                      padding: "4px 8px",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      color: "var(--accent)",
                    }}
                  >
                    {report.ticker}
                  </span>
                )}
              </div>
              <p style={{ color: "var(--foreground-muted)", marginBottom: "16px" }}>{report.industry}</p>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.7 }}>{report.description}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
              <PoliticalLeaningBadge leaning={report.overallLeaning} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span style={{ color: "var(--foreground-muted)" }}>Confidence:</span>
                <span style={{ fontWeight: 500, color: "var(--accent)" }}>{report.confidenceScore}%</span>
              </div>
              {cached && (
                <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Cached result</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Political Compass */}
      {(report.economicScore !== undefined && report.governmentScore !== undefined) && (
        <div className="glass rounded-2xl" style={{ padding: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "24px", textAlign: "center" }}>Political Compass</h3>
          <div style={{ padding: "40px 24px" }}>
            <PoliticalCompass
              economicScore={report.economicScore}
              governmentScore={report.governmentScore}
              companyName={report.companyName}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "48px", marginTop: "24px", fontSize: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--foreground-muted)" }}>Economic:</span>
              <span style={{ fontWeight: 500, color: "var(--foreground)" }}>
                {report.economicScore > 0 ? '+' : ''}{report.economicScore}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--foreground-muted)" }}>Government:</span>
              <span style={{ fontWeight: 500, color: "var(--foreground)" }}>
                {report.governmentScore > 0 ? '+' : ''}{report.governmentScore}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Positions */}
      <Section title="Political Positions" icon={Scale} count={report.positions.length}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {report.positions.map((position, i) => (
            <div key={i} style={{ borderLeft: "2px solid rgba(var(--accent-rgb), 0.3)", paddingLeft: "16px", paddingTop: "4px", paddingBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{position.topic}</span>
                <span style={{ fontSize: "14px", color: "var(--accent)" }}>• {position.stance}</span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.7 }}>{position.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Subsidiaries */}
      {report.subsidiaries && report.subsidiaries.length > 0 && (
        <Section title="Subsidiaries & Owned Companies" icon={Layers} count={report.subsidiaries.length}>
          <ExpandableGrid
            items={report.subsidiaries}
            initialCount={9}
            renderItem={(subsidiary, i) => (
              <div
                key={i}
                style={{
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  padding: "20px",
                }}
              >
                <div style={{ fontWeight: 500, color: "var(--foreground)", marginBottom: "6px" }}>{subsidiary.name}</div>
                <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "10px" }}>{subsidiary.industry}</div>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.7 }}>{subsidiary.description}</p>
                {subsidiary.acquisitionYear && (
                  <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "12px" }}>Acquired: {subsidiary.acquisitionYear}</div>
                )}
              </div>
            )}
          />
        </Section>
      )}

      {/* Affiliates */}
      <Section title="Partners, Affiliates & Associates" icon={Users} count={report.affiliates.length}>
        <ExpandableGrid
          items={report.affiliates}
          initialCount={9}
          renderItem={(affiliate, i) => (
            <div
              key={i}
              style={{
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: "20px",
              }}
            >
              <div style={{ fontWeight: 500, color: "var(--foreground)", marginBottom: "6px" }}>{affiliate.name}</div>
              <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "10px" }}>{affiliate.relationship}</div>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.7 }}>{affiliate.description}</p>
            </div>
          )}
        />
      </Section>

      {/* News */}
      <Section title="Recent News" icon={Newspaper} count={report.newsItems.length}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {report.newsItems.map((item, i) => (
            <div key={i} style={{ borderBottom: i < report.newsItems.length - 1 ? "1px solid var(--glass-border)" : "none", paddingBottom: i < report.newsItems.length - 1 ? "20px" : "0" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <h4 style={{ fontWeight: 500, color: "var(--foreground)" }}>{item.headline}</h4>
                <span
                  style={{
                    flexShrink: 0,
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    backgroundColor: item.sentiment === "positive"
                      ? "rgba(34, 197, 94, 0.2)"
                      : item.sentiment === "negative"
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(107, 114, 128, 0.2)",
                    color: item.sentiment === "positive"
                      ? "#22c55e"
                      : item.sentiment === "negative"
                        ? "#ef4444"
                        : "#9ca3af",
                  }}
                >
                  {item.sentiment}
                </span>
              </div>
              <p style={{ marginTop: "10px", fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.7 }}>{item.summary}</p>
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                <span>{item.source}</span>
                <span>•</span>
                <span>{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Donations */}
      <Section title="Political Donations" icon={DollarSign} count={report.donations.length}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {report.donations.map((donation, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: "20px",
              }}
            >
              <div>
                <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{donation.recipient}</span>
                <span
                  style={{
                    marginLeft: "10px",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    backgroundColor: donation.party === "Democrat"
                      ? "rgba(59, 130, 246, 0.2)"
                      : donation.party === "Republican"
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(107, 114, 128, 0.2)",
                    color: donation.party === "Democrat"
                      ? "#3b82f6"
                      : donation.party === "Republican"
                        ? "#ef4444"
                        : "#9ca3af",
                  }}
                >
                  {donation.party}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 500, color: "var(--accent)" }}>{donation.amount}</div>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>{donation.date}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Public Statements */}
      <Section
        title="Public Statements"
        icon={MessageSquareQuote}
        count={report.publicStatements.length}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {report.publicStatements.map((statement, i) => (
            <div key={i} style={{ borderLeft: "2px solid rgba(var(--accent-rgb), 0.3)", paddingLeft: "16px", paddingTop: "4px", paddingBottom: "4px" }}>
              <blockquote style={{ color: "var(--foreground)", fontStyle: "italic", lineHeight: 1.7 }}>"{statement.statement}"</blockquote>
              <div style={{ marginTop: "12px", fontSize: "14px" }}>
                <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{statement.speaker}</span>
                <span style={{ color: "var(--foreground-muted)" }}> • {statement.role}</span>
              </div>
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                <span>{statement.topic}</span>
                <span>•</span>
                <span>{statement.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Revenue Allocation */}
      <Section
        title="Revenue Allocation"
        icon={TrendingUp}
        count={report.revenueAllocation.length}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {report.revenueAllocation.map((item, i) => (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>{item.category}</span>
                <span style={{ fontSize: "14px", color: "var(--accent)" }}>{item.percentage}%</span>
              </div>
              <div style={{ height: "8px", borderRadius: "9999px", backgroundColor: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: "9999px",
                    backgroundColor: "var(--accent)",
                    width: `${item.percentage}%`,
                  }}
                />
              </div>
              <p style={{ marginTop: "10px", fontSize: "12px", color: "var(--foreground-muted)", lineHeight: 1.7 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Lobbying */}
      <Section
        title="Lobbying Activities"
        icon={Building2}
        count={report.lobbyingActivities.length}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {report.lobbyingActivities.map((activity, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "16px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: "20px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: "var(--foreground)", marginBottom: "10px" }}>{activity.issue}</div>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.7 }}>{activity.description}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 500, color: "var(--accent)" }}>{activity.amount}</div>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>{activity.year}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </motion.div>
  );
}
