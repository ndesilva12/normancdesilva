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

      {/* Affiliates */}
      <Section title="Key Affiliates" icon={Users} count={report.affiliates.length}>
        <div className="grid gap-3 sm:grid-cols-2">
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
