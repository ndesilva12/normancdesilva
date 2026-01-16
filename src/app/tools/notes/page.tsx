"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  StickyNote,
  Loader2,
  RefreshCw,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Save,
  Edit3,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  lastEditedTime: string;
  url: string;
}

interface NotionBlock {
  id: string;
  type: string;
  content: string;
  hasChildren: boolean;
  children?: NotionBlock[];
}

function NotesContent() {
  const searchParams = useSearchParams();
  const initialNoteId = searchParams.get("id");

  const [pages, setPages] = useState<NotionPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [pageContent, setPageContent] = useState<NotionBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [showNoteContent, setShowNoteContent] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editedBlockContent, setEditedBlockContent] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);

  // New note states
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [creatingNote, setCreatingNote] = useState(false);

  // Add content state
  const [addingContent, setAddingContent] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [savingNewContent, setSavingNewContent] = useState(false);

  // Subpages state
  const [subpages, setSubpages] = useState<NotionPage[]>([]);
  const [showNewSubpage, setShowNewSubpage] = useState(false);
  const [newSubpageTitle, setNewSubpageTitle] = useState("");
  const [creatingSubpage, setCreatingSubpage] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const newContentRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion?limit=50");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notes");
      }
      setPages(data.pages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPageContent = useCallback(async (pageId: string) => {
    setContentLoading(true);
    setSubpages([]);
    try {
      const [pageResponse, contentResponse, subpagesResponse] = await Promise.all([
        fetch(`/api/notion?pageId=${pageId}`),
        fetch(`/api/notion?pageId=${pageId}&content=true`),
        fetch(`/api/notion?pageId=${pageId}&subpages=true`),
      ]);

      const pageData = await pageResponse.json();
      const contentData = await contentResponse.json();
      const subpagesData = await subpagesResponse.json();

      if (pageResponse.ok && pageData.page) {
        setSelectedPage(pageData.page);
        setEditedTitle(pageData.page.title);
      }

      if (contentResponse.ok && contentData.blocks) {
        setPageContent(contentData.blocks);
      }

      if (subpagesResponse.ok && subpagesData.subpages) {
        setSubpages(subpagesData.subpages);
      }
    } catch (err) {
      console.error("Error fetching page content:", err);
    } finally {
      setContentLoading(false);
    }
  }, []);

  const searchNotes = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchNotes();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/notion?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setPages(data.pages || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, [fetchNotes]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (initialNoteId && pages.length > 0) {
      const page = pages.find(p => p.id === initialNoteId);
      if (page) {
        fetchPageContent(page.id);
      } else {
        fetchPageContent(initialNoteId);
      }
    }
  }, [initialNoteId, pages, fetchPageContent]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchNotes(searchQuery);
      } else if (searchQuery === "") {
        fetchNotes();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchNotes, fetchNotes]);

  const handleSelectPage = (page: NotionPage) => {
    setSelectedPage(page);
    setEditedTitle(page.title);
    setEditingTitle(false);
    setEditingBlockId(null);
    setAddingContent(false);
    fetchPageContent(page.id);
    // On mobile, show the note content view
    if (isMobile) {
      setShowNoteContent(true);
    }
  };

  const handleBackToList = () => {
    setShowNoteContent(false);
  };

  const handleSaveTitle = async () => {
    if (!selectedPage || !editedTitle.trim() || editedTitle === selectedPage.title) {
      setEditingTitle(false);
      return;
    }

    setSavingTitle(true);
    try {
      const response = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateTitle",
          pageId: selectedPage.id,
          title: editedTitle.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPage({ ...selectedPage, title: data.page.title });
        setPages(pages.map(p =>
          p.id === selectedPage.id ? { ...p, title: data.page.title } : p
        ));
      }
    } catch (err) {
      console.error("Error saving title:", err);
    } finally {
      setSavingTitle(false);
      setEditingTitle(false);
    }
  };

  const handleSaveBlock = async (blockId: string, blockType: string) => {
    setSavingBlock(true);
    try {
      const response = await fetch("/api/notion/block", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockId,
          content: editedBlockContent,
          blockType,
        }),
      });

      if (response.ok) {
        setPageContent(pageContent.map(block =>
          block.id === blockId ? { ...block, content: editedBlockContent } : block
        ));
      }
    } catch (err) {
      console.error("Error saving block:", err);
    } finally {
      setSavingBlock(false);
      setEditingBlockId(null);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("Delete this block?")) return;

    try {
      const response = await fetch(`/api/notion/block?blockId=${blockId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPageContent(pageContent.filter(block => block.id !== blockId));
      }
    } catch (err) {
      console.error("Error deleting block:", err);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;

    setCreatingNote(true);
    try {
      const response = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: newNoteTitle.trim(),
          content: newNoteContent.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPages([data.page, ...pages]);
        setSelectedPage(data.page);
        setEditedTitle(data.page.title);
        setShowNewNote(false);
        setNewNoteTitle("");
        setNewNoteContent("");
        fetchPageContent(data.page.id);
      }
    } catch (err) {
      console.error("Error creating note:", err);
    } finally {
      setCreatingNote(false);
    }
  };

  const handleArchivePage = async () => {
    if (!selectedPage) return;
    if (!confirm("Archive this note? It will be moved to trash in Notion.")) return;

    try {
      const response = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          pageId: selectedPage.id,
        }),
      });

      if (response.ok) {
        setPages(pages.filter(p => p.id !== selectedPage.id));
        setSelectedPage(null);
        setPageContent([]);
      }
    } catch (err) {
      console.error("Error archiving page:", err);
    }
  };

  const handleAddContent = async () => {
    if (!selectedPage || !newContent.trim()) return;

    setSavingNewContent(true);
    try {
      const response = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "append",
          pageId: selectedPage.id,
          content: newContent.trim(),
        }),
      });

      if (response.ok) {
        setNewContent("");
        setAddingContent(false);
        fetchPageContent(selectedPage.id);
      }
    } catch (err) {
      console.error("Error adding content:", err);
    } finally {
      setSavingNewContent(false);
    }
  };

  const handleCreateSubpage = async () => {
    if (!selectedPage || !newSubpageTitle.trim()) return;

    setCreatingSubpage(true);
    try {
      const response = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSubpage",
          parentPageId: selectedPage.id,
          title: newSubpageTitle.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubpages([...subpages, data.page]);
        setNewSubpageTitle("");
        setShowNewSubpage(false);
      }
    } catch (err) {
      console.error("Error creating subpage:", err);
    } finally {
      setCreatingSubpage(false);
    }
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

  const renderBlock = (block: NotionBlock, index: number) => {
    const isEditing = editingBlockId === block.id;

    const blockStyles: Record<string, React.CSSProperties> = {
      heading_1: { fontSize: "24px", fontWeight: 700, marginTop: index > 0 ? "24px" : 0, marginBottom: "12px" },
      heading_2: { fontSize: "20px", fontWeight: 600, marginTop: index > 0 ? "20px" : 0, marginBottom: "10px" },
      heading_3: { fontSize: "17px", fontWeight: 600, marginTop: index > 0 ? "16px" : 0, marginBottom: "8px" },
      paragraph: { fontSize: "15px", lineHeight: 1.7, marginBottom: "8px" },
      bulleted_list_item: { fontSize: "15px", lineHeight: 1.7, marginBottom: "4px", paddingLeft: "20px" },
      numbered_list_item: { fontSize: "15px", lineHeight: 1.7, marginBottom: "4px", paddingLeft: "20px" },
      quote: { fontSize: "15px", lineHeight: 1.7, marginBottom: "12px", paddingLeft: "16px", borderLeft: "3px solid var(--accent)", fontStyle: "italic" },
      to_do: { fontSize: "15px", lineHeight: 1.7, marginBottom: "4px" },
      code: { fontSize: "13px", fontFamily: "monospace", padding: "12px 16px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "8px", marginBottom: "12px", overflowX: "auto" },
      divider: { height: "1px", backgroundColor: "var(--glass-border)", margin: "16px 0" },
      image: { marginBottom: "12px" },
    };

    const style = blockStyles[block.type] || blockStyles.paragraph;

    if (block.type === "divider") {
      return <div key={block.id} style={style} />;
    }

    if (block.type === "image" && block.content) {
      return (
        <div key={block.id} style={style}>
          <img
            src={block.content}
            alt="Note image"
            style={{ maxWidth: "100%", borderRadius: "8px" }}
          />
        </div>
      );
    }

    const listPrefix = block.type === "bulleted_list_item" ? "• " :
                      block.type === "numbered_list_item" ? `${index + 1}. ` : "";

    return (
      <div
        key={block.id}
        style={{
          ...style,
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          color: "var(--foreground)",
        }}
        className="note-block"
      >
        {isEditing ? (
          <div style={{ flex: 1, display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <textarea
              value={editedBlockContent}
              onChange={(e) => setEditedBlockContent(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                padding: "8px 12px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid var(--accent)",
                borderRadius: "6px",
                color: "var(--foreground)",
                fontSize: "15px",
                lineHeight: 1.6,
                resize: "vertical",
                minHeight: "60px",
                fontFamily: block.type === "code" ? "monospace" : "inherit",
              }}
            />
            <button
              onClick={() => handleSaveBlock(block.id, block.type)}
              disabled={savingBlock}
              style={{
                padding: "8px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {savingBlock ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Check style={{ width: "16px", height: "16px" }} />}
            </button>
            <button
              onClick={() => setEditingBlockId(null)}
              style={{
                padding: "8px",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "var(--foreground-muted)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              <X style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              {listPrefix}{block.content || (block.type === "paragraph" ? "" : "")}
            </div>
            <div className="block-actions" style={{ display: "none", gap: "4px" }}>
              <button
                onClick={() => {
                  setEditingBlockId(block.id);
                  setEditedBlockContent(block.content);
                }}
                style={{
                  padding: "4px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "var(--foreground-muted)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <Edit3 style={{ width: "12px", height: "12px" }} />
              </button>
              <button
                onClick={() => handleDeleteBlock(block.id)}
                style={{
                  padding: "4px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#f87171",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <Trash2 style={{ width: "12px", height: "12px" }} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />

      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px", height: "calc(100vh - 84px)" }}>
          <RemindersBanner />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <StickyNote style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>Notes</h1>
              </div>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                Your Notion notes
              </p>
            </div>
            <button
              onClick={() => setShowNewNote(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "8px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
              New Note
            </button>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: "flex", gap: "20px", height: "calc(100% - 100px)" }}
          >
            {/* Sidebar - Notes List (hidden on mobile when viewing note content) */}
            <div
              className="glass"
              style={{
                width: isMobile ? "100%" : "320px",
                flexShrink: 0,
                borderRadius: "12px",
                display: isMobile && showNoteContent ? "none" : "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Search */}
              <div style={{ padding: "12px", borderBottom: "1px solid var(--glass-border)" }}>
                <div style={{ position: "relative" }}>
                  <Search style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: "var(--foreground-muted)",
                  }} />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 40px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "14px",
                    }}
                  />
                  {isSearching && (
                    <Loader2 style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "16px",
                      height: "16px",
                      color: "var(--accent)",
                      animation: "spin 1s linear infinite",
                    }} />
                  )}
                </div>
              </div>

              {/* Notes List */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                    <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                  </div>
                ) : error ? (
                  <div style={{ padding: "20px", textAlign: "center" }}>
                    <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
                    <button
                      onClick={fetchNotes}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        backgroundColor: "var(--accent)",
                        color: "var(--background)",
                        border: "none",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : pages.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--foreground-muted)" }}>
                    <StickyNote style={{ width: "32px", height: "32px", margin: "0 auto 12px", opacity: 0.5 }} />
                    <p style={{ fontSize: "14px" }}>No notes found</p>
                  </div>
                ) : (
                  pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => handleSelectPage(page)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        backgroundColor: selectedPage?.id === page.id ? "rgba(255,255,255,0.08)" : "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--glass-border)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPage?.id !== page.id) {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPage?.id !== page.id) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: "18px", flexShrink: 0 }}>{page.icon || "📝"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--foreground)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {page.title || "Untitled"}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                          {formatDate(page.lastEditedTime)}
                        </div>
                      </div>
                      <ChevronRight style={{
                        width: "14px",
                        height: "14px",
                        color: "var(--foreground-muted)",
                        opacity: selectedPage?.id === page.id ? 1 : 0,
                      }} />
                    </button>
                  ))
                )}
              </div>

              {/* Refresh Button */}
              <div style={{ padding: "12px", borderTop: "1px solid var(--glass-border)" }}>
                <button
                  onClick={fetchNotes}
                  disabled={loading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "var(--foreground-muted)",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                  }}
                >
                  <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Content Area (hidden on mobile when showing list) */}
            <div
              className="glass"
              style={{
                flex: 1,
                borderRadius: "12px",
                display: isMobile && !showNoteContent ? "none" : "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {selectedPage ? (
                <>
                  {/* Note Header */}
                  <div style={{
                    padding: isMobile ? "16px" : "20px 24px",
                    borderBottom: "1px solid var(--glass-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "12px" : "16px",
                  }}>
                    {/* Back button on mobile */}
                    {isMobile && (
                      <button
                        onClick={handleBackToList}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "var(--foreground-muted)",
                          border: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <ArrowLeft style={{ width: "18px", height: "18px" }} />
                      </button>
                    )}
                    <span style={{ fontSize: isMobile ? "24px" : "28px" }}>{selectedPage.icon || "📝"}</span>
                    <div style={{ flex: 1 }}>
                      {editingTitle ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            ref={titleInputRef}
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveTitle();
                              if (e.key === "Escape") setEditingTitle(false);
                            }}
                            autoFocus
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              border: "1px solid var(--accent)",
                              borderRadius: "6px",
                              color: "var(--foreground)",
                              fontSize: "20px",
                              fontWeight: 600,
                            }}
                          />
                          <button
                            onClick={handleSaveTitle}
                            disabled={savingTitle}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: "var(--accent)",
                              color: "var(--background)",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            {savingTitle ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Save style={{ width: "16px", height: "16px" }} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingTitle(false);
                              setEditedTitle(selectedPage.title);
                            }}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: "rgba(255,255,255,0.1)",
                              color: "var(--foreground-muted)",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <X style={{ width: "16px", height: "16px" }} />
                          </button>
                        </div>
                      ) : (
                        <h2
                          onClick={() => setEditingTitle(true)}
                          style={{
                            fontSize: "20px",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            cursor: "pointer",
                            padding: "4px 0",
                          }}
                        >
                          {selectedPage.title || "Untitled"}
                        </h2>
                      )}
                      <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                        Last edited {formatDate(selectedPage.lastEditedTime)}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a
                        href={selectedPage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "var(--foreground-muted)",
                          textDecoration: "none",
                        }}
                        title="Open in Notion"
                      >
                        <ExternalLink style={{ width: "16px", height: "16px" }} />
                      </a>
                      <button
                        onClick={handleArchivePage}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          color: "#f87171",
                          border: "none",
                          cursor: "pointer",
                        }}
                        title="Archive note"
                      >
                        <Trash2 style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                    {contentLoading ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                        <Loader2 style={{ width: "24px", height: "24px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
                      </div>
                    ) : pageContent.length === 0 ? (
                      <div style={{ color: "var(--foreground-muted)", fontSize: "15px" }}>
                        This note is empty. Click below to add content.
                      </div>
                    ) : (
                      <div>
                        {pageContent.map((block, index) => renderBlock(block, index))}
                      </div>
                    )}

                    {/* Add Content Section */}
                    {addingContent ? (
                      <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                        <textarea
                          ref={newContentRef}
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          placeholder="Add new content..."
                          autoFocus
                          style={{
                            width: "100%",
                            minHeight: "100px",
                            padding: "12px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "6px",
                            color: "var(--foreground)",
                            fontSize: "15px",
                            lineHeight: 1.6,
                            resize: "vertical",
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                          <button
                            onClick={handleAddContent}
                            disabled={savingNewContent || !newContent.trim()}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "10px 16px",
                              borderRadius: "6px",
                              backgroundColor: "var(--accent)",
                              color: "var(--background)",
                              border: "none",
                              cursor: savingNewContent || !newContent.trim() ? "not-allowed" : "pointer",
                              fontSize: "14px",
                              opacity: savingNewContent || !newContent.trim() ? 0.5 : 1,
                            }}
                          >
                            {savingNewContent ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: "14px", height: "14px" }} />}
                            Add Content
                          </button>
                          <button
                            onClick={() => {
                              setAddingContent(false);
                              setNewContent("");
                            }}
                            style={{
                              padding: "10px 16px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(255,255,255,0.1)",
                              color: "var(--foreground-muted)",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingContent(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "24px",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          backgroundColor: "transparent",
                          border: "1px dashed var(--glass-border)",
                          color: "var(--foreground-muted)",
                          cursor: "pointer",
                          fontSize: "14px",
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        <Plus style={{ width: "16px", height: "16px" }} />
                        Add Content
                      </button>
                    )}

                    {/* Subpages Section */}
                    <div style={{ marginTop: "32px", borderTop: "1px solid var(--glass-border)", paddingTop: "24px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>
                          Subnotes
                        </h3>
                        <button
                          onClick={() => setShowNewSubpage(true)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "none",
                            color: "var(--foreground-muted)",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          <Plus style={{ width: "14px", height: "14px" }} />
                          Add Subnote
                        </button>
                      </div>

                      {/* New Subpage Form */}
                      {showNewSubpage && (
                        <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                          <input
                            type="text"
                            value={newSubpageTitle}
                            onChange={(e) => setNewSubpageTitle(e.target.value)}
                            placeholder="Subnote title..."
                            autoFocus
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              border: "1px solid var(--glass-border)",
                              borderRadius: "6px",
                              color: "var(--foreground)",
                              fontSize: "14px",
                              marginBottom: "10px",
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateSubpage()}
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={handleCreateSubpage}
                              disabled={creatingSubpage || !newSubpageTitle.trim()}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                borderRadius: "6px",
                                backgroundColor: "var(--accent)",
                                color: "var(--background)",
                                border: "none",
                                cursor: creatingSubpage || !newSubpageTitle.trim() ? "not-allowed" : "pointer",
                                fontSize: "13px",
                                opacity: creatingSubpage || !newSubpageTitle.trim() ? 0.5 : 1,
                              }}
                            >
                              {creatingSubpage ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: "14px", height: "14px" }} />}
                              Create
                            </button>
                            <button
                              onClick={() => {
                                setShowNewSubpage(false);
                                setNewSubpageTitle("");
                              }}
                              style={{
                                padding: "8px 14px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "var(--foreground-muted)",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Subpages List */}
                      {subpages.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {subpages.map((subpage) => (
                            <button
                              key={subpage.id}
                              onClick={() => handleSelectPage(subpage)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px",
                                borderRadius: "8px",
                                backgroundColor: "rgba(255,255,255,0.03)",
                                border: "1px solid var(--glass-border)",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                              }}
                            >
                              <span style={{ fontSize: "16px" }}>{subpage.icon || "📄"}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)" }}>
                                  {subpage.title || "Untitled"}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                                  {formatDate(subpage.lastEditedTime)}
                                </div>
                              </div>
                              <ChevronRight style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
                            </button>
                          ))}
                        </div>
                      ) : !showNewSubpage && (
                        <p style={{ fontSize: "13px", color: "var(--foreground-muted)", textAlign: "center", padding: "20px" }}>
                          No subnotes yet. Create one to organize your content.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--foreground-muted)",
                }}>
                  <StickyNote style={{ width: "48px", height: "48px", marginBottom: "16px", opacity: 0.5 }} />
                  <p style={{ fontSize: "16px", marginBottom: "8px" }}>Select a note to view</p>
                  <p style={{ fontSize: "14px", opacity: 0.7 }}>or create a new one</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* New Note Modal */}
      {showNewNote && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass"
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
                Create New Note
              </h2>
              <button
                onClick={() => {
                  setShowNewNote(false);
                  setNewNoteTitle("");
                  setNewNoteContent("");
                }}
                style={{
                  padding: "8px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "var(--foreground-muted)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "6px" }}>
                Title
              </label>
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note title..."
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "15px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "6px" }}>
                Content (optional)
              </label>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Start writing..."
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleCreateNote}
                disabled={creatingNote || !newNoteTitle.trim()}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  cursor: creatingNote || !newNoteTitle.trim() ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  opacity: creatingNote || !newNoteTitle.trim() ? 0.5 : 1,
                }}
              >
                {creatingNote ? (
                  <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                ) : (
                  <Plus style={{ width: "16px", height: "16px" }} />
                )}
                Create Note
              </button>
              <button
                onClick={() => {
                  setShowNewNote(false);
                  setNewNoteTitle("");
                  setNewNoteContent("");
                }}
                style={{
                  padding: "12px 20px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "var(--foreground-muted)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .note-block:hover .block-actions {
          display: flex !important;
        }
      `}</style>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
          <Header />
          <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          </main>
        </div>
      }
    >
      <NotesContent />
    </Suspense>
  );
}
