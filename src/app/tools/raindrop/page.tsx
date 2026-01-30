"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  ExternalLink,
  Folder,
  Star,
  Trash2,
  RefreshCw,
  Globe,
  Tag,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";
import { OpenSourceButton } from "@/components/OpenSourceButton";

interface RaindropItem {
  _id: number;
  title: string;
  excerpt: string;
  link: string;
  domain: string;
  cover: string;
  created: string;
  tags: string[];
  collection: {
    $id: number;
    title: string;
  };
}

interface RaindropCollection {
  _id: number;
  title: string;
  count: number;
}

export default function RaindropPage() {
  const [items, setItems] = useState<RaindropItem[]>([]);
  const [collections, setCollections] = useState<RaindropCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch("/api/auth/raindrop/status");
      const data = await response.json();
      setIsConnected(data.authenticated);
      if (data.authenticated) {
        fetchCollections();
        fetchItems();
      }
    } catch (err) {
      setError("Failed to check Raindrop connection");
      setLoading(false);
    }
  };

  const handleConnectRaindrop = () => {
    window.location.href = "/api/auth/raindrop";
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/raindrop/collections");
      if (!response.ok) throw new Error("Failed to fetch collections");
      const data = await response.json();
      setCollections(data.items || []);
    } catch (err) {
      console.error("Error fetching collections:", err);
    }
  };

  const fetchItems = async (collectionId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = collectionId
        ? `/api/raindrop/items?collectionId=${collectionId}`
        : "/api/raindrop/items";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reading list");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionClick = (collectionId: number) => {
    setSelectedCollection(collectionId);
    fetchItems(collectionId);
  };

  const handleShowAll = () => {
    setSelectedCollection(null);
    fetchItems();
  };

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

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "24px" }}>
      <Header />
      <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "64px" }}>
        <RemindersBanner />
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "24px" }}>
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <BookOpen style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>
              Reading List
            </h1>
          </div>

          {/* Action Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                padding: "0 16px",
                height: "48px",
                flex: 1,
                minWidth: isMobile ? "100%" : "300px",
                marginBottom: isMobile ? "12px" : "0",
              }}
            >
              {/* Search functionality to be implemented */}
              <input
                type="text"
                placeholder="Search reading list..."
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

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {selectedCollection ? (
                <button
                  onClick={handleShowAll}
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
                  <Globe style={{ width: "18px", height: "18px" }} />
                  Show All
                </button>
              ) : null}
              <button
                onClick={() => fetchItems(selectedCollection || undefined)}
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
                <RefreshCw style={{ width: "18px", height: "18px" }} />
                Refresh
              </button>
              <OpenSourceButton />
            </div>
          </div>

          {!isConnected ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <BookOpen style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
              <p style={{ fontSize: "16px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
                Raindrop.io is not connected. Connect your account to view your reading list.
              </p>
              <button
                onClick={handleConnectRaindrop}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                Connect Raindrop.io
              </button>
            </div>
          ) : (
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
                    onClick={() => fetchItems(selectedCollection || undefined)}
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
                      e.currentTarget.style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <p style={{ color: "var(--foreground-muted)", fontSize: "16px" }}>
                    No items in your reading list
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
                  {/* Sidebar */}
                  <div
                    style={{
                      width: isMobile ? "100%" : "240px",
                      borderRight: isMobile ? "none" : "1px solid var(--glass-border)",
                      borderBottom: isMobile ? "1px solid var(--glass-border)" : "none",
                      padding: "16px 0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        backgroundColor: selectedCollection === null ? "rgba(255, 255, 255, 0.1)" : "transparent",
                        fontSize: "15px",
                        fontWeight: selectedCollection === null ? 600 : 400,
                        color: selectedCollection === null ? "var(--foreground)" : "var(--foreground-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      onClick={handleShowAll}
                    >
                      <Globe style={{ width: "18px", height: "18px", color: selectedCollection === null ? "var(--accent)" : "var(--foreground-muted)" }} />
                      All Items
                    </div>
                    {collections.map((collection) => (
                      <div
                        key={collection._id}
                        style={{
                          padding: "8px 16px",
                          margin: "0 8px",
                          borderRadius: "8px",
                          backgroundColor: selectedCollection === collection._id ? "rgba(255, 255, 255, 0.1)" : "transparent",
                          fontSize: "15px",
                          fontWeight: selectedCollection === collection._id ? 600 : 400,
                          color: selectedCollection === collection._id ? "var(--foreground)" : "var(--foreground-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        onClick={() => handleCollectionClick(collection._id)}
                      >
                        <Folder style={{ width: "18px", height: "18px", color: selectedCollection === collection._id ? "var(--accent)" : "var(--foreground-muted)" }} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{collection.title}</span>
                        <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>{collection.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Main Content */}
                  <div style={{ flex: 1, padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Header Row */}
                    <div
                      style={{
                        padding: "0 16px",
                        borderBottom: "1px solid var(--glass-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "var(--foreground-muted)",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ flex: 1 }}>Title</span>
                      <span style={{ width: "200px" }}>Source</span>
                      <span style={{ width: "120px", textAlign: "right" }}>Added</span>
                      <span style={{ width: "60px", textAlign: "right" }}>Actions</span>
                    </div>

                    {/* Items List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 8px" }}>
                      {items.map((item) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "16px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--glass-border)",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", overflow: "hidden" }}>
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: 500,
                                color: "var(--foreground)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.title}
                            </span>
                            {item.excerpt && (
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: "var(--foreground-muted)",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  lineHeight: "1.4",
                                }}
                              >
                                {item.excerpt}
                              </span>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                                {item.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    style={{
                                      fontSize: "12px",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                                      color: "var(--foreground-muted)",
                                    }}
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {item.tags.length > 3 && (
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                                      color: "var(--foreground-muted)",
                                    }}
                                  >
                                    +{item.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: "13px", color: "var(--foreground-muted)", width: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.domain || getDomain(item.link)}
                          </span>
                          <span style={{ fontSize: "13px", color: "var(--foreground-muted)", width: "120px", textAlign: "right" }}>
                            {formatDate(item.created)}
                          </span>
                          <ExternalLink
                            style={{
                              width: "16px",
                              height: "16px",
                              color: "var(--foreground-muted)",
                              cursor: "pointer",
                              marginLeft: "16px",
                            }}
                            onClick={() => window.open(item.link, "_blank", "noopener noreferrer")}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
