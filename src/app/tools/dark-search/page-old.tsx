"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Moon,
  Search,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Video,
  FileText,
  File,
  BarChart3,
  Image,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  HelpCircle,
  Eye,
  Clock,
  MessageCircle,
  Headphones,
  AtSign,
  FileSearch,
  Link2,
  BookOpen,
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

type DarkSearchMode = "long" | "short" | "links";

interface DarkSearchReport {
  topic: string;
  mode: DarkSearchMode;
  summary: string;
  sections: ReportSection[];
  keyTakeaways: string[];
  alternativePerspectives: string[];
  unansweredQuestions: string[];
  socialMediaHighlights: SocialMediaHighlight[];
  podcastReferences: PodcastReference[];
  links?: ReportLink[];
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

export default function DarkSearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<DarkSearchMode>("long");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DarkSearchReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const { addRecentSearch, getRecentSearches, isToolEnabled } = useRecentSearches();
  const { saveDarkSearchReport } = useSearchReports();

  const recentSearches = getRecentSearches("dark-search");
  const showRecentSearches = isToolEnabled("dark-search") && recentSearches.length > 0 && !query && !report;

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);
    setReport(null);
    // Expand all sections by default
    setExpandedSections(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));

    try {
      const response = await fetch("/api/dark-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim(), mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      setReport(data.report);
      addRecentSearch("dark-search", q.trim());

      // Save to Firestore
      saveDarkSearchReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [query, mode, addRecentSearch, saveDarkSearchReport]);

  // Aggregate all links from all sections
  const getAllLinks = () => {
    if (!report) return { videos: [], articles: [], documents: [], data: [], images: [], social: [], podcasts: [] };

    const videos: ReportLink[] = [];
    const articles: ReportLink[] = [];
    const documents: ReportLink[] = [];
    const dataLinks: ReportLink[] = [];
    const images: ReportLink[] = [];
    const social: ReportLink[] = [];
    const podcasts: ReportLink[] = [];

    report.sections.forEach(section => {
      section.links?.forEach(link => {
        switch (link.type) {
          case 'video': videos.push(link); break;
          case 'article': articles.push(link); break;
          case 'document': documents.push(link); break;
          case 'data': dataLinks.push(link); break;
          case 'image': images.push(link); break;
          case 'social': social.push(link); break;
          case 'podcast': podcasts.push(link); break;
          default: articles.push(link);
        }
      });
    });

    return { videos, articles, documents, data: dataLinks, images, social, podcasts };
  };

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
              <Moon style={{ width: "40px", height: "40px", color: "var(--accent)" }} />
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "12px",
              }}
            >
              Dark Search
            </h1>
            <p style={{ fontSize: "16px", color: "var(--foreground-muted)", maxWidth: "600px", margin: "0 auto" }}>
              Comprehensive research reports exploring all perspectives - mainstream, alternative, and everything in between
            </p>
          </motion.div>

          {/* Warning Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              gap: "12px",
            }}
          >
            <AlertTriangle style={{ width: "20px", height: "20px", color: "#f59e0b", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#fbbf24", marginBottom: "4px" }}>
                Independent Research Tool
              </p>
              <p style={{ fontSize: "13px", color: "rgba(251, 191, 36, 0.8)" }}>
                This tool presents multiple perspectives including alternative and fringe viewpoints. Evaluate all information critically and conduct your own research.
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
            {/* Mode Selector */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--foreground-muted)", fontWeight: 500 }}>Output Mode</span>
                {query.trim() && (
                  <button
                    onClick={() => handleSearch()}
                    disabled={isLoading}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      backgroundColor: isLoading ? "rgba(var(--accent-rgb), 0.3)" : "var(--accent)",
                      color: isLoading ? "rgba(var(--foreground), 0.5)" : "var(--background)",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isLoading ? (
                      <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Search style={{ width: "12px", height: "12px" }} />
                    )}
                    <span>Search</span>
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setMode("long")}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: mode === "long" ? "rgba(var(--accent-rgb), 0.2)" : "rgba(0, 0, 0, 0.2)",
                    border: mode === "long" ? "2px solid var(--accent)" : "1px solid rgba(var(--accent-rgb), 0.2)",
                    color: mode === "long" ? "var(--accent)" : "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: mode === "long" ? 600 : 400,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  <BookOpen style={{ width: "20px", height: "20px" }} />
                  <span>Long</span>
                  <span style={{ fontSize: "11px", opacity: 0.7 }}>Full report</span>
                </button>
                <button
                  onClick={() => setMode("short")}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: mode === "short" ? "rgba(var(--accent-rgb), 0.2)" : "rgba(0, 0, 0, 0.2)",
                    border: mode === "short" ? "2px solid var(--accent)" : "1px solid rgba(var(--accent-rgb), 0.2)",
                    color: mode === "short" ? "var(--accent)" : "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: mode === "short" ? 600 : 400,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  <FileSearch style={{ width: "20px", height: "20px" }} />
                  <span>Short</span>
                  <span style={{ fontSize: "11px", opacity: 0.7 }}>2 paragraphs, 3 links</span>
                </button>
                <button
                  onClick={() => setMode("links")}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: mode === "links" ? "rgba(var(--accent-rgb), 0.2)" : "rgba(0, 0, 0, 0.2)",
                    border: mode === "links" ? "2px solid var(--accent)" : "1px solid rgba(var(--accent-rgb), 0.2)",
                    color: mode === "links" ? "var(--accent)" : "var(--foreground-muted)",
                    fontSize: "14px",
                    fontWeight: mode === "links" ? 600 : 400,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  <Link2 style={{ width: "20px", height: "20px" }} />
                  <span>Links</span>
                  <span style={{ fontSize: "11px", opacity: 0.7 }}>3 sentences, 10+ links</span>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a topic, question, or event to research..."
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
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <Search style={{ width: "18px", height: "18px" }} />
                    <span>Research</span>
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
                    "Federal Reserve and monetary policy",
                    "JFK assassination theories",
                    "Building 7 collapse analysis",
                    "Big pharma and regulatory capture",
                    "UFO disclosure and government secrecy",
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
                  Conducting Deep Research...
                </p>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  Analyzing mainstream sources, alternative perspectives, and fringe theories
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
                      Research Report: {report.topic}
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

                  {/* Summary */}
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Eye style={{ width: "18px", height: "18px" }} />
                      {report.mode === "links" ? "Overview" : report.mode === "short" ? "Summary" : "Executive Summary"}
                    </h3>
                    <p style={{ fontSize: "15px", color: "var(--foreground)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {report.summary}
                    </p>
                  </div>

                  {/* Direct Links for Short/Links modes */}
                  {(report.mode === "short" || report.mode === "links") && report.links && report.links.length > 0 && (
                    <div
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(var(--accent-rgb), 0.05)",
                        border: "1px solid rgba(var(--accent-rgb), 0.1)",
                      }}
                    >
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Link2 style={{ width: "18px", height: "18px" }} />
                        {report.mode === "links" ? `Resources (${report.links.length})` : "Key Resources"}
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {report.links.map((link, index) => {
                          const Icon = LINK_ICONS[link.type] || FileText;
                          const colorRgb = LINK_COLORS[link.type] || "var(--accent-rgb)";
                          return (
                            <a
                              key={index}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "14px 18px",
                                borderRadius: "10px",
                                backgroundColor: `rgba(${colorRgb}, 0.1)`,
                                border: `1px solid rgba(${colorRgb}, 0.2)`,
                                textDecoration: "none",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <Icon style={{ width: "20px", height: "20px", color: `rgb(${colorRgb})`, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", margin: 0 }}>
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

                  {/* Key Takeaways - only for long mode */}
                  {report.mode === "long" && report.keyTakeaways.length > 0 && (
                    <div
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(var(--accent-rgb), 0.05)",
                        border: "1px solid rgba(var(--accent-rgb), 0.1)",
                      }}
                    >
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Lightbulb style={{ width: "18px", height: "18px" }} />
                        Key Takeaways
                      </h3>
                      <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        {report.keyTakeaways.map((takeaway, index) => (
                          <li key={index} style={{ fontSize: "14px", color: "var(--foreground)", marginBottom: "8px", lineHeight: 1.5 }}>
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* AGGREGATED RESOURCES - Prominent at top (long mode only) */}
                {report.mode === "long" && (() => {
                  const allLinks = getAllLinks();
                  const hasAnyLinks = allLinks.videos.length > 0 || allLinks.articles.length > 0 || allLinks.documents.length > 0 || allLinks.data.length > 0;

                  if (!hasAnyLinks) return null;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="glass"
                      style={{
                        borderRadius: "16px",
                        padding: "24px",
                        marginBottom: "24px",
                      }}
                    >
                      <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", marginBottom: "20px" }}>
                        📚 All Resources & Links
                      </h3>

                      {/* Videos */}
                      {allLinks.videos.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                          <h4 style={{ fontSize: "15px", fontWeight: 600, color: "rgb(239, 68, 68)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Video style={{ width: "18px", height: "18px" }} />
                            Videos ({allLinks.videos.length})
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {allLinks.videos.map((link, i) => (
                              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", textDecoration: "none" }}>
                                <Video style={{ width: "16px", height: "16px", color: "rgb(239, 68, 68)", flexShrink: 0 }} />
                                <span style={{ fontSize: "14px", color: "var(--foreground)", flex: 1 }}>{link.title}</span>
                                <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Articles */}
                      {allLinks.articles.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                          <h4 style={{ fontSize: "15px", fontWeight: 600, color: "rgb(59, 130, 246)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <FileText style={{ width: "18px", height: "18px" }} />
                            Articles ({allLinks.articles.length})
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {allLinks.articles.map((link, i) => (
                              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", textDecoration: "none" }}>
                                <FileText style={{ width: "16px", height: "16px", color: "rgb(59, 130, 246)", flexShrink: 0 }} />
                                <span style={{ fontSize: "14px", color: "var(--foreground)", flex: 1 }}>{link.title}</span>
                                <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {allLinks.documents.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                          <h4 style={{ fontSize: "15px", fontWeight: 600, color: "rgb(168, 85, 247)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <File style={{ width: "18px", height: "18px" }} />
                            Documents ({allLinks.documents.length})
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {allLinks.documents.map((link, i) => (
                              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.2)", textDecoration: "none" }}>
                                <File style={{ width: "16px", height: "16px", color: "rgb(168, 85, 247)", flexShrink: 0 }} />
                                <span style={{ fontSize: "14px", color: "var(--foreground)", flex: 1 }}>{link.title}</span>
                                <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data */}
                      {allLinks.data.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: "15px", fontWeight: 600, color: "rgb(34, 197, 94)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <BarChart3 style={{ width: "18px", height: "18px" }} />
                            Data & Research ({allLinks.data.length})
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {allLinks.data.map((link, i) => (
                              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", textDecoration: "none" }}>
                                <BarChart3 style={{ width: "16px", height: "16px", color: "rgb(34, 197, 94)", flexShrink: 0 }} />
                                <span style={{ fontSize: "14px", color: "var(--foreground)", flex: 1 }}>{link.title}</span>
                                <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })()}

                {/* Social Media Highlights - long mode only */}
                {report.mode === "long" && report.socialMediaHighlights && report.socialMediaHighlights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="glass"
                    style={{
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <AtSign style={{ width: "24px", height: "24px", color: "rgb(29, 161, 242)" }} />
                      Social Media Highlights
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
                            <span style={{ fontSize: "12px", color: "rgb(29, 161, 242)", fontWeight: 600 }}>{post.platform}</span>
                            <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>•</span>
                            <span style={{ fontSize: "14px", color: "var(--foreground)", fontWeight: 600 }}>{post.author}</span>
                            <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)", marginLeft: "auto" }} />
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.6, margin: 0 }}>
                            {post.content}
                          </p>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Podcast References - long mode only */}
                {report.mode === "long" && report.podcastReferences && report.podcastReferences.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass"
                    style={{
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <Headphones style={{ width: "24px", height: "24px", color: "rgb(139, 92, 246)" }} />
                      Podcast Episodes
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
                            <Headphones style={{ width: "16px", height: "16px", color: "rgb(139, 92, 246)" }} />
                            <span style={{ fontSize: "15px", color: "var(--foreground)", fontWeight: 600 }}>{podcast.title}</span>
                            <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>•</span>
                            <span style={{ fontSize: "14px", color: "rgb(139, 92, 246)", fontWeight: 500 }}>{podcast.episode}</span>
                            {podcast.timestamp && (
                              <>
                                <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>•</span>
                                <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>@ {podcast.timestamp}</span>
                              </>
                            )}
                            <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)", marginLeft: "auto" }} />
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6, margin: 0 }}>
                            {podcast.summary}
                          </p>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Sections - long mode only */}
                {report.mode === "long" && report.sections.map((section, index) => (
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
                                  Related Resources
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

                {/* Alternative Perspectives - long mode only */}
                {report.mode === "long" && report.alternativePerspectives.length > 0 && (
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
                      <Eye style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                      Alternative Perspectives
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {report.alternativePerspectives.map((perspective, index) => (
                        <li key={index} style={{ fontSize: "14px", color: "var(--foreground)", marginBottom: "10px", lineHeight: 1.6 }}>
                          {perspective}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Unanswered Questions - long mode only */}
                {report.mode === "long" && report.unansweredQuestions.length > 0 && (
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
                      <HelpCircle style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                      Unanswered Questions
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {report.unansweredQuestions.map((question, index) => (
                        <li key={index} style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "10px", lineHeight: 1.6, fontStyle: "italic" }}>
                          {question}
                        </li>
                      ))}
                    </ul>
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
