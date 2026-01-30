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
      } else {
        throw new Error(data.error || "Failed to search items");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search");
    } finally {
      setIsSearching(false);
    }
  }, [fetchWorkspaceItems]);

  const backToWorkspace = useCallback(() => {
    setCurrentView("workspace");
    setCurrentDatabaseId(null);
    setCurrentDatabaseTitle("");
    setBreadcrumbs([]);
    fetchWorkspaceItems();
  }, [fetchWorkspaceItems]);

  useEffect(() => {
    fetchWorkspaceItems();
  }, [fetchWorkspaceItems]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchItems(searchQuery);
      } else {
        if (currentView === "workspace") {
          fetchWorkspaceItems();
        } else if (currentDatabaseId) {
          fetchDatabasePages(currentDatabaseId, currentDatabaseTitle);
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentView, currentDatabaseId, currentDatabaseTitle, fetchWorkspaceItems, fetchDatabasePages, searchItems]);

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

  return (
    <div style={{ minHeight: "100vh", padding: "24px" }}>
      <Header />
      <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "64px" }}>
        <RemindersBanner />
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "24px" }}>
          {/* Breadcrumb and Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                }}
              >
                <ArrowLeft style={{ width: "18px", height: "18px" }} />
                Back to Dashboard
              </Link>
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
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                padding: "0 16px",
                height: "48px",
              }}
            >
              {isSearching ? (
                <Loader2 style={{ width: "20px", height: "20px", color: "var(--foreground-muted)", animation: "spin 1s linear infinite" }} />
              ) : (
                <Search style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Notion..."
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  padding: "0 12px",
                  height: "100%",
                  outline: "none",
                }}
              />
            </div>
            {currentView !== "workspace" && (
              <button
                onClick={backToWorkspace}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 16px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                }}
              >
                <ArrowLeft style={{ width: "18px", height: "18px" }} />
                Back to Workspace
              </button>
            )}
            <OpenSourceButton />
          </div>

          <motion.div
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
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent)";
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "var(--foreground-muted)",
                  fontSize: "13px",
                  fontWeight: 500
                }}>
                  <span style={{ flex: 1 }}>Name</span>
                  <span style={{ width: "120px", textAlign: "right" }}>Last Edited</span>
                  <span style={{ width: "60px", textAlign: "right" }}>Actions</span>
                </div>
                {/* Items List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "8px 0" }}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "16px 20px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--glass-border)",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, overflow: "hidden" }}>
                        {item.type === "database" ? (
                          <Database style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                        ) : (
                          <FileText style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                        )}
                        <button
                          onClick={() => {
                            if (item.type === "database") {
                              fetchDatabasePages(item.id, item.title);
                            } else {
                              // Placeholder for in-app page content view
                              alert("In-app viewing and editing of pages will be available in a future update.");
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "var(--foreground)",
                            textDecoration: "none",
                            flex: 1,
                            overflow: "hidden",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "15px",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.title && item.title !== "Untitled" ? item.title : item.type === "database" ? "Untitled Database" : "Untitled Page"}
                          </span>
                        </button>
                      </div>
                      <span style={{ fontSize: "13px", color: "var(--foreground-muted)", width: "120px", textAlign: "right" }}>
                        {formatDate(item.lastEditedTime)}
                      </span>
                      {/* External link button removed to prioritize in-app navigation */}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
