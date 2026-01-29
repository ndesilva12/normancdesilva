"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Database,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface WorkspaceItem {
  id: string;
  type: 'page' | 'database';
  title: string;
  icon?: string;
  lastEditedTime: string;
  url: string;
}

export default function WorkspacePage() {
  const [pages, setPages] = useState<WorkspaceItem[]>([]);
  const [databases, setDatabases] = useState<WorkspaceItem[]>([]);
  const [searchResults, setSearchResults] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'search'>('overview');

  // Load workspace overview
  const loadWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace?action=overview");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workspace data");
      }
      setPages(data.pages || []);
      setDatabases(data.databases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  // Search content
  const searchContent = async (query: string) => {
    if (!query.trim()) {
      setCurrentView('overview');
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/workspace?action=search&search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.results || []);
        setCurrentView('search');
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const debounce = setTimeout(() => {
      searchContent(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Load initial data
  useEffect(() => {
    loadWorkspace();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const renderItems = (items: WorkspaceItem[], title: string) => (
    <div style={{ marginBottom: "32px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
        {title} ({items.length})
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.type === 'page' ? `/tools/notes?id=${item.id}` : item.url}
            target={item.type === 'database' ? "_blank" : undefined}
            style={{ textDecoration: "none" }}
          >
            <div
              className="glass"
              style={{
                padding: "16px",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
            >
              {item.type === 'database' ? (
                <Database style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
              ) : (
                <FileText style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
              )}
              <span style={{ fontSize: "18px" }}>{item.icon || (item.type === 'database' ? "🗃️" : "📄")}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--foreground)",
                  marginBottom: "2px",
                }}>
                  {item.title || `Untitled ${item.type === 'database' ? 'Database' : 'Page'}`}
                </div>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                  {item.type === 'database' ? 'Database' : 'Page'} • {formatDate(item.lastEditedTime)}
                </div>
              </div>
              <ChevronRight style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
          <RemindersBanner />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground-muted)",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft style={{ width: "20px", height: "20px" }} />
              </Link>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <BookOpen style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                  <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>Notion Workspace</h1>
                </div>
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                  Browse your complete Notion workspace
                </p>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", maxWidth: "500px" }}>
              <Search style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "var(--foreground-muted)",
              }} />
              <input
                type="text"
                placeholder="Search pages and databases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 40px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "10px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              />
              {isSearching && (
                <Loader2 style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  height: "16px",
                  color: "var(--accent)",
                  animation: "spin 1s linear infinite",
                }} />
              )}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "60px" }}>
                <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "16px" }}>{error}</p>
                <button
                  onClick={loadWorkspace}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                    margin: "0 auto",
                  }}
                >
                  <RefreshCw style={{ width: "16px", height: "16px" }} />
                  Retry
                </button>
              </div>
            ) : (
              <>
                {currentView === 'overview' ? (
                  <>
                    {renderItems(databases, "Databases")}
                    {renderItems(pages, "Pages")}
                  </>
                ) : (
                  <>
                    {renderItems(searchResults, `Search Results for "${searchQuery}"`)}
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentView('overview');
                      }}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "var(--foreground-muted)",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        marginTop: "16px",
                      }}
                    >
                      ← Back to Overview
                    </button>
                  </>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}