"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Database,
  FileText,
  Loader2,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
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
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface TreeNode {
  id: string;
  type: "page" | "database";
  title: string;
  icon?: string;
  lastEditedTime: string;
  url: string;
  hasChildren?: boolean;
  children?: TreeNode[];
  expanded?: boolean;
  loading?: boolean;
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
function BlockRenderer({ block, depth = 0, onDatabaseClick, onPageClick }: { block: NotionBlock; depth?: number; onDatabaseClick?: (id: string, title: string) => void; onPageClick?: (id: string, title: string) => void }) {
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
                  <BlockRenderer key={child.id} block={child} depth={depth + 1} onDatabaseClick={onDatabaseClick} onPageClick={onPageClick} />
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
          <div
            onClick={() => onPageClick?.(block.id, block.content || "Untitled")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
              marginBottom: "8px",
              marginLeft: depth * 20,
              color: "var(--foreground)",
              border: "1px solid var(--glass-border)",
              cursor: onPageClick ? "pointer" : "default",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (onPageClick) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            }}
          >
            <FileText style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
            <span style={{ flex: 1 }}>{block.content || "Untitled"}</span>
            {onPageClick && <ChevronRight style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />}
          </div>
        );
      case "child_database":
        return (
          <div
            onClick={() => onDatabaseClick?.(block.id, block.content || "Untitled Database")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
              marginBottom: "8px",
              marginLeft: depth * 20,
              color: "var(--foreground)",
              border: "1px solid var(--glass-border)",
              cursor: onDatabaseClick ? "pointer" : "default",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (onDatabaseClick) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            }}
          >
            <Database style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
            <span style={{ flex: 1 }}>{block.content || "Untitled Database"}</span>
            {onDatabaseClick && <ChevronRight style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />}
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
      {block.children && block.type !== "toggle" && block.type !== "child_page" && block.type !== "child_database" && (
        <div style={{ paddingLeft: "16px" }}>
          {block.children.map((child) => (
            <BlockRenderer key={child.id} block={child} depth={depth + 1} onDatabaseClick={onDatabaseClick} onPageClick={onPageClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tree item component for sidebar navigation
function SidebarTreeItem({
  node,
  depth = 0,
  onToggle,
  onSelect,
  selectedId,
  isMobile,
}: {
  node: TreeNode;
  depth?: number;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
  selectedId?: string;
  isMobile?: boolean;
}) {
  const hasChildren = node.hasChildren || (node.children && node.children.length > 0);
  const isExpanded = node.expanded;
  const isDatabase = node.type === "database";
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        onClick={() => onSelect(node)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: isMobile ? "10px 8px" : "6px 8px",
          paddingLeft: `${depth * 16 + 8}px`,
          borderRadius: "6px",
          cursor: "pointer",
          transition: "background 0.15s",
          backgroundColor: isSelected ? "rgba(255, 255, 255, 0.1)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onToggle(node.id);
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            background: "none",
            border: "none",
            cursor: hasChildren ? "pointer" : "default",
            color: "var(--foreground-muted)",
            opacity: hasChildren ? 1 : 0.3,
            padding: 0,
            flexShrink: 0,
          }}
        >
          {node.loading ? (
            <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
          ) : hasChildren ? (
            isExpanded ? (
              <ChevronDown style={{ width: "16px", height: "16px" }} />
            ) : (
              <ChevronRight style={{ width: "16px", height: "16px" }} />
            )
          ) : (
            <span style={{ width: "16px" }} />
          )}
        </button>

        {/* Icon */}
        <span style={{ fontSize: isMobile ? "18px" : "16px", flexShrink: 0, width: "20px", textAlign: "center" }}>
          {node.icon ? (
            node.icon
          ) : isDatabase ? (
            <Database style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
          ) : hasChildren ? (
            isExpanded ? (
              <FolderOpen style={{ width: "16px", height: "16px", color: "#fbbf24" }} />
            ) : (
              <Folder style={{ width: "16px", height: "16px", color: "#fbbf24" }} />
            )
          ) : (
            <FileText style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
          )}
        </span>

        {/* Title */}
        <span
          style={{
            flex: 1,
            fontSize: isMobile ? "15px" : "14px",
            color: isSelected ? "var(--foreground)" : "var(--foreground)",
            fontWeight: isSelected ? 500 : 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {node.title || (isDatabase ? "Untitled Database" : "Untitled")}
        </span>
      </div>

      {/* Children */}
      {isExpanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <SidebarTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotionBrowserContent() {
  const searchParams = useSearchParams();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TreeNode[]>([]);

  // Selected item state
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  // Navigation path for breadcrumbs
  const [navigationPath, setNavigationPath] = useState<TreeNode[]>([]);

  // Page viewer state
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [pageBlocks, setPageBlocks] = useState<NotionBlock[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Database items state (when viewing a database)
  const [databaseItems, setDatabaseItems] = useState<TreeNode[]>([]);
  const [databaseLoading, setDatabaseLoading] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch the tree structure
  const fetchTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);
    try {
      const response = await fetch("/api/notion-workspace?action=tree");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notes");
      }
      const items = (data.items || []).map((item: TreeNode) => ({
        ...item,
        expanded: false,
        children: [],
      }));
      setTree(items);
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Handle URL params for deep linking
  useEffect(() => {
    const pageId = searchParams.get("pageId");
    const databaseId = searchParams.get("databaseId");
    const title = searchParams.get("title");

    if (pageId) {
      fetchPageContent(pageId, title || "Page");
    } else if (databaseId) {
      const node: TreeNode = {
        id: databaseId,
        type: "database",
        title: title || "Database",
        lastEditedTime: "",
        url: "",
        hasChildren: true,
      };
      handleSelectNode(node);
    }
  }, [searchParams]);

  // Fetch children for a node
  const fetchChildren = useCallback(async (nodeId: string, isDatabase: boolean): Promise<TreeNode[]> => {
    try {
      const action = isDatabase ? "database-pages" : "children";
      const param = isDatabase ? "databaseId" : "pageId";
      const response = await fetch(`/api/notion-workspace?action=${action}&${param}=${nodeId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch children");
      }
      return (data.items || []).map((item: TreeNode) => ({
        ...item,
        expanded: false,
        children: [],
      }));
    } catch (err) {
      console.error("Error fetching children:", err);
      return [];
    }
  }, []);

  // Update a node in the tree
  const updateNodeInTree = (nodes: TreeNode[], nodeId: string, updates: Partial<TreeNode>): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateNodeInTree(node.children, nodeId, updates) };
      }
      return node;
    });
  };

  // Toggle expand/collapse for a node
  const handleToggle = useCallback(async (nodeId: string) => {
    const findAndToggle = async (nodes: TreeNode[]): Promise<TreeNode[]> => {
      return Promise.all(nodes.map(async (node) => {
        if (node.id === nodeId) {
          if (node.expanded) {
            return { ...node, expanded: false };
          }
          if (!node.children || node.children.length === 0) {
            setTree(prev => updateNodeInTree(prev, nodeId, { loading: true }));
            const children = await fetchChildren(nodeId, node.type === "database");
            return { ...node, expanded: true, children, loading: false };
          }
          return { ...node, expanded: true };
        }
        if (node.children && node.children.length > 0) {
          const newChildren = await findAndToggle(node.children);
          return { ...node, children: newChildren };
        }
        return node;
      }));
    };

    const newTree = await findAndToggle(tree);
    setTree(newTree);
  }, [tree, fetchChildren]);

  // Fetch page content
  const fetchPageContent = useCallback(async (pageId: string, pageTitle: string) => {
    setPageLoading(true);
    setPageError(null);
    setSelectedPage({ id: pageId, title: pageTitle, createdTime: "", lastEditedTime: "", url: "" });
    setPageBlocks([]);
    setDatabaseItems([]);

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

  // Fetch database contents
  const fetchDatabaseContents = useCallback(async (databaseId: string, databaseTitle: string) => {
    setDatabaseLoading(true);
    setPageError(null);
    setSelectedPage({ id: databaseId, title: databaseTitle, createdTime: "", lastEditedTime: "", url: "" });
    setPageBlocks([]);

    try {
      const response = await fetch(`/api/notion-workspace?action=database-pages&databaseId=${databaseId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch database contents");
      }
      setDatabaseItems((data.items || []).map((item: TreeNode) => ({
        ...item,
        expanded: false,
        children: [],
      })));
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load database contents");
    } finally {
      setDatabaseLoading(false);
    }
  }, []);

  // Helper to check if a node is a direct child of another node
  const isChildOfNode = useCallback((childId: string, parentNode: TreeNode | null): boolean => {
    if (!parentNode || !parentNode.children) return false;
    return parentNode.children.some(child => child.id === childId);
  }, []);

  // Helper to find a node in the navigation path
  const findNodeInPath = useCallback((nodeId: string, path: TreeNode[]): number => {
    return path.findIndex(n => n.id === nodeId);
  }, []);

  // Handle selecting a node from the sidebar
  const handleSelectNode = useCallback((node: TreeNode) => {
    // Check if this node is already in the navigation path
    const existingIndex = findNodeInPath(node.id, navigationPath);
    if (existingIndex >= 0) {
      // Node is already in path, truncate to that point
      setNavigationPath(navigationPath.slice(0, existingIndex + 1));
    } else if (selectedNode && isChildOfNode(node.id, selectedNode)) {
      // Node is a child of the currently selected node, add to path
      setNavigationPath([...navigationPath, node]);
    } else {
      // New top-level selection, start fresh navigation path
      setNavigationPath([node]);
    }

    setSelectedNode(node);

    if (isMobile) {
      setSidebarCollapsed(true);
    }

    if (node.type === "database") {
      fetchDatabaseContents(node.id, node.title);
    } else {
      fetchPageContent(node.id, node.title);
    }
  }, [isMobile, fetchDatabaseContents, fetchPageContent, navigationPath, selectedNode, isChildOfNode, findNodeInPath]);

  // Handle navigating into a child page/database (adds to navigation path)
  const handleNavigateInto = useCallback((node: TreeNode, currentPath: TreeNode[]) => {
    setSelectedNode(node);
    // Explicitly set the new path by appending to the current path
    const newPath = [...currentPath, node];
    setNavigationPath(newPath);

    if (node.type === "database") {
      fetchDatabaseContents(node.id, node.title);
    } else {
      fetchPageContent(node.id, node.title);
    }
  }, [fetchDatabaseContents, fetchPageContent]);

  // Handle breadcrumb navigation (go back to a specific point in the path)
  const handleBreadcrumbClick = useCallback((index: number) => {
    const node = navigationPath[index];
    if (!node) return;

    setSelectedNode(node);
    setNavigationPath(prev => prev.slice(0, index + 1));

    if (node.type === "database") {
      fetchDatabaseContents(node.id, node.title);
    } else {
      fetchPageContent(node.id, node.title);
    }
  }, [navigationPath, fetchDatabaseContents, fetchPageContent]);

  // Search functionality
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`/api/notion-workspace?action=search&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults((data.items || []).map((item: TreeNode) => ({
          ...item,
          expanded: false,
          children: [],
        })));
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Keyboard handler for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedPage) {
        setSelectedPage(null);
        setSelectedNode(null);
        setPageBlocks([]);
        setDatabaseItems([]);
        setNavigationPath([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPage]);

  const displayTree = searchQuery ? searchResults : tree;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: isMobile ? "56px" : "64px" }}>
        {/* Back Link */}
        <div style={{
          padding: isMobile ? "12px 16px 0" : "16px 24px 0",
          backgroundColor: "var(--background)",
        }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: isMobile ? "10px 14px" : "8px 12px",
              borderRadius: "6px",
              color: "var(--foreground-muted)",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            {!isMobile && <span>Back to Dashboard</span>}
          </Link>
        </div>

        {/* Top bar with title and breadcrumbs */}
        <div style={{
          padding: isMobile ? "12px 16px" : "16px 24px",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          backgroundColor: "var(--background)",
        }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
              <Folder style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "var(--accent)", flexShrink: 0 }} />
              <h1 style={{
                fontSize: isMobile ? "18px" : "22px",
                fontWeight: 600,
                color: "var(--foreground)",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                Notes
              </h1>
            </div>

            <button
              onClick={fetchTree}
              disabled={treeLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? "40px" : "36px",
                height: isMobile ? "40px" : "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                color: "var(--foreground-muted)",
                cursor: treeLoading ? "not-allowed" : "pointer",
                flexShrink: 0,
              }}
            >
              <RefreshCw style={{ width: "16px", height: "16px", animation: treeLoading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>

          {/* Breadcrumb navigation */}
          {navigationPath.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
              fontSize: "14px",
            }}>
              {navigationPath.map((node, index) => (
                <div key={node.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {index > 0 && (
                    <ChevronRight style={{ width: "14px", height: "14px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                  )}
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: index === navigationPath.length - 1 ? "rgba(255, 255, 255, 0.1)" : "transparent",
                      color: index === navigationPath.length - 1 ? "var(--foreground)" : "var(--foreground-muted)",
                      cursor: index === navigationPath.length - 1 ? "default" : "pointer",
                      fontSize: "13px",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (index !== navigationPath.length - 1) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.color = "var(--foreground)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (index !== navigationPath.length - 1) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--foreground-muted)";
                      }
                    }}
                  >
                    {node.icon && <span style={{ fontSize: "14px" }}>{node.icon}</span>}
                    {node.type === "database" ? (
                      <Database style={{ width: "12px", height: "12px", color: "var(--accent)" }} />
                    ) : !node.icon ? (
                      <FileText style={{ width: "12px", height: "12px" }} />
                    ) : null}
                    <span style={{
                      maxWidth: isMobile ? "100px" : "150px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {node.title || (node.type === "database" ? "Untitled Database" : "Untitled")}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <RemindersBanner />

        {/* Main content area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Sidebar */}
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: isMobile ? "100%" : 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  borderRight: isMobile ? "none" : "1px solid var(--glass-border)",
                  backgroundColor: isMobile ? "var(--background)" : "rgba(255, 255, 255, 0.02)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  position: isMobile ? "absolute" : "relative",
                  top: isMobile ? "0" : "auto",
                  left: 0,
                  bottom: 0,
                  zIndex: isMobile ? 100 : 1,
                  height: isMobile ? "100%" : "auto",
                }}
              >
                {/* Sidebar header */}
                <div style={{
                  padding: "12px",
                  borderBottom: "1px solid var(--glass-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Search input */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      flex: 1,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      padding: "0 10px",
                      height: isMobile ? "44px" : "36px",
                    }}>
                      {isSearching ? (
                        <Loader2 style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                      ) : (
                        <Search style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                      )}
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        style={{
                          flex: 1,
                          border: "none",
                          background: "transparent",
                          color: "var(--foreground)",
                          fontSize: isMobile ? "16px" : "14px",
                          padding: "0 8px",
                          height: "100%",
                          outline: "none",
                        }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--foreground-muted)",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                          }}
                        >
                          <X style={{ width: "14px", height: "14px" }} />
                        </button>
                      )}
                    </div>
                    {/* Close sidebar button on mobile */}
                    {isMobile && (
                      <button
                        onClick={() => setSidebarCollapsed(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "44px",
                          height: "44px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid var(--glass-border)",
                          color: "var(--foreground-muted)",
                          cursor: "pointer",
                        }}
                      >
                        <X style={{ width: "20px", height: "20px" }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tree content */}
                <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
                  {treeLoading && displayTree.length === 0 ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                      <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                    </div>
                  ) : treeError ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "12px" }}>{treeError}</p>
                      <button
                        onClick={fetchTree}
                        style={{
                          padding: "8px 16px",
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
                  ) : displayTree.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--foreground-muted)" }}>
                      {searchQuery ? "No results found" : "No notes found"}
                    </div>
                  ) : (
                    <div>
                      {displayTree.map((node) => (
                        <SidebarTreeItem
                          key={node.id}
                          node={node}
                          depth={0}
                          onToggle={handleToggle}
                          onSelect={handleSelectNode}
                          selectedId={selectedNode?.id}
                          isMobile={isMobile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Toggle sidebar button */}
            <div style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--glass-border)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: isMobile ? "10px 14px" : "6px 10px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground-muted)",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                {sidebarCollapsed ? (
                  <>
                    <PanelLeft style={{ width: "16px", height: "16px" }} />
                    {!isMobile && "Show sidebar"}
                  </>
                ) : (
                  <>
                    <PanelLeftClose style={{ width: "16px", height: "16px" }} />
                    {!isMobile && "Hide sidebar"}
                  </>
                )}
              </button>

              {/* Breadcrumb showing current selection */}
              {selectedPage && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                  <ChevronRight style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "var(--foreground-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    {selectedPage.icon && <span>{selectedPage.icon}</span>}
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {selectedPage.title}
                    </span>
                  </span>
                  {selectedPage.url && (
                    <a
                      href={selectedPage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "var(--accent)",
                        marginLeft: "auto",
                        flexShrink: 0,
                      }}
                    >
                      <ExternalLink style={{ width: "14px", height: "14px" }} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Content area */}
            <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "16px" : "24px" }}>
              {!selectedPage ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--foreground-muted)",
                  textAlign: "center",
                  padding: "40px",
                }}>
                  <Folder style={{ width: "64px", height: "64px", marginBottom: "20px", opacity: 0.5 }} />
                  <h2 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "8px", color: "var(--foreground)" }}>
                    Select a note or database
                  </h2>
                  <p style={{ fontSize: "14px", maxWidth: "400px" }}>
                    {isMobile ? "Tap the sidebar button to browse your notes" : "Browse your notes in the sidebar and click to view content"}
                  </p>
                </div>
              ) : pageLoading || databaseLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
                  <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                </div>
              ) : pageError ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#f87171", fontSize: "16px", marginBottom: "16px" }}>{pageError}</p>
                  <button
                    onClick={() => {
                      if (selectedNode) {
                        handleSelectNode(selectedNode);
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
              ) : databaseItems.length > 0 ? (
                // Database view - show items as a list
                <div>
                  <div style={{ marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                      {selectedPage?.icon && <span>{selectedPage.icon}</span>}
                      {selectedPage?.title || "Database"}
                    </h2>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                      {databaseItems.length} items
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {databaseItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNavigateInto(item, navigationPath)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: isMobile ? "14px 16px" : "12px 16px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid var(--glass-border)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                        }}
                      >
                        <span style={{ fontSize: isMobile ? "20px" : "18px", flexShrink: 0 }}>
                          {item.icon || "📄"}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: isMobile ? "16px" : "15px",
                            fontWeight: 500,
                            color: "var(--foreground)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {item.title || "Untitled"}
                          </div>
                        </div>
                        <ChevronRight style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : pageBlocks.length > 0 ? (
                // Page view - show content
                <div style={{
                  maxWidth: "900px",
                  width: "100%",
                  margin: "0 auto",
                }}>
                  {selectedPage?.icon && (
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>{selectedPage.icon}</div>
                  )}
                  <h1 style={{
                    fontSize: isMobile ? "28px" : "36px",
                    fontWeight: 700,
                    color: "var(--foreground)",
                    marginBottom: "24px",
                    lineHeight: 1.2,
                  }}>
                    {selectedPage?.title || "Untitled"}
                  </h1>
                  <div>
                    {pageBlocks.map((block) => (
                      <BlockRenderer
                        key={block.id}
                        block={block}
                        onDatabaseClick={(id, title) => {
                          const node: TreeNode = {
                            id,
                            type: "database",
                            title,
                            lastEditedTime: "",
                            url: "",
                            hasChildren: true,
                          };
                          handleNavigateInto(node, navigationPath);
                        }}
                        onPageClick={(id, title) => {
                          const node: TreeNode = {
                            id,
                            type: "page",
                            title,
                            lastEditedTime: "",
                            url: "",
                          };
                          handleNavigateInto(node, navigationPath);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                  <FileText style={{ width: "48px", height: "48px", marginBottom: "16px", opacity: 0.5 }} />
                  <p style={{ fontSize: "16px" }}>This page is empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Loading fallback for Suspense
function NotionBrowserLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function NotionBrowser() {
  return (
    <Suspense fallback={<NotionBrowserLoading />}>
      <NotionBrowserContent />
    </Suspense>
  );
}
