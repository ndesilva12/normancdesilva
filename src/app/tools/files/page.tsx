"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { DriveFile, getDriveFileIcon, getDriveFileType } from "@/lib/google-services";

export default function FilesPage() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  const checkConnectionAndFetch = async () => {
    try {
      const statusResponse = await fetch("/api/auth/google/status");
      const status = await statusResponse.json();
      setIsConnected(status.connected);

      if (status.connected) {
        fetchFiles();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/drive?limit=50");
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
      const returnUrl = encodeURIComponent("/tools/files");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
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
              <FileText style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
              <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>Files</h1>
            </div>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
              Your recent Google Docs, Sheets, and Slides
            </p>
          </div>
          {isConnected && (
            <button
              onClick={fetchFiles}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "13px",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          )}
        </div>

        {/* Content */}
        <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
          {!isConnected ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <FileText style={{ width: "48px", height: "48px", color: "var(--accent)", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Connect Google Drive
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                Access your recent Google Docs, Sheets, and Slides
              </p>
              <button
                onClick={handleConnect}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Connect Google
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
              <p>{error}</p>
              <button
                onClick={fetchFiles}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          ) : files.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--foreground-muted)" }}>
              No files found
            </div>
          ) : (
            <div>
              {files.map((file, index) => (
                <a
                  key={file.id}
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px 20px",
                    borderBottom: index < files.length - 1 ? "1px solid var(--glass-border)" : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: "24px" }}>{getDriveFileIcon(file.mimeType)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "15px",
                      color: "var(--foreground)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                      {getDriveFileType(file.mimeType)} • Modified {formatDate(file.modifiedTime)}
                    </div>
                  </div>
                  <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                </a>
              ))}
            </div>
          )}
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
