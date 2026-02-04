"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, ExternalLink, RefreshCw, ChevronUp } from "lucide-react";
import { DriveFile, getDriveFileIcon, getDriveFileType } from "@/lib/google-services";
import { useLayout } from "@/contexts/LayoutContext";

interface FilesPreviewProps {
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
}

export function FilesPreview({ isGoogleConnected: _unused1, onConnectGoogle: _unused2 }: FilesPreviewProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { getWidgetConfig, toggleWidgetCollapse, isEditMode } = useLayout();
  const router = useRouter();

  const config = getWidgetConfig("previewWidgets", "files");
  const isCollapsed = config?.size === "collapsed";

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  const checkConnectionAndFetch = async () => {
    try {
      const accountsResponse = await fetch("/api/auth/google/accounts");
      const accountsData = await accountsResponse.json();

      if (accountsData.connected && accountsData.accounts.length > 0) {
        setIsConnected(true);
        await fetchFiles();
      } else {
        setIsConnected(false);
        setLoading(false);
      }
    } catch {
      setIsConnected(false);
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/drive?limit=10");
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const returnUrl = encodeURIComponent("/");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleReconnect = async () => {
    handleConnect();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header - clickable to navigate to full page */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: isCollapsed ? "none" : "1px solid var(--glass-border)",
          transition: "background 0.15s",
          flexShrink: 0,
          cursor: isCollapsed ? "default" : "pointer",
        }}
        onClick={() => {
          if (!isCollapsed) {
            router.push("/tools/files");
          }
        }}
      >
        <Link
          href="/tools/files"
          onClick={(e) => {
            e.stopPropagation();
            if (isCollapsed) {
              e.preventDefault();
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            flex: 1,
            pointerEvents: isCollapsed ? "none" : "auto",
          }}
        >
          <FileText style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>
            Files
          </span>
        </Link>

        {/* Collapse button (only shown when not collapsed and not in edit mode) */}
        {!isCollapsed && !isEditMode && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWidgetCollapse("previewWidgets", "files");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--foreground-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
            title="Collapse"
          >
            <ChevronUp style={{ width: "16px", height: "16px" }} />
          </button>
        )}

        {!isCollapsed && (
          <Link
            href="/tools/files"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
          </Link>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginBottom: "12px" }}>
              Connect Google to see your files
            </p>
            <button
              onClick={handleConnect}
              style={{
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
              Connect Google
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
            <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
            <button
              onClick={handleReconnect}
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
              Reconnect Google
            </button>
          </div>
        ) : files.length === 0 ? (
          <div style={{ color: "var(--foreground-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            No recent files found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {files.map((file) => (
              <a
                key={file.id}
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: "16px" }}>{getDriveFileIcon(file.mimeType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "13px",
                    color: "var(--foreground)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                    {getDriveFileType(file.mimeType)} • {formatDate(file.modifiedTime)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
