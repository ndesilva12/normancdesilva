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
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
} from "lucide-react";
import { CompanyAnalysis } from "@/types/company";

interface CompanyReportProps {
  report: CompanyAnalysis;
  cached?: boolean;
}

function PoliticalLeaningBadge({ leaning }: { leaning: string }) {
  const getColor = () => {
    switch (leaning) {
      case "Far Left":
        return "bg-blue-600";
      case "Left":
        return "bg-blue-500";
      case "Center-Left":
        return "bg-blue-400";
      case "Center":
        return "bg-gray-500";
      case "Center-Right":
        return "bg-red-400";
      case "Right":
        return "bg-red-500";
      case "Far Right":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <span className={`${getColor()} rounded-full px-4 py-1.5 text-sm font-medium text-white`}>
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
        {/* Background quadrants */}
        <rect x="0" y="0" width="100" height="100" fill="rgba(147, 51, 234, 0.15)" /> {/* Top-Left: Authoritarian Left */}
        <rect x="100" y="0" width="100" height="100" fill="rgba(59, 130, 246, 0.15)" /> {/* Top-Right: Authoritarian Right */}
        <rect x="0" y="100" width="100" height="100" fill="rgba(34, 197, 94, 0.15)" /> {/* Bottom-Left: Libertarian Left */}
        <rect x="100" y="100" width="100" height="100" fill="rgba(234, 179, 8, 0.15)" /> {/* Bottom-Right: Libertarian Right */}

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

      {/* Quadrant labels */}
      <div style={{ position: "absolute", top: "8px", left: "8px", fontSize: "10px", color: "rgba(147, 51, 234, 0.8)", fontWeight: 500 }}>
        Auth Left
      </div>
      <div style={{ position: "absolute", top: "8px", right: "8px", fontSize: "10px", color: "rgba(59, 130, 246, 0.8)", fontWeight: 500 }}>
        Auth Right
      </div>
      <div style={{ position: "absolute", bottom: "8px", left: "8px", fontSize: "10px", color: "rgba(34, 197, 94, 0.8)", fontWeight: 500 }}>
        Lib Left
      </div>
      <div style={{ position: "absolute", bottom: "8px", right: "8px", fontSize: "10px", color: "rgba(234, 179, 8, 0.8)", fontWeight: 500 }}>
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
  defaultOpen = true,
  count,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-glass-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-accent" />
          <span className="font-medium text-foreground">{title}</span>
          {count !== undefined && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
              {count}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-foreground-muted" />
        ) : (
          <ChevronDown className="h-5 w-5 text-foreground-muted" />
        )}
      </button>
      {isOpen && <div className="border-t border-glass-border p-4">{children}</div>}
    </div>
  );
}

