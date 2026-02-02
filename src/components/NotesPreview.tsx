"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  StickyNote,
  Loader2,
  ExternalLink,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Database,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";

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

// Tree item component for recursive rendering
function TreeItem({
  node,
  depth = 0,
  onToggle,
  onNavigate,
}: {
  node: TreeNode;
  depth?: number;
  onToggle: (id: string) => void;
  onNavigate: (node: TreeNode) => void;
}) {
  const hasChildren = node.hasChildren || (node.children && node.children.length > 0);
  const isExpanded = node.expanded;
  const isDatabase = node.type === "database";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "6px 4px",
          paddingLeft: `${depth * 16 + 4}px`,
          borderRadius: "6px",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
            width: "18px",
            height: "18px",
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
            <Loader2 style={{ width: "12px", height: "12px", animation: "spin 1s linear infinite" }} />
          ) : hasChildren ? (
            isExpanded ? (
              <ChevronDown style={{ width: "14px", height: "14px" }} />
            ) : (
              <ChevronRight style={{ width: "14px", height: "14px" }} />
            )
          ) : (
            <span style={{ width: "14px" }} />
          )}
        </button>

        {/* Icon */}
        <span
          style={{ fontSize: "14px", flexShrink: 0, width: "18px", textAlign: "center" }}
          onClick={() => onNavigate(node)}
        >
          {node.icon ? (
            node.icon
          ) : isDatabase ? (
            <Database style={{ width: "14px", height: "14px", color: "var(--accent)" }} />
          ) : hasChildren ? (
            isExpanded ? (
              <FolderOpen style={{ width: "14px", height: "14px", color: "#fbbf24" }} />
            ) : (
              <Folder style={{ width: "14px", height: "14px", color: "#fbbf24" }} />
            )
          ) : (
            <FileText style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
          )}
        </span>

        {/* Title - clickable to navigate */}
        <span
          onClick={() => onNavigate(node)}
          style={{
            flex: 1,
            fontSize: "13px",
            color: "var(--foreground)",
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
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NotesPreview() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion-workspace?action=tree");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notes");
      }
      // Initialize tree nodes with expanded = false
      const items = (data.items || []).map((item: TreeNode) => ({
        ...item,
        expanded: false,
        children: [],
      }));
      setTree(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

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

  // Toggle expand/collapse for a node
  const handleToggle = useCallback(async (nodeId: string) => {
    // Find the node in the tree
    const findAndToggle = async (nodes: TreeNode[]): Promise<TreeNode[]> => {
      return Promise.all(nodes.map(async (node) => {
        if (node.id === nodeId) {
          // If already expanded, just collapse
          if (node.expanded) {
            return { ...node, expanded: false };
          }
          // If not expanded, fetch children if needed and expand
          if (!node.children || node.children.length === 0) {
            // Set loading state
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

  // Helper to update a specific node in the tree
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

  // Navigate to full page with selected item
  const handleNavigate = useCallback((node: TreeNode) => {
    if (node.type === "database") {
      router.push(`/tools/notion-browser?databaseId=${node.id}&title=${encodeURIComponent(node.title)}`);
    } else {
      router.push(`/tools/notion-browser?pageId=${node.id}`);
    }
  }, [router]);

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header - clickable to navigate to full page */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: "1px solid var(--glass-border)",
          flexShrink: 0,
          cursor: "pointer",
        }}
        onClick={() => {
          router.push("/tools/notion-browser");
        }}
      >
        <Link
          href="/tools/notion-browser"
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flex: 1,
            padding: "4px 0",
            margin: "-4px 0",
          }}
        >
          <StickyNote style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>
            Notes
          </span>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fetchTree();
          }}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            color: "var(--foreground-muted)",
          }}
        >
          <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
        <Link
          href="/tools/notion-browser"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
        </Link>
      </div>

      {/* Content - Tree View */}
      <div style={{ padding: "8px 8px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {loading && tree.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
            <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
            <button
              onClick={fetchTree}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px" }} />
              Retry
            </button>
          </div>
        ) : tree.length === 0 ? (
          <div style={{ color: "var(--foreground-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            No notes found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
                onToggle={handleToggle}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
