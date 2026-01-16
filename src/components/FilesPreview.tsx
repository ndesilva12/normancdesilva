"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Loader2, ExternalLink } from "lucide-react";
import { DriveFile, getDriveFileIcon, getDriveFileType } from "@/lib/google-services";

interface FilesPreviewProps {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
}

export function FilesPreview({ isGoogleConnected, onConnectGoogle }: FilesPreviewProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isGoogleConnected) {
      fetchFiles();
    }
  }, [isGoogleConnected]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/drive?limit=5");
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
      {/* Header - clickable to navigate to full page */}
      <Link
        href="/tools/files"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          borderBottom: "1px solid var(--glass-border)",
          textDecoration: "none",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <FileText style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", flex: 1 }}>
          Files
        </span>
        <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
      </Link>

      {/* Content */}
      <div style={{ padding: "12px 16px", minHeight: "120px" }}>
        {!isGoogleConnected ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginBottom: "12px" }}>
              Connect Google to see your files
            </p>
            <button
              onClick={onConnectGoogle}
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
          <div style={{ color: "#f87171", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
            {error}
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
