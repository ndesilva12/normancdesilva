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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchCollections();
    fetchItems();
  }, []);

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
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "16px" : "20px" }}>
          <RemindersBanner />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}
          >
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
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <BookOpen style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>
                  Reading List
                </h1>
              </div>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Organize and read your saved articles from Raindrop.io
              </p>
            </div>
            <OpenSourceButton href="https://raindrop.io" label="Open Raindrop.io" />
          </motion.div>

          {/* Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "280px 1fr",
              gap: "20px",
            }}
          >
            {/* Sidebar - Collections */}
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass"
                style={{
                  borderRadius: "12px",
                  padding: "16px",
                  height: "fit-content",
                  maxHeight: "calc(100vh - 200px)",
                  overflow: "auto",
                }}
              >
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                  Collections
                </h3>

                {/* All Items */}
                <button
                  onClick={handleShowAll}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    backgroundColor: selectedCollection === null ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    marginBottom: "8px",
                  }}
                >
                  <Globe style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
                  <span style={{ fontSize: "14px", color: "var(--foreground)" }}>All Items</span>
                </button>

                {/* Collection List */}
                {collections.map((collection) => (
                  <button
                    key={collection._id}
                    onClick={() => handleCollectionClick(collection._id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "10px 12px",
                      backgroundColor: selectedCollection === collection._id ? "rgba(255,255,255,0.1)" : "transparent",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      marginBottom: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <Folder style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                      <span style={{ fontSize: "14px", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {collection.title}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--foreground-muted)", flexShrink: 0 }}>
                      {collection.count}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Main Content - Items List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                  <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                </div>
              ) : error ? (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
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
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--foreground-muted)" }}>
                  <BookOpen style={{ width: "48px", height: "48px", margin: "0 auto 16px", opacity: 0.5 }} />
                  <p style={{ fontSize: "18px", fontWeight: 500, marginBottom: "8px" }}>No saved articles</p>
                  <p style={{ fontSize: "14px" }}>Your reading list is empty</p>
                </div>
              ) : (
                <div style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
                  {items.map((item, index) => (
                    <div
                      key={item._id}
                      style={{
                        padding: isMobile ? "16px" : "20px",
                        borderBottom: index < items.length - 1 ? "1px solid var(--glass-border)" : "none",
                      }}
                    >
                      {/* Cover Image (if exists) */}
                      {item.cover && (
                        <img
                          src={item.cover}
                          alt={item.title}
                          style={{
                            width: "100%",
                            height: "160px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            marginBottom: "12px",
                          }}
                        />
                      )}

                      {/* Title */}
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          textDecoration: "none",
                          marginBottom: "8px",
                        }}
                      >
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", flex: 1 }}>
                          {item.title}
                        </h3>
                        <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                      </a>

                      {/* Excerpt */}
                      {item.excerpt && (
                        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "12px", lineHeight: "1.5" }}>
                          {item.excerpt.substring(0, 200)}{item.excerpt.length > 200 ? "..." : ""}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                          {item.domain}
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                          •
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                          {formatDate(item.created)}
                        </span>
                        {item.collection && (
                          <>
                            <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                              •
                            </span>
                            <span style={{ fontSize: "13px", color: "var(--accent)" }}>
                              {item.collection.title}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
                          {item.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              style={{
                                fontSize: "12px",
                                padding: "4px 10px",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                border: "1px solid var(--glass-border)",
                                borderRadius: "12px",
                                color: "var(--foreground-muted)",
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
