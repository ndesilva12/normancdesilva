"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, Tag, Clock, Loader2, Link as LinkIcon } from "lucide-react";

interface RaindropItem {
  id: number;
  title: string;
  excerpt: string;
  url: string;
  domain: string;
  createdAt: string;
  tags: string[];
  coverImage?: string;
  type: string;
}

interface Collection {
  id: number;
  title: string;
  count: number;
  color: string;
}

export function RaindropPreview() {
  const [bookmarks, setBookmarks] = useState<RaindropItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number>(-1); // -1 = All
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  // Connect to Raindrop via OAuth
  const handleConnect = async () => {
    try {
      const response = await fetch("/api/auth/raindrop");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to initiate Raindrop auth:", err);
    }
  };

  // Fetch collections on mount
  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch("/api/raindrop?collections=true");
        const data = await response.json();
        if (data.needsAuth) {
          setNeedsAuth(true);
          return;
        }
        if (data.collections) {
          setCollections(data.collections);
          setNeedsAuth(false);
        }
      } catch (err) {
        console.error("Failed to fetch collections:", err);
      }
    }
    fetchCollections();
  }, []);

  // Fetch bookmarks when collection changes
  useEffect(() => {
    async function fetchBookmarks() {
      if (needsAuth) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/raindrop?collection=${selectedCollection}&limit=12`);
        const data = await response.json();

        if (data.needsAuth) {
          setNeedsAuth(true);
          setBookmarks([]);
        } else if (data.error) {
          setError(data.error);
          setBookmarks([]);
        } else {
          setBookmarks(data.bookmarks || []);
        }
      } catch (err) {
        setError("Failed to load bookmarks");
        setBookmarks([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, [selectedCollection, needsAuth]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get visible collections for the header pills (limit to most useful ones)
  const visibleCollections = collections.slice(0, 5);

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* Header with Collection Pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: "1px solid var(--glass-border)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/tools/raindrop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
            textDecoration: "none",
            padding: "4px 8px 4px 0",
            margin: "-4px 0",
          }}
        >
          <Bookmark style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>
            Reading List
          </span>
        </Link>

        {/* Collection Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          {visibleCollections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection.id)}
              style={{
                padding: "3px 8px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: selectedCollection === collection.id ? "var(--accent)" : "rgba(255, 255, 255, 0.08)",
                color: selectedCollection === collection.id ? "var(--background)" : "var(--foreground-muted)",
                fontSize: "10px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {collection.title}
            </button>
          ))}
        </div>

        <a
          href="https://app.raindrop.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
        </a>
      </div>

      {/* Content */}
      <div style={{ padding: "8px 12px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {needsAuth ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", padding: "20px" }}>
            <Bookmark style={{ width: "32px", height: "32px", color: "var(--foreground-muted)" }} />
            <p style={{ color: "var(--foreground-muted)", fontSize: "13px", textAlign: "center" }}>
              Connect your Raindrop.io account to view your reading list
            </p>
            <button
              onClick={handleConnect}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <LinkIcon style={{ width: "14px", height: "14px" }} />
              Connect Raindrop.io
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--foreground-muted)" }}>
            <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--foreground-muted)", fontSize: "13px" }}>
            {error}
          </div>
        ) : bookmarks.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--foreground-muted)", fontSize: "13px" }}>
            No bookmarks found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {bookmarks.map((bookmark) => (
              <a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
                }}
              >
                {/* Cover Image or Icon */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    backgroundImage: bookmark.coverImage ? `url(${bookmark.coverImage})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {!bookmark.coverImage && (
                    <Bookmark style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "4px",
                    }}
                  >
                    {bookmark.title}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--foreground-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {bookmark.domain}
                    </span>

                    <span style={{ fontSize: "11px", color: "var(--foreground-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Clock style={{ width: "10px", height: "10px" }} />
                      {formatDate(bookmark.createdAt)}
                    </span>
                  </div>

                  {/* Tags */}
                  {bookmark.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                      {bookmark.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(var(--accent-rgb), 0.15)",
                            fontSize: "10px",
                            color: "var(--accent)",
                          }}
                        >
                          <Tag style={{ width: "8px", height: "8px" }} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
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
