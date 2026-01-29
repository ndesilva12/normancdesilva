"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Database,
  FileText,
  Folder,
  Loader2,
  RefreshCw,
  Search,
  Plus,
  ExternalLink,
  Calendar,
  Users,
  Grid3X3,
  List,
  ChevronRight,
  Home,
  BookOpen,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface NotionWorkspaceItem {
  id: string;
  type: 'page' | 'database';
  title: string;
  icon?: string;
  lastEditedTime: string;
  url: string;
  parent?: {
    type: string;
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
  };
}

interface NotionDatabase {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  createdTime: string;
  lastEditedTime: string;
  url: string;
  description?: string;
  properties: Record<string, unknown>;
}

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  createdTime: string;
  lastEditedTime: string;
  url: string;
  properties?: Record<string, unknown>;
}

interface ViewMode {
  view: 'overview' | 'databases' | 'pages' | 'database-pages' | 'search';
  databaseId?: string;
  databaseTitle?: string;
}

export default function NotionBrowserPage() {
  const [currentView, setCurrentView] = useState<ViewMode>({ view: 'overview' });
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [rootPages, setRootPages] = useState<NotionPage[]>([]);
  const [databasePages, setDatabasePages] = useState<NotionPage[]>([]);
  const [searchResults, setSearchResults] = useState<NotionWorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Load workspace overview (databases + root pages)
  const loadWorkspaceOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion-workspace");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workspace data");
      }
      setDatabases(data.databases || []);
      setRootPages(data.rootPages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all databases
  const loadDatabases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion-workspace?action=databases");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch databases");
      }
      setDatabases(data.databases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load databases");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load root pages
  const loadRootPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion-workspace?action=root-pages");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pages");
      }
      setRootPages(data.pages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load pages from a specific database
  const loadDatabasePages = useCallback(async (databaseId: string, title: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notion-workspace?action=database-pages&id=${databaseId}&limit=100`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch database pages");
      }
      setDatabasePages(data.pages || []);
      setCurrentView({ view: 'database-pages', databaseId, databaseTitle: title });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load database pages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Search content
  const searchContent = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/notion-workspace?action=search&search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.results || []);
        setCurrentView({ view: 'search' });
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (currentView.view !== 'search' && searchQuery) {
      const debounce = setTimeout(() => {
        searchContent(searchQuery);
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, searchContent, currentView.view]);

  // Load initial data
  useEffect(() => {
    if (currentView.view === 'overview') {
      loadWorkspaceOverview();
    } else if (currentView.view === 'databases') {
      loadDatabases();
    } else if (currentView.view === 'pages') {
      loadRootPages();
    }
  }, [currentView.view, loadWorkspaceOverview, loadDatabases, loadRootPages]);

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

  const renderBreadcrumb = () => {
    const breadcrumbs = [];

    if (currentView.view === 'overview') {
      breadcrumbs.push({ label: "Workspace", action: () => setCurrentView({ view: 'overview' }) });
    } else if (currentView.view === 'databases') {
      breadcrumbs.push(
        { label: "Workspace", action: () => setCurrentView({ view: 'overview' }) },
        { label: "All Databases", action: () => setCurrentView({ view: 'databases' }) }
      );
    } else if (currentView.view === 'pages') {
      breadcrumbs.push(
        { label: "Workspace", action: () => setCurrentView({ view: 'overview' }) },
        { label: "Root Pages", action: () => setCurrentView({ view: 'pages' }) }
      );
    } else if (currentView.view === 'database-pages') {
      breadcrumbs.push(
        { label: "Workspace", action: () => setCurrentView({ view: 'overview' }) },
        { label: "Databases", action: () => setCurrentView({ view: 'databases' }) },
        { label: currentView.databaseTitle || "Database", action: () => {} }
      );
    } else if (currentView.view === 'search') {
      breadcrumbs.push(
        { label: "Workspace", action: () => setCurrentView({ view: 'overview' }) },
        { label: `Search: "${searchQuery}"`, action: () => {} }
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        {breadcrumbs.map((crumb, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {index > 0 && <ChevronRight style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />}
            <button
              onClick={crumb.action}
              style={{
                background: "none",
                border: "none",
                color: index === breadcrumbs.length - 1 ? "var(--foreground)" : "var(--accent)",
                fontSize: "14px",
                cursor: index === breadcrumbs.length - 1 ? "default" : "pointer",
                textDecoration: index === breadcrumbs.length - 1 ? "none" : "underline",
              }}
            >
              {crumb.label}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderWorkspaceOverview = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div className="glass" style={{ padding: "20px", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Database style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
            <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>Databases</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>
            {databases.length}
          </div>
        </div>
        <div className="glass" style={{ padding: "20px", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <FileText style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
            <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>Root Pages</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>
            {rootPages.length}
          </div>
        </div>
      </div>

      {/* Recent Databases */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>Recent Databases</h3>
          <button
            onClick={() => setCurrentView({ view: 'databases' })}
            style={{
              fontSize: "14px",
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            View all
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {databases.slice(0, 6).map((database) => (
            <div
              key={database.id}
              className="glass"
              style={{
                padding: "16px",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onClick={() => loadDatabasePages(database.id, database.title)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <span style={{ fontSize: "18px" }}>{database.icon || "🗃️"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {database.title || "Untitled Database"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                    {formatDate(database.lastEditedTime)}
                  </div>
                </div>
                <ChevronRight style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
              </div>
              {database.description && (
                <p style={{
                  fontSize: "12px",
                  color: "var(--foreground-muted)",
                  lineHeight: 1.4,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}>
                  {database.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Pages */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>Recent Pages</h3>
          <button
            onClick={() => setCurrentView({ view: 'pages' })}
            style={{
              fontSize: "14px",
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            View all
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {rootPages.slice(0, 6).map((page) => (
            <Link
              key={page.id}
              href={`/tools/notes?id=${page.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="glass"
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "18px" }}>{page.icon || "📄"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--foreground)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {page.title || "Untitled Page"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                      {formatDate(page.lastEditedTime)}
                    </div>
                  </div>
                  <ChevronRight style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDatabasesList = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
      {databases.map((database) => (
        <div
          key={database.id}
          className="glass"
          style={{
            padding: "20px",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onClick={() => loadDatabasePages(database.id, database.title)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "8px", 
              backgroundColor: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              {database.icon || "🗃️"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {database.title || "Untitled Database"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                Updated {formatDate(database.lastEditedTime)}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <a
                href={database.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "var(--foreground-muted)",
                  textDecoration: "none",
                }}
              >
                <ExternalLink style={{ width: "14px", height: "14px" }} />
              </a>
            </div>
          </div>
          {database.description && (
            <p style={{
              fontSize: "13px",
              color: "var(--foreground-muted)",
              lineHeight: 1.5,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}>
              {database.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  const renderPagesList = (pages: NotionPage[], title: string) => (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
        {title} ({pages.length})
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {pages.map((page) => (
          <Link
            key={page.id}
            href={`/tools/notes?id=${page.id}`}
            style={{ textDecoration: "none" }}
          >
            <div
              className="glass"
              style={{
                padding: "16px",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "18px" }}>{page.icon || "📄"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {page.title || "Untitled Page"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                    {formatDate(page.lastEditedTime)}
                  </div>
                </div>
                <ChevronRight style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  const renderSearchResults = () => (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
        Search Results ({searchResults.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {searchResults.map((item) => (
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {item.type === 'database' ? (
                  <Database style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
                ) : (
                  <FileText style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
                )}
                <span style={{ fontSize: "16px" }}>{item.icon || (item.type === 'database' ? "🗃️" : "📄")}</span>
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
                  <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>Notion Browser</h1>
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

          {/* Breadcrumb */}
          {renderBreadcrumb()}

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
                  onClick={() => {
                    if (currentView.view === 'overview') {
                      loadWorkspaceOverview();
                    } else if (currentView.view === 'databases') {
                      loadDatabases();
                    } else if (currentView.view === 'pages') {
                      loadRootPages();
                    }
                  }}
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
                {currentView.view === 'overview' && renderWorkspaceOverview()}
                {currentView.view === 'databases' && renderDatabasesList()}
                {currentView.view === 'pages' && renderPagesList(rootPages, "Root Pages")}
                {currentView.view === 'database-pages' && renderPagesList(databasePages, `Pages in ${currentView.databaseTitle}`)}
                {currentView.view === 'search' && renderSearchResults()}
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}