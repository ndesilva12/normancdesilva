"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  List,
  CheckSquare,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Type,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

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

interface RichTextSegment {
  text: string;
  href?: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
}

interface NotionBlock {
  id: string;
  type: string;
  content: string;
  richText?: RichTextSegment[];
  hasChildren: boolean;
  children?: NotionBlock[];
}

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  createdTime: string;
  lastEditedTime: string;
  url: string;
}

// Helper component to render rich text with links and annotations
function RichTextRenderer({ segments, style }: { segments?: RichTextSegment[]; style?: React.CSSProperties }) {
  if (!segments || segments.length === 0) return null;

  return (
    <span style={style}>
      {segments.map((segment, index) => {
        let element: React.ReactNode = segment.text;

        // Apply annotations
        if (segment.annotations?.code) {
          element = (
            <code
              key={`code-${index}`}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "0.9em",
              }}
            >
              {element}
            </code>
          );
        }
        if (segment.annotations?.bold) {
          element = <strong key={`bold-${index}`}>{element}</strong>;
        }
        if (segment.annotations?.italic) {
          element = <em key={`italic-${index}`}>{element}</em>;
        }
        if (segment.annotations?.strikethrough) {
          element = <s key={`strike-${index}`}>{element}</s>;
        }
        if (segment.annotations?.underline) {
          element = <u key={`underline-${index}`}>{element}</u>;
        }

        // Wrap in link if href exists
        if (segment.href) {
          return (
            <a
              key={index}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {element}
            </a>
          );
        }

        return <span key={index}>{element}</span>;
      })}
    </span>
  );
}

