"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Radar,
  Search,
  Loader2,
  Brain,
  ExternalLink,
  Video,
  FileText,
  File,
  BarChart3,
  Image,
  ChevronDown,
  ChevronUp,
  Cog,
  Lightbulb,
  MessageSquare,
  Eye,
  Clock,
  MessageCircle,
  Headphones,
  AtSign,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { useRecentSearches } from "@/contexts/RecentSearchesContext";
import { useSearchReports } from "@/contexts/SearchReportsContext";

interface ReportLink {
  title: string;
  url: string;
  type: string;
}

interface ReportSection {
  title: string;
  content: string;
  links?: ReportLink[];
}

interface SocialMediaHighlight {
  platform: string;
  author: string;
  content: string;
  url: string;
}

interface PodcastReference {
  title: string;
  episode: string;
  timestamp?: string;
  summary: string;
  url: string;
}

interface DeepSearchReport {
  topic: string;
  briefOverview: string;
  sections: ReportSection[];
  hiddenMechanics: string[];
  counterintuitiveInsights: string[];
  expertDebates: string[];
  underreportedAngles: string[];
  socialMediaHighlights: SocialMediaHighlight[];
  podcastReferences: PodcastReference[];
  timestamp: number;
}

const LINK_ICONS: Record<string, typeof Video> = {
  video: Video,
  article: FileText,
  document: File,
  data: BarChart3,
  image: Image,
  social: MessageCircle,
  podcast: Headphones,
};

const LINK_COLORS: Record<string, string> = {
  video: "239, 68, 68", // red
  article: "59, 130, 246", // blue
  document: "168, 85, 247", // purple
  data: "34, 197, 94", // green
  image: "249, 115, 22", // orange
  social: "29, 161, 242", // twitter blue
  podcast: "139, 92, 246", // violet
};

