"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, ExternalLink, Tag, Clock, Loader2, Link as LinkIcon } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";

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
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number>(-1); // -1 = All
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const { isEditMode } = useLayout();
  const router = useRouter();

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
        const response = await fetch(`/api/raindrop?collection=${selectedCollection}&limit=50`);
        const data = await response.json();

        if (data.needsAuth) {
          setNeedsAuth(true);
          setBookmarks([]);
        } else if (data.error) {
          setError(data.error);
          setBookmarks([]);
        } else {
          const fetchedBookmarks = data.bookmarks || [];
          setBookmarks(fetchedBookmarks);

          // Extract all unique tags with frequency counts
          const tagCounts = new Map<string, number>();
          fetchedBookmarks.forEach((b: RaindropItem) => {
            b.tags?.forEach((tag: string) => {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
          });

          // Priority tags that should appear first (in this order)
          const priorityTags = ["links", "video", "reading"];

          // Sort tags: priority tags first (in order), then remaining by frequency
          const sortedTags = Array.from(tagCounts.keys()).sort((a, b) => {
            const aIsPriority = priorityTags.indexOf(a.toLowerCase());
            const bIsPriority = priorityTags.indexOf(b.toLowerCase());

            // Both are priority tags - sort by priority order
            if (aIsPriority !== -1 && bIsPriority !== -1) {
              return aIsPriority - bIsPriority;
            }
            // Only a is priority
            if (aIsPriority !== -1) return -1;
            // Only b is priority
            if (bIsPriority !== -1) return 1;
            // Neither is priority - sort by frequency (descending)
            return (tagCounts.get(b) || 0) - (tagCounts.get(a) || 0);
          });

          setAllTags(sortedTags);
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

  // Filter bookmarks by selected tag
  const filteredBookmarks = selectedTag
    ? bookmarks.filter((b) => b.tags?.includes(selectedTag))
    : bookmarks;

  // Display only first 12 filtered bookmarks
  const displayBookmarks = filteredBookmarks.slice(0, 12);

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
      {/* Header with Tag Pills */}
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
          router.push("/tools/raindrop");
        }}
      >
        <Link
          href="/tools/raindrop"
          onClick={(e) => {
            e.stopPropagation();
          }}
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

        {/* Tag Pills */}
        {allTags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            {selectedTag && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTag(null);
                }}
                style={{
                  padding: "3px 8px",
                  borderRadius: "10px",
                  border: "1px solid var(--glass-border)",
                  backgroundColor: "transparent",
                  color: "var(--foreground-muted)",
                  fontSize: "10px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </button>
            )}
            {allTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTag(tag === selectedTag ? null : tag);
                }}
                style={{
                  padding: "3px 8px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: selectedTag === tag ? "var(--accent)" : "rgba(255, 255, 255, 0.08)",
                  color: selectedTag === tag ? "var(--background)" : "var(--foreground-muted)",
                  fontSize: "10px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Spacer when no tags */}
        {allTags.length === 0 && <div style={{ flex: 1 }} />}

        <a
          href="https://app.raindrop.io"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
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
        ) : displayBookmarks.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--foreground-muted)", fontSize: "13px" }}>
            {selectedTag ? `No bookmarks with tag #${selectedTag}` : "No bookmarks found"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayBookmarks.map((bookmark) => (
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
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedTag(tag === selectedTag ? null : tag);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: selectedTag === tag ? "var(--accent)" : "rgba(var(--accent-rgb), 0.15)",
                            fontSize: "10px",
                            color: selectedTag === tag ? "var(--background)" : "var(--accent)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <Tag style={{ width: "8px", height: "8px" }} />
                          {tag}
                        </button>
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