export function CompanyReport({ report, cached }: CompanyReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground">{report.companyName}</h2>
              {report.ticker && (
                <span className="rounded bg-accent/20 px-2 py-0.5 text-sm font-mono text-accent">
                  {report.ticker}
                </span>
              )}
            </div>
            <p className="text-foreground-muted mb-3">{report.industry}</p>
            <p className="text-sm text-foreground-muted leading-relaxed">{report.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PoliticalLeaningBadge leaning={report.overallLeaning} />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground-muted">Confidence:</span>
              <span className="font-medium text-accent">{report.confidenceScore}%</span>
            </div>
            {cached && (
              <span className="text-xs text-foreground-muted">Cached result</span>
            )}
          </div>
        </div>
      </div>

      {/* Political Compass */}
      {(report.economicScore !== undefined && report.governmentScore !== undefined) && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Political Compass</h3>
          <div style={{ padding: "32px 24px" }}>
            <PoliticalCompass
              economicScore={report.economicScore}
              governmentScore={report.governmentScore}
              companyName={report.companyName}
            />
          </div>
          <div className="flex justify-center gap-8 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-foreground-muted">Economic:</span>
              <span className={`font-medium ${report.economicScore < 0 ? 'text-blue-400' : report.economicScore > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {report.economicScore > 0 ? '+' : ''}{report.economicScore}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground-muted">Government:</span>
              <span className={`font-medium ${report.governmentScore > 0 ? 'text-purple-400' : report.governmentScore < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {report.governmentScore > 0 ? '+' : ''}{report.governmentScore}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Positions */}
      <Section title="Political Positions" icon={Scale} count={report.positions.length}>
        <div className="space-y-3">
          {report.positions.map((position, i) => (
            <div key={i} className="border-l-2 border-accent/30 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground">{position.topic}</span>
                <span className="text-sm text-accent">• {position.stance}</span>
              </div>
              <p className="text-sm text-foreground-muted">{position.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Subsidiaries */}
      {report.subsidiaries && report.subsidiaries.length > 0 && (
        <Section title="Subsidiaries (Companies Owned)" icon={Layers} count={report.subsidiaries.length}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.subsidiaries.map((subsidiary, i) => (
              <div key={i} className="rounded-lg bg-white/5 p-3">
                <div className="font-medium text-foreground">{subsidiary.name}</div>
                <div className="text-xs text-accent mb-1">{subsidiary.industry}</div>
                <p className="text-sm text-foreground-muted">{subsidiary.description}</p>
                {subsidiary.acquisitionYear && (
                  <div className="text-xs text-foreground-muted mt-1">Acquired: {subsidiary.acquisitionYear}</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Affiliates */}
      <Section title="Key Affiliates & Partners" icon={Users} count={report.affiliates.length}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.affiliates.map((affiliate, i) => (
            <div key={i} className="rounded-lg bg-white/5 p-3">
              <div className="font-medium text-foreground">{affiliate.name}</div>
              <div className="text-xs text-accent mb-1">{affiliate.relationship}</div>
              <p className="text-sm text-foreground-muted">{affiliate.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* News */}
      <Section title="Recent News" icon={Newspaper} count={report.newsItems.length} defaultOpen={false}>
        <div className="space-y-3">
          {report.newsItems.map((item, i) => (
            <div key={i} className="border-b border-glass-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-foreground">{item.headline}</h4>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                    item.sentiment === "positive"
                      ? "bg-green-500/20 text-green-400"
                      : item.sentiment === "negative"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {item.sentiment}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground-muted">{item.summary}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                <span>{item.source}</span>
                <span>•</span>
                <span>{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Donations */}
      <Section title="Political Donations" icon={DollarSign} count={report.donations.length} defaultOpen={false}>
        <div className="space-y-2">
          {report.donations.map((donation, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-white/5 p-3"
            >
              <div>
                <span className="font-medium text-foreground">{donation.recipient}</span>
                <span
                  className={`ml-2 rounded px-2 py-0.5 text-xs ${
                    donation.party === "Democrat"
                      ? "bg-blue-500/20 text-blue-400"
                      : donation.party === "Republican"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {donation.party}
                </span>
              </div>
              <div className="text-right">
                <div className="font-medium text-accent">{donation.amount}</div>
                <div className="text-xs text-foreground-muted">{donation.date}</div>
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
        defaultOpen={false}
      >
        <div className="space-y-4">
          {report.publicStatements.map((statement, i) => (
            <div key={i} className="border-l-2 border-accent/30 pl-4">
              <blockquote className="text-foreground italic">"{statement.statement}"</blockquote>
              <div className="mt-2 text-sm">
                <span className="font-medium text-foreground">{statement.speaker}</span>
                <span className="text-foreground-muted"> • {statement.role}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-foreground-muted">
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
        defaultOpen={false}
      >
        <div className="space-y-3">
          {report.revenueAllocation.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{item.category}</span>
                <span className="text-sm text-accent">{item.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-foreground-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Lobbying */}
      <Section
        title="Lobbying Activities"
        icon={Building2}
        count={report.lobbyingActivities.length}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {report.lobbyingActivities.map((activity, i) => (
            <div key={i} className="flex items-start justify-between gap-4 rounded-lg bg-white/5 p-3">
              <div className="flex-1">
                <div className="font-medium text-foreground">{activity.issue}</div>
                <p className="mt-1 text-sm text-foreground-muted">{activity.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-medium text-accent">{activity.amount}</div>
                <div className="text-xs text-foreground-muted">{activity.year}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </motion.div>
  );
}