export default function DeepSearchPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DeepSearchReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const { addRecentSearch, getRecentSearches, isToolEnabled } = useRecentSearches();
  const { saveDeepSearchReport } = useSearchReports();

  const recentSearches = getRecentSearches("deep-search");
  const showRecentSearches = isToolEnabled("deep-search") && recentSearches.length > 0 && !query && !report;

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);
    setReport(null);
    setExpandedSections(new Set([0])); // Expand first section by default

    try {
      const response = await fetch("/api/deep-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      setReport(data.report);
      addRecentSearch("deep-search", q.trim());

      // Save to Firestore
      saveDeepSearchReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [query, addRecentSearch, saveDeepSearchReport]);

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearReport = () => {
    setReport(null);
    setQuery("");
    setError(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div
          style={{
            width: "80%",
            maxWidth: report ? "1200px" : "1000px",
            margin: "0 auto",
            padding: "32px 24px 100px 24px",
            transition: "max-width 0.3s ease",
          }}
        >
          <RemindersBanner />

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: "32px" }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "32px", textAlign: "center" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                marginBottom: "24px",
              }}
            >
              <Radar style={{ width: "40px", height: "40px", color: "var(--accent)" }} />
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "12px",
              }}
            >
              Deep Search
            </h1>
            <p style={{ fontSize: "16px", color: "var(--foreground-muted)", maxWidth: "600px", margin: "0 auto" }}>
              Expert-level research for those who already know the basics. Discover the nuances, hidden mechanics, and insights that most people miss.
            </p>
          </motion.div>

          {/* Info Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
              backgroundColor: "rgba(var(--accent-rgb), 0.1)",
              border: "1px solid rgba(var(--accent-rgb), 0.2)",
              display: "flex",
              gap: "12px",
            }}
          >
            <Brain style={{ width: "20px", height: "20px", color: "var(--accent)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--accent)", marginBottom: "4px" }}>
                Built for Experts
              </p>
              <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                This tool assumes you already understand the fundamentals. Reports focus 90% on nuances, hidden mechanics, and counterintuitive insights that even educated people typically miss.
              </p>
            </div>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass"
            style={{
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a topic you want to understand deeply..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  borderRadius: "10px",
                  border: "1px solid rgba(var(--accent-rgb), 0.2)",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  color: "var(--foreground)",
                  fontSize: "16px",
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleSearch()}
                disabled={isLoading || !query.trim()}
                style={{
                  padding: "14px 28px",
                  borderRadius: "10px",
                  backgroundColor: isLoading || !query.trim() ? "rgba(var(--accent-rgb), 0.3)" : "var(--accent)",
                  color: isLoading || !query.trim() ? "rgba(var(--foreground), 0.5)" : "var(--background)",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: isLoading || !query.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search style={{ width: "18px", height: "18px" }} />
                    <span>Go Deep</span>
                  </>
                )}
              </button>
            </div>

            {/* Recent Searches */}
            {showRecentSearches && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(var(--accent-rgb), 0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Clock style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                  <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Recent searches</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {recentSearches.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(item.query)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                        border: "1px solid rgba(var(--accent-rgb), 0.2)",
                        color: "var(--foreground-muted)",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Example Topics */}
            {!report && !isLoading && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                  Example topics:
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {[
                    "How venture capital actually works",
                    "The mechanics of high-frequency trading",
                    "How pharmaceutical pricing is set",
                    "The real dynamics of startup acquisitions",
                    "How lobbying actually influences policy",
                  ].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setQuery(topic);
                        handleSearch(topic);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(var(--accent-rgb), 0.05)",
                        border: "1px solid rgba(var(--accent-rgb), 0.1)",
                        color: "var(--foreground-muted)",
                        fontSize: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "24px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <p style={{ fontSize: "14px", color: "#f87171" }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass"
                style={{
                  borderRadius: "16px",
                  padding: "48px",
                  textAlign: "center",
                }}
              >
                <Loader2
                  style={{
                    width: "48px",
                    height: "48px",
                    color: "var(--accent)",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 20px",
                  }}
                />
                <p style={{ fontSize: "18px", color: "var(--foreground)", marginBottom: "8px" }}>
                  Going Beyond the Surface...
                </p>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Analyzing nuances, hidden mechanics, and expert-level insights
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Report Display */}
          <AnimatePresence>
            {report && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Report Header */}
                <div
                  className="glass"
                  style={{
                    borderRadius: "16px",
                    padding: "32px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
                      Deep Dive: {report.topic}
                    </h2>
                    <button
                      onClick={clearReport}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(var(--accent-rgb), 0.1)",
                        border: "1px solid rgba(var(--accent-rgb), 0.2)",
                        color: "var(--accent)",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      New Search
                    </button>
                  </div>

                  {/* Brief Overview */}
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Quick Context
                    </h3>
                    <p style={{ fontSize: "15px", color: "var(--foreground)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {report.briefOverview}
                    </p>
                  </div>

                  {/* Hidden Mechanics */}
                  {report.hiddenMechanics.length > 0 && (
                    <div
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(168, 85, 247, 0.1)",
                        border: "1px solid rgba(168, 85, 247, 0.2)",
                      }}
                    >
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "rgb(192, 132, 252)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Cog style={{ width: "18px", height: "18px" }} />
                        Hidden Mechanics
                      </h3>
                      <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        {report.hiddenMechanics.map((item, index) => (
                          <li key={index} style={{ fontSize: "14px", color: "var(--foreground)", marginBottom: "8px", lineHeight: 1.5 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sections */}
                {report.sections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass"
                    style={{
                      borderRadius: "16px",
                      marginBottom: "16px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => toggleSection(index)}
                      style={{
                        width: "100%",
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--foreground)" }}>
                        {section.title}
                      </h3>
                      {expandedSections.has(index) ? (
                        <ChevronUp style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                      ) : (
                        <ChevronDown style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedSections.has(index) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ padding: "0 24px 24px" }}>
                            <p style={{ fontSize: "15px", color: "var(--foreground)", lineHeight: 1.7, marginBottom: "16px", whiteSpace: "pre-wrap" }}>
                              {section.content}
                            </p>

                            {/* Section Links */}
                            {section.links && section.links.length > 0 && (
                              <div style={{ marginTop: "16px" }}>
                                <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  Go Deeper
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  {section.links.map((link, linkIndex) => {
                                    const Icon = LINK_ICONS[link.type] || FileText;
                                    const colorRgb = LINK_COLORS[link.type] || "var(--accent-rgb)";
                                    return (
                                      <a
                                        key={linkIndex}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "12px",
                                          padding: "12px 16px",
                                          borderRadius: "10px",
                                          backgroundColor: `rgba(${colorRgb}, 0.1)`,
                                          border: `1px solid rgba(${colorRgb}, 0.2)`,
                                          textDecoration: "none",
                                          transition: "all 0.2s ease",
                                        }}
                                      >
                                        <Icon style={{ width: "18px", height: "18px", color: `rgb(${colorRgb})`, flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {link.title}
                                          </p>
                                          <p style={{ fontSize: "12px", color: "var(--foreground-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {link.url}
                                          </p>
                                        </div>
                                        <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}

                {/* Counterintuitive Insights */}
                {report.counterintuitiveInsights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass"
                    style={{
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "16px",
                    }}
                  >
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Lightbulb style={{ width: "20px", height: "20px", color: "#fbbf24" }} />
                      Counterintuitive Insights
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {report.counterintuitiveInsights.map((insight, index) => (
                        <li key={index} style={{ fontSize: "14px", color: "var(--foreground)", marginBottom: "10px", lineHeight: 1.6 }}>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Expert Debates */}
                {report.expertDebates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass"
                    style={{
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "16px",
                    }}
                  >
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <MessageSquare style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                      What Experts Argue About
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {report.expertDebates.map((debate, index) => (
                        <li key={index} style={{ fontSize: "14px", color: "var(--foreground)", marginBottom: "10px", lineHeight: 1.6 }}>
                          {debate}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Underreported Angles */}
                {report.underreportedAngles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass"
                    style={{
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "16px",
                    }}
                  >
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Eye style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                      Underreported Angles
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {report.underreportedAngles.map((angle, index) => (
                        <li key={index} style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "10px", lineHeight: 1.6, fontStyle: "italic" }}>
                          {angle}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Social Media Highlights */}
                {report.socialMediaHighlights && report.socialMediaHighlights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass"
                    style={{
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "16px",
                    }}
                  >
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <AtSign style={{ width: "20px", height: "20px", color: "rgb(29, 161, 242)" }} />
                      Expert Social Media Insights
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {report.socialMediaHighlights.map((post, index) => (
                        <a
                          key={index}
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block",
                            padding: "16px",
                            borderRadius: "12px",
                            backgroundColor: "rgba(29, 161, 242, 0.1)",
                            border: "1px solid rgba(29, 161, 242, 0.2)",
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", color: "rgb(29, 161, 242)", fontWeight: 500 }}>{post.platform}</span>
                            <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>•</span>
                            <span style={{ fontSize: "13px", color: "var(--foreground)", fontWeight: 500 }}>{post.author}</span>
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                            &ldquo;{post.content}&rdquo;
                          </p>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Podcast References */}
                {report.podcastReferences && report.podcastReferences.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass"
                    style={{
                      borderRadius: "16px",
                      padding: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Headphones style={{ width: "20px", height: "20px", color: "rgb(139, 92, 246)" }} />
                      Expert Podcast Discussions
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {report.podcastReferences.map((podcast, index) => (
                        <a
                          key={index}
                          href={podcast.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block",
                            padding: "16px",
                            borderRadius: "12px",
                            backgroundColor: "rgba(139, 92, 246, 0.1)",
                            border: "1px solid rgba(139, 92, 246, 0.2)",
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "14px", color: "var(--foreground)", fontWeight: 600 }}>{podcast.title}</span>
                            <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>•</span>
                            <span style={{ fontSize: "13px", color: "rgb(139, 92, 246)" }}>{podcast.episode}</span>
                            {podcast.timestamp && (
                              <>
                                <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>•</span>
                                <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{podcast.timestamp}</span>
                              </>
                            )}
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6, margin: 0 }}>
                            {podcast.summary}
                          </p>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
