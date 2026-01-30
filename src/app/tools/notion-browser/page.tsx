"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Database,
  FileText,
  Loader2,
  Search,
  ExternalLink,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { OpenSourceButton } from "@/components/OpenSourceButton";

interface WorkspaceItem {
  id: string;
  type: "page" | "database";
  title: string;
  icon?: string;
  lastEditedTime: string;
  url: string;
  parent?: {
    type: string;
    page_id?: string;
    database_id?: string;
    workspace?: boolean;
  };
}

export default function NotionBrowser() {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentView, setCurrentView] = useState<"workspace" | "database-pages">("workspace");
  const [currentDatabaseId, setCurrentDatabaseId] = useState<string | null>(null);
  const [currentDatabaseTitle, setCurrentDatabaseTitle] = useState<string>("");
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ title: string; action: () => void }>>([]);

  const fetchWorkspaceItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion-workspace?action=workspace");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workspace items");
      }
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDatabasePages = useCallback(async (databaseId: string, databaseTitle: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notion-workspace?action=database-pages&databaseId=${databaseId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch database pages");
      }
      setItems(data.items || []);
      setCurrentView("database-pages");
      setCurrentDatabaseId(databaseId);
      setCurrentDatabaseTitle(databaseTitle);
      setBreadcrumbs([
        { title: "Workspace", action: () => backToWorkspace() },
        { title: databaseTitle, action: () => {} },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load database pages");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchItems = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchWorkspaceItems();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/notion-workspace?action=search&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, [fetchWorkspaceItems]);

  const backToWorkspace = useCallback(() => {
    setCurrentView("workspace");
    setCurrentDatabaseId(null);
    setCurrentDatabaseTitle("");
    setBreadcrumbs([]);
    setSearchQuery("");
    fetchWorkspaceItems();
  }, [fetchWorkspaceItems]);

  useEffect(() => {
    fetchWorkspaceItems();
  }, [fetchWorkspaceItems]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (currentView === "workspace") {
        if (searchQuery) {
          searchItems(searchQuery);
        } else {
          fetchWorkspaceItems();
        }
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchItems, fetchWorkspaceItems, currentView]);

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

  const renderIcon = (item: WorkspaceItem) => {
    if (item.icon) {
      return <span style={{ fontSize: "20px" }}>{item.icon}</span>;
    }
    if (item.type === "database") {
      return <Database style={{ width: "20px", height: "20px", color: "var(--accent)" }} />;
    }
    return <FileText style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />;
  };

  const handleItemClick = (item: WorkspaceItem) => {
    if (item.type === "database" && currentView === "workspace") {
      fetchDatabasePages(item.id, item.title);
    } else {
      // For pages, open directly in Notion
      window.open(item.url, "_blank");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
          <RemindersBanner />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}
          >
            <Link
              href="/tools/notes"
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
                {currentView === "workspace" ? (
                  <Folder style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                ) : (
                  <FolderOpen style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                )}
                <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>
                  {currentView === "workspace" ? "Notion Workspace" : currentDatabaseTitle}
                </h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={crumb.action}
                      style={{
                        fontSize: "14px",
                        color: index === breadcrumbs.length - 1 ? "var(--foreground-muted)" : "var(--accent)",
                        background: "none",
                        border: "none",
                        cursor: index === breadcrumbs.length - 1 ? "default" : "pointer",
                        textDecoration: index === breadcrumbs.length - 1 ? "none" : "underline",
                      }}
                    >
                      {crumb.title}
                    </button>
                    {index < breadcrumbs.length - 1 && (
                      <ChevronRight style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                    )}
                  </div>
                ))}
                {breadcrumbs.length === 0 && (
                  <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    Browse your entire Notion workspace • Databases and top-level pages
                  </p>
                )}
              </div>
            </div>
            <OpenSourceButton href="https://notion.so" label="Open Notion" />
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass"
            style={{
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <div style={{ position: "relative" }}>
              <Search style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: "var(--foreground-muted)",
              }} />
              <input
                type="text"
                placeholder={currentView === "workspace" ? "Search workspace..." : "Use workspace search above to find across all content"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={currentView !== "workspace"}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 44px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "16px",
                  opacity: currentView !== "workspace" ? 0.5 : 1,
                }}
              />
              {isSearching && (
                <Loader2 style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "18px",
                  height: "18px",
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
            transition={{ delay: 0.2 }}
            className="glass"
            style={{
              borderRadius: "12px",
              minHeight: "600px",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : error ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ color: "#f87171", fontSize: "16px", marginBottom: "16px" }}>{error}</p>
                <button
                  onClick={() => {
                    if (currentView === "workspace") {
                      fetchWorkspaceItems();
                    } else if (currentDatabaseId) {
                      fetchDatabasePages(currentDatabaseId, currentDatabaseTitle);
                    }
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--foreground-muted)" }}>
                {currentView === "workspace" ? (
                  <>
                    <Folder style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
                    <p style={{ fontSize: "18px", fontWeight: 500, marginBottom: "8px" }}>
                      {searchQuery ? "No results found" : "Workspace is empty"}
                    </p>
                    <p style={{ fontSize: "14px" }}>
                      {searchQuery ? "Try a different search term" : "Create some pages or databases in Notion"}
                    </p>
                  </>
                ) : (
                  <>
                    <Database style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
                    <p style={{ fontSize: "18px", fontWeight: 500, marginBottom: "8px" }}>Database is empty</p>
                    <p style={{ fontSize: "14px" }}>No pages found in this database</p>
                  </>
                )}
              </div>
            ) : (
              <div>
                {/* Header Row */}
                <div style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--glass-border)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  alignItems: "center",
                  gap: "16px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)" }}>
                    {currentView === "workspace" ? "NAME" : "PAGE"}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)" }}>
                    LAST EDITED
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)" }}>
                    TYPE
                  </span>
                </div>

                {/* Items List */}
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 20px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--glass-border)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Name column */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      {renderIcon(item)}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: "15px",
                          fontWeight: 500,
                          color: "var(--foreground)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {item.title || "Untitled"}
                        </div>
                      </div>
                      {item.type === "database" && currentView === "workspace" && (
                        <ChevronRight style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", opacity: 0.7 }} />
                      )}
                      {item.type === "page" && (
                        <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)", opacity: 0.5 }} />
                      )}
                    </div>

                    {/* Last edited column */}
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                      {formatDate(item.lastEditedTime)}
                    </div>

                    {/* Type column */}
                    <div style={{ 
                      fontSize: "12px", 
                      fontWeight: 500,
                      color: item.type === "database" ? "var(--accent)" : "var(--foreground-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      {item.type === "database" ? "Database" : "Page"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}