// Component to render a single Notion block (theme-aware)
function BlockRenderer({ block, depth = 0 }: { block: NotionBlock; depth?: number }) {
  const renderContent = () => {
    switch (block.type) {
      case "heading_1":
        return (
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px", marginTop: depth > 0 ? "8px" : "24px", color: "var(--foreground)" }}>
            {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
          </h1>
        );
      case "heading_2":
        return (
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "12px", marginTop: depth > 0 ? "8px" : "20px", color: "var(--foreground)" }}>
            {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
          </h2>
        );
      case "heading_3":
        return (
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px", marginTop: depth > 0 ? "6px" : "16px", color: "var(--foreground)" }}>
            {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
          </h3>
        );
      case "paragraph":
        return block.content || block.richText ? (
          <p style={{ marginBottom: "12px", lineHeight: 1.7, color: "var(--foreground)" }}>
            {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
          </p>
        ) : (
          <div style={{ height: "12px" }} />
        );
      case "bulleted_list_item":
        return (
          <div style={{ display: "flex", gap: "8px", marginBottom: "6px", marginLeft: depth * 20 }}>
            <span style={{ color: "var(--foreground-muted)" }}>•</span>
            <span style={{ color: "var(--foreground)", lineHeight: 1.6 }}>
              {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
            </span>
          </div>
        );
      case "numbered_list_item":
        return (
          <div style={{ display: "flex", gap: "8px", marginBottom: "6px", marginLeft: depth * 20 }}>
            <span style={{ color: "var(--foreground-muted)", minWidth: "20px" }}>1.</span>
            <span style={{ color: "var(--foreground)", lineHeight: 1.6 }}>
              {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
            </span>
          </div>
        );
      case "to_do":
        const isChecked = block.content.startsWith("[x]");
        return (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "6px", marginLeft: depth * 20 }}>
            <CheckSquare
              style={{
                width: "18px",
                height: "18px",
                marginTop: "2px",
                color: isChecked ? "#22c55e" : "var(--foreground-muted)",
                fill: isChecked ? "#22c55e" : "none"
              }}
            />
            <span style={{
              color: isChecked ? "var(--foreground-muted)" : "var(--foreground)",
              textDecoration: isChecked ? "line-through" : "none",
              lineHeight: 1.6
            }}>
              {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content.replace(/^\[.\]\s*/, "")}
            </span>
          </div>
        );
      case "toggle":
        return (
          <details style={{ marginBottom: "8px", marginLeft: depth * 20 }}>
            <summary style={{ cursor: "pointer", color: "var(--foreground)", fontWeight: 500 }}>
              {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
            </summary>
            {block.children && (
              <div style={{ paddingLeft: "16px", paddingTop: "8px" }}>
                {block.children.map((child) => (
                  <BlockRenderer key={child.id} block={child} depth={depth + 1} />
                ))}
              </div>
            )}
          </details>
        );
      case "quote":
        return (
          <blockquote style={{
            borderLeft: "3px solid var(--glass-border)",
            paddingLeft: "16px",
            marginBottom: "12px",
            marginLeft: depth * 20,
            fontStyle: "italic",
            color: "var(--foreground-muted)"
          }}>
            {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
          </blockquote>
        );
      case "callout":
        return (
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "12px",
            marginLeft: depth * 20,
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            color: "var(--foreground)",
            border: "1px solid var(--glass-border)"
          }}>
            <span>💡</span>
            <span>{block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}</span>
          </div>
        );
      case "code":
        return (
          <pre style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            color: "#d4d4d4",
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "12px",
            marginLeft: depth * 20,
            overflow: "auto",
            fontSize: "13px",
            fontFamily: "monospace",
            border: "1px solid var(--glass-border)"
          }}>
            <code>{block.content}</code>
          </pre>
        );
      case "divider":
        return <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "20px 0" }} />;
      case "image":
        return block.content ? (
          <div style={{ marginBottom: "16px", marginLeft: depth * 20 }}>
            <img
              src={block.content}
              alt="Notion image"
              style={{ maxWidth: "100%", borderRadius: "8px" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : null;
      case "bookmark":
      case "link_preview":
        return block.content ? (
          <a
            href={block.content}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
              marginBottom: "12px",
              marginLeft: depth * 20,
              color: "var(--accent)",
              textDecoration: "none",
              fontSize: "14px",
              border: "1px solid var(--glass-border)"
            }}
          >
            <LinkIcon style={{ width: "16px", height: "16px" }} />
            {block.content}
          </a>
        ) : null;
      case "child_page":
        return (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "6px",
            marginBottom: "8px",
            marginLeft: depth * 20,
            color: "var(--foreground)",
            border: "1px solid var(--glass-border)"
          }}>
            <FileText style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
            <span>{block.content || "Untitled"}</span>
          </div>
        );
      default:
        return block.content || block.richText ? (
          <p style={{ marginBottom: "8px", color: "var(--foreground)", marginLeft: depth * 20 }}>
            {block.richText ? <RichTextRenderer segments={block.richText} /> : block.content}
          </p>
        ) : null;
    }
  };

  return (
    <div>
      {renderContent()}
      {block.children && block.type !== "toggle" && (
        <div style={{ paddingLeft: "16px" }}>
          {block.children.map((child) => (
            <BlockRenderer key={child.id} block={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
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
  const [isMobile, setIsMobile] = useState(false);

  // Page viewer state
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [pageBlocks, setPageBlocks] = useState<NotionBlock[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const fetchPageContent = useCallback(async (pageId: string, pageTitle: string) => {
    setPageLoading(true);
    setPageError(null);
    setSelectedPage({ id: pageId, title: pageTitle, createdTime: "", lastEditedTime: "", url: "" });
    setPageBlocks([]);

    try {
      const response = await fetch(`/api/notion-workspace?action=page-content&pageId=${pageId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch page content");
      }
      setSelectedPage(data.page);
      setPageBlocks(data.blocks || []);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load page content");
    } finally {
      setPageLoading(false);
    }
  }, []);

  const closePageViewer = useCallback(() => {
    setSelectedPage(null);
    setPageBlocks([]);
    setPageError(null);
  }, []);

  const searchItems = useCallback(async (query: string) => {
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
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // If search is cleared, reload current view
    if (!value.trim()) {
      if (currentView === "workspace") {
        fetchWorkspaceItems();
      } else if (currentDatabaseId) {
        fetchDatabasePages(currentDatabaseId, currentDatabaseTitle);
      }
    }
  }, [currentView, currentDatabaseId, currentDatabaseTitle, fetchWorkspaceItems, fetchDatabasePages]);

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

  // Debounced search - only triggers on search query changes
  useEffect(() => {
    if (!searchQuery) return;

    const delayDebounceFn = setTimeout(() => {
      searchItems(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchItems]);

  // Keyboard handler for Escape to close page viewer
  useEffect(() => {
    if (!selectedPage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePageViewer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPage, closePageViewer]);

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
    <div style={{ minHeight: "100vh", padding: isMobile ? "12px" : "24px" }}>
      <Header />
      <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: isMobile ? "56px" : "64px" }}>
        <RemindersBanner />
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px", paddingTop: isMobile ? "16px" : "24px" }}>
          {/* Breadcrumb and Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: isMobile ? "10px 14px" : "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  fontSize: isMobile ? "14px" : "inherit",
                }}
              >
                <ArrowLeft style={{ width: "18px", height: "18px" }} />
                {isMobile ? "Back" : "Back to Dashboard"}
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                {currentView === "workspace" ? (
                  <Folder style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "var(--accent)", flexShrink: 0 }} />
                ) : (
                  <FolderOpen style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "var(--accent)", flexShrink: 0 }} />
                )}
                <h1 style={{
                  fontSize: isMobile ? "18px" : "24px",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {currentView === "workspace" ? "Notes" : currentDatabaseTitle}
                </h1>
              </div>
            </div>
            {breadcrumbs.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={crumb.action}
                      style={{
                        fontSize: isMobile ? "13px" : "14px",
                        color: index === breadcrumbs.length - 1 ? "var(--foreground-muted)" : "var(--accent)",
                        background: "none",
                        border: "none",
                        padding: isMobile ? "4px 0" : "0",
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
            )}

          {/* Search Bar */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "stretch", gap: isMobile ? "10px" : "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                padding: isMobile ? "0 12px" : "0 16px",
                height: isMobile ? "44px" : "48px",
              }}
            >
              {isSearching ? (
                <Loader2 style={{ width: "20px", height: "20px", color: "var(--foreground-muted)", animation: "spin 1s linear infinite", flexShrink: 0 }} />
              ) : (
                <Search style={{ width: "20px", height: "20px", color: "var(--foreground-muted)", flexShrink: 0 }} />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search notes..."
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: isMobile ? "16px" : "15px",
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
                  justifyContent: "center",
                  gap: "8px",
                  padding: isMobile ? "12px 16px" : "0 16px",
                  height: isMobile ? "44px" : "48px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                  fontSize: isMobile ? "14px" : "15px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <ArrowLeft style={{ width: "18px", height: "18px" }} />
                Back to Workspace
              </button>
            )}
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
                      {searchQuery ? "No results found" : "No notes yet"}
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
                {/* Header Row - hide on mobile */}
                {!isMobile && (
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
                    <span style={{ width: "80px", textAlign: "right" }}>Open</span>
                  </div>
                )}
                {/* Items List */}
                <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "8px" : "4px", padding: isMobile ? "12px" : "8px" }}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        if (item.type === "database") {
                          fetchDatabasePages(item.id, item.title);
                        } else {
                          fetchPageContent(item.id, item.title);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: isMobile ? "flex-start" : "center",
                        flexDirection: isMobile ? "column" : "row",
                        padding: isMobile ? "14px" : "14px 16px",
                        borderRadius: isMobile ? "12px" : "8px",
                        backgroundColor: isMobile ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--glass-border)",
                        gap: isMobile ? "10px" : "0",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, overflow: "hidden", width: "100%" }}>
                        {item.icon ? (
                          <span style={{ fontSize: isMobile ? "22px" : "18px", flexShrink: 0 }}>{item.icon}</span>
                        ) : item.type === "database" ? (
                          <Database style={{ width: isMobile ? "22px" : "18px", height: isMobile ? "22px" : "18px", color: "var(--accent)", flexShrink: 0 }} />
                        ) : (
                          <FileText style={{ width: isMobile ? "22px" : "18px", height: isMobile ? "22px" : "18px", color: "var(--accent)", flexShrink: 0 }} />
                        )}
                        <span
                          style={{
                            fontSize: isMobile ? "16px" : "15px",
                            fontWeight: 500,
                            whiteSpace: isMobile ? "normal" : "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: "var(--foreground)",
                            lineHeight: isMobile ? "1.4" : "inherit",
                          }}
                        >
                          {item.title || (item.type === "database" ? "Untitled Database" : "Untitled")}
                        </span>
                      </div>
                      {isMobile ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingLeft: "34px" }}>
                          <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                            {formatDate(item.lastEditedTime)}
                          </span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(255, 255, 255, 0.08)",
                              color: "var(--accent)",
                              textDecoration: "none",
                              fontSize: "12px",
                            }}
                          >
                            <ExternalLink style={{ width: "14px", height: "14px" }} />
                            Notion
                          </a>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: "13px", color: "var(--foreground-muted)", width: "120px", textAlign: "right" }}>
                            {formatDate(item.lastEditedTime)}
                          </span>
                          <div style={{ width: "80px", display: "flex", justifyContent: "flex-end" }}>
                            <a
                              href={item.url}
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
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                color: "var(--foreground-muted)",
                                transition: "all 0.15s",
                              }}
                              title="Open in Notion"
                            >
                              <ExternalLink style={{ width: "14px", height: "14px" }} />
                            </a>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Page Content Viewer Modal */}
      <AnimatePresence>
        {selectedPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isMobile ? "var(--background)" : "rgba(0, 0, 0, 0.7)",
              backdropFilter: isMobile ? "none" : "blur(5px)",
              zIndex: 999,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: isMobile ? "0" : "5vh",
            }}
            onClick={isMobile ? undefined : closePageViewer}
          >
            <motion.div
              initial={{ scale: isMobile ? 1 : 0.95, y: isMobile ? 20 : 0 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: isMobile ? 1 : 0.95, y: isMobile ? 20 : 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: isMobile ? "100%" : "94%",
                maxWidth: isMobile ? "none" : "900px",
                height: isMobile ? "100%" : "85vh",
                backgroundColor: isMobile ? "var(--background)" : "rgba(26, 26, 26, 0.95)",
                backdropFilter: isMobile ? "none" : "blur(20px)",
                border: isMobile ? "none" : "1px solid var(--glass-border)",
                borderRadius: isMobile ? "0" : "16px",
                boxShadow: isMobile ? "none" : "0 8px 32px rgba(0, 0, 0, 0.3)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: isMobile ? "12px 16px" : "16px 20px",
                  borderBottom: "1px solid var(--glass-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                  gap: "12px",
                }}
              >
                {/* Close button on left for mobile */}
                {isMobile && (
                  <button
                    onClick={closePageViewer}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--foreground)",
                      cursor: "pointer",
                      fontSize: "14px",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    <ArrowLeft style={{ width: "18px", height: "18px" }} />
                    Back
                  </button>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", flex: 1, overflow: "hidden", minWidth: 0 }}>
                  {selectedPage.icon ? (
                    <span style={{ fontSize: isMobile ? "18px" : "20px", flexShrink: 0 }}>{selectedPage.icon}</span>
                  ) : (
                    <FileText style={{ width: isMobile ? "18px" : "20px", height: isMobile ? "18px" : "20px", color: "var(--accent)", flexShrink: 0 }} />
                  )}
                  <h2 style={{
                    fontSize: isMobile ? "15px" : "18px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {selectedPage.title || "Untitled"}
                  </h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px", flexShrink: 0 }}>
                  {selectedPage.url && (
                    <a
                      href={selectedPage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: isMobile ? "10px 12px" : "6px 10px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "var(--accent)",
                        fontSize: isMobile ? "13px" : "13px",
                        textDecoration: "none",
                        transition: "all 0.15s",
                      }}
                    >
                      <ExternalLink style={{ width: "14px", height: "14px" }} />
                      {!isMobile && <span>Open in Notion</span>}
                    </a>
                  )}
                  {!isMobile && (
                    <button
                      onClick={closePageViewer}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255, 100, 100, 0.1)",
                        border: "1px solid rgba(255, 100, 100, 0.2)",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <X style={{ width: "16px", height: "16px" }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Content */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {pageLoading ? (
                  <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                  </div>
                ) : pageError ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "16px", padding: "20px" }}>
                    <p style={{ color: "#f87171", fontSize: "16px", textAlign: "center" }}>{pageError}</p>
                    <button
                      onClick={() => fetchPageContent(selectedPage.id, selectedPage.title)}
                      style={{
                        padding: isMobile ? "12px 20px" : "8px 16px",
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
                ) : pageBlocks.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "16px" }}>This page is empty</p>
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: isMobile ? "16px" : "24px",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isMobile ? "transparent" : "rgba(255, 255, 255, 0.03)",
                        borderRadius: isMobile ? "0" : "8px",
                        padding: isMobile ? "0" : "32px",
                        minHeight: "100%",
                        border: isMobile ? "none" : "1px solid var(--glass-border)",
                      }}
                    >
                      {pageBlocks.map((block) => (
                        <BlockRenderer key={block.id} block={block} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
