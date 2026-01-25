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
  Maximize2,
  Minimize2,
  Type,
  Share2,
  Copy,
  CheckCircle,
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

// Auto-resize textarea hook
function useAutoResize(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
    }
  }, [value]);

  return textareaRef;
}

// Auto-resizing textarea component
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  style,
  autoFocus,
  onKeyDown,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
}) {
  const textareaRef = useAutoResize(value);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      className={className}
      style={{
        overflow: "hidden",
        resize: "none",
        ...style,
      }}
    />
  );
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

  // Full-page edit mode
  const [fullPageEditMode, setFullPageEditMode] = useState(false);
  const [fullPageContent, setFullPageContent] = useState("");
  const [savingFullPage, setSavingFullPage] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

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

  // Handle sharing note via Notion link
  const handleCopyShareLink = async () => {
    if (!selectedPage) return;
    try {
      await navigator.clipboard.writeText(selectedPage.url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareViaEmail = () => {
    if (!selectedPage || !shareEmail.trim()) return;
    const subject = encodeURIComponent(`Shared Note: ${selectedPage.title}`);
    const body = encodeURIComponent(`I'd like to share this note with you:\n\n${selectedPage.title}\n${selectedPage.url}`);
    window.open(`mailto:${shareEmail}?subject=${subject}&body=${body}`);
    setShowShareModal(false);
    setShareEmail("");
  };

  // Enter full-page edit mode - combine all blocks into one editable area
  const enterFullPageEditMode = () => {
    const combinedContent = pageContent
      .map((block) => {
        if (block.type === "heading_1") return `# ${block.content}`;
        if (block.type === "heading_2") return `## ${block.content}`;
        if (block.type === "heading_3") return `### ${block.content}`;
        if (block.type === "bulleted_list_item") return `• ${block.content}`;
        if (block.type === "numbered_list_item") return `- ${block.content}`;
        if (block.type === "quote") return `> ${block.content}`;
        if (block.type === "divider") return "---";
        return block.content;
      })
      .join("\n\n");
    setFullPageContent(combinedContent);
    setFullPageEditMode(true);
  };

  // Save full-page edit - replaces all content
  const saveFullPageEdit = async () => {
    if (!selectedPage) return;

    setSavingFullPage(true);
    try {
      // Step 1: Delete all existing blocks in parallel batches (with rate limiting)
      const blockIds = pageContent.map(b => b.id);
      const batchSize = 3; // Delete 3 blocks at a time to avoid rate limits

      for (let i = 0; i < blockIds.length; i += batchSize) {
        const batch = blockIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(blockId =>
            fetch(`/api/notion/block?blockId=${blockId}`, { method: "DELETE" })
              .catch(err => console.warn(`Error deleting block ${blockId}:`, err))
          )
        );
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < blockIds.length) {
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // Step 2: Append all new content in a single request
      const contentToSave = fullPageContent.trim() || " ";

      const appendResponse = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "append",
          pageId: selectedPage.id,
          content: contentToSave,
        }),
      });

      if (!appendResponse.ok) {
        throw new Error("Failed to save content");
      }

      // Step 3: Refresh the page content
      await fetchPageContent(selectedPage.id);
      setFullPageEditMode(false);
    } catch (err) {
      console.error("Error saving full page edit:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSavingFullPage(false);
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

    // More document-like spacing - tighter for continuous reading
    const blockStyles: Record<string, React.CSSProperties> = {
      heading_1: { fontSize: "26px", fontWeight: 700, marginTop: index > 0 ? "32px" : 0, marginBottom: "16px", lineHeight: 1.3 },
      heading_2: { fontSize: "22px", fontWeight: 600, marginTop: index > 0 ? "28px" : 0, marginBottom: "14px", lineHeight: 1.3 },
      heading_3: { fontSize: "18px", fontWeight: 600, marginTop: index > 0 ? "24px" : 0, marginBottom: "12px", lineHeight: 1.3 },
      paragraph: { fontSize: "16px", lineHeight: 1.85, marginBottom: "16px" },
      bulleted_list_item: { fontSize: "16px", lineHeight: 1.85, marginBottom: "8px", paddingLeft: "24px" },
      numbered_list_item: { fontSize: "16px", lineHeight: 1.85, marginBottom: "8px", paddingLeft: "24px" },
      quote: { fontSize: "16px", lineHeight: 1.85, marginBottom: "16px", paddingLeft: "20px", borderLeft: "3px solid var(--accent)", fontStyle: "italic", color: "var(--foreground-muted)" },
      to_do: { fontSize: "16px", lineHeight: 1.85, marginBottom: "8px" },
      code: { fontSize: "14px", fontFamily: "ui-monospace, monospace", padding: "16px 20px", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "8px", marginBottom: "16px", overflowX: "auto", lineHeight: 1.6 },
      divider: { height: "1px", backgroundColor: "var(--glass-border)", margin: "24px 0" },
      image: { marginBottom: "16px" },
      toggle: { fontSize: "16px", lineHeight: 1.85, marginBottom: "8px", paddingLeft: "24px" },
      callout: { fontSize: "16px", lineHeight: 1.85, marginBottom: "16px", padding: "16px 20px", backgroundColor: "rgba(var(--accent-rgb), 0.1)", borderRadius: "8px", borderLeft: "3px solid var(--accent)" },
      bookmark: { fontSize: "14px", lineHeight: 1.6, marginBottom: "16px", padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px", wordBreak: "break-all" },
      link_preview: { fontSize: "14px", lineHeight: 1.6, marginBottom: "16px", padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "8px", wordBreak: "break-all" },
      child_page: { fontSize: "16px", lineHeight: 1.85, marginBottom: "8px", paddingLeft: "24px", color: "var(--accent)" },
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

    // Handle bookmark and link_preview blocks
    if ((block.type === "bookmark" || block.type === "link_preview") && block.content) {
      return (
        <div key={block.id} style={style}>
          <a
            href={block.content}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >
            {block.content}
          </a>
        </div>
      );
    }

    // Handle toggle blocks with children
    if (block.type === "toggle") {
      return (
        <div key={block.id} style={{ marginBottom: "8px" }}>
          <div style={{ ...style, marginBottom: "4px" }}>▸ {block.content}</div>
          {block.children && block.children.length > 0 && (
            <div style={{ paddingLeft: "24px" }}>
              {block.children.map((child, i) => renderBlock(child, i))}
            </div>
          )}
        </div>
      );
    }

    // Handle child_page blocks
    if (block.type === "child_page") {
      return (
        <div key={block.id} style={style}>
          📄 {block.content || "Untitled"}
        </div>
      );
    }

    const listPrefix = block.type === "bulleted_list_item" ? "• " :
                      block.type === "numbered_list_item" ? `${index + 1}. ` : "";

    return (
      <div key={block.id}>
      <div
        style={{
          ...style,
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          color: "var(--foreground)",
          marginBottom: block.children && block.children.length > 0 ? "4px" : undefined,
        }}
        className="note-block"
      >
        {isEditing ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
            <AutoResizeTextarea
              value={editedBlockContent}
              onChange={(e) => setEditedBlockContent(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingBlockId(null);
                if (e.key === "Enter" && e.metaKey) handleSaveBlock(block.id, block.type);
              }}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "2px solid var(--accent)",
                borderRadius: "8px",
                color: "var(--foreground)",
                fontSize: "15px",
                lineHeight: 1.8,
                minHeight: "120px",
                fontFamily: block.type === "code" ? "monospace" : "inherit",
              }}
            />
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => handleSaveBlock(block.id, block.type)}
                disabled={savingBlock}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: savingBlock ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {savingBlock ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Check style={{ width: "16px", height: "16px" }} />}
                Save
              </button>
              <button
                onClick={() => setEditingBlockId(null)}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "var(--foreground-muted)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--foreground-muted)" }}>
                ⌘+Enter to save • Esc to cancel
              </span>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{ flex: 1, cursor: "pointer" }}
              onClick={() => {
                setEditingBlockId(block.id);
                setEditedBlockContent(block.content);
              }}
            >
              {listPrefix}{block.content || (block.type === "paragraph" ? "" : "")}
            </div>
            <div className="block-actions" style={{ display: isMobile ? "flex" : "none", gap: isMobile ? "8px" : "4px" }}>
              <button
                onClick={() => {
                  setEditingBlockId(block.id);
                  setEditedBlockContent(block.content);
                }}
                style={{
                  padding: isMobile ? "8px" : "4px",
                  minWidth: isMobile ? "36px" : "auto",
                  minHeight: isMobile ? "36px" : "auto",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "var(--foreground-muted)",
                  border: "none",
                  borderRadius: isMobile ? "8px" : "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Edit3 style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }} />
              </button>
              <button
                onClick={() => handleDeleteBlock(block.id)}
                style={{
                  padding: isMobile ? "8px" : "4px",
                  minWidth: isMobile ? "36px" : "auto",
                  minHeight: isMobile ? "36px" : "auto",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#f87171",
                  border: "none",
                  borderRadius: isMobile ? "8px" : "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 style={{ width: isMobile ? "16px" : "12px", height: isMobile ? "16px" : "12px" }} />
              </button>
            </div>
          </>
        )}
      </div>
      {/* Render children blocks if any */}
      {block.children && block.children.length > 0 && (
        <div style={{ paddingLeft: "24px" }}>
          {block.children.map((child, i) => renderBlock(child, i))}
        </div>
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
                        padding: isMobile ? "16px" : "12px 16px",
                        minHeight: isMobile ? "60px" : "auto",
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
                      <button
                        onClick={() => setShowShareModal(true)}
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
                        }}
                        title="Share note"
                      >
                        <Share2 style={{ width: "16px", height: "16px" }} />
                      </button>
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
                      <div style={{ marginTop: "24px", padding: "20px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
                        <AutoResizeTextarea
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          placeholder="Start typing your new content here...

You can write multiple paragraphs.
Press Enter for new lines within this block.
Use ⌘+Enter to save quickly."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.metaKey) handleAddContent();
                            if (e.key === "Escape") {
                              setAddingContent(false);
                              setNewContent("");
                            }
                          }}
                          style={{
                            width: "100%",
                            minHeight: "150px",
                            padding: "16px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "2px solid var(--accent)",
                            borderRadius: "8px",
                            color: "var(--foreground)",
                            fontSize: "15px",
                            lineHeight: 1.8,
                          }}
                        />
                        <div style={{ display: "flex", gap: "8px", marginTop: "16px", alignItems: "center" }}>
                          <button
                            onClick={handleAddContent}
                            disabled={savingNewContent || !newContent.trim()}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "10px 20px",
                              borderRadius: "6px",
                              backgroundColor: "var(--accent)",
                              color: "var(--background)",
                              border: "none",
                              cursor: savingNewContent || !newContent.trim() ? "not-allowed" : "pointer",
                              fontSize: "14px",
                              fontWeight: 500,
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
                          <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--foreground-muted)" }}>
                            ⌘+Enter to save • Esc to cancel
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                        <button
                          onClick={() => setAddingContent(true)}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "14px 16px",
                            borderRadius: "8px",
                            backgroundColor: "transparent",
                            border: "1px dashed var(--glass-border)",
                            color: "var(--foreground-muted)",
                            cursor: "pointer",
                            fontSize: "14px",
                            justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.borderColor = "var(--accent)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.borderColor = "var(--glass-border)";
                          }}
                        >
                          <Plus style={{ width: "16px", height: "16px" }} />
                          Add Content
                        </button>
                        <button
                          onClick={enterFullPageEditMode}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "14px 20px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1px solid var(--glass-border)",
                            color: "var(--foreground)",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 500,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                          }}
                          title="Edit all content as one document"
                        >
                          <Maximize2 style={{ width: "16px", height: "16px" }} />
                          Full Page Edit
                        </button>
                      </div>
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

      {/* Full Page Edit Modal */}
      {fullPageEditMode && selectedPage && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.95)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "12px 16px" : "16px 24px",
            borderBottom: "1px solid var(--glass-border)",
            backgroundColor: "rgba(255,255,255,0.02)",
            gap: "12px",
          }}>
            {/* Close button - prominent on left for mobile */}
            <button
              onClick={() => setFullPageEditMode(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isMobile ? "44px" : "40px",
                height: isMobile ? "44px" : "40px",
                borderRadius: "8px",
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "var(--foreground)",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Close editor"
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
              <Type style={{ width: "20px", height: "20px", color: "var(--accent)", flexShrink: 0, display: isMobile ? "none" : "block" }} />
              <h2 style={{
                fontSize: isMobile ? "15px" : "18px",
                fontWeight: 600,
                color: "var(--foreground)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {isMobile ? selectedPage.title : `Editing: ${selectedPage.title}`}
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {!isMobile && (
                <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                  Edit your entire note as one document
                </span>
              )}
              <button
                onClick={saveFullPageEdit}
                disabled={savingFullPage}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: isMobile ? "10px 16px" : "10px 20px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  cursor: savingFullPage ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {savingFullPage ? (
                  <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                ) : (
                  <Save style={{ width: "16px", height: "16px" }} />
                )}
                {isMobile ? "Save" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Editor */}
          <div style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            padding: "32px",
            overflowY: "auto",
          }}>
            <div style={{
              width: "100%",
              maxWidth: "800px",
            }}>
              <AutoResizeTextarea
                value={fullPageContent}
                onChange={(e) => setFullPageContent(e.target.value)}
                autoFocus
                placeholder="Start writing your note...

Use blank lines to separate paragraphs.
Your content will be saved as individual blocks in Notion."
                style={{
                  width: "100%",
                  minHeight: "calc(100vh - 200px)",
                  padding: "32px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  color: "var(--foreground)",
                  fontSize: "16px",
                  lineHeight: 2,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              />
              <p style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "13px",
                color: "var(--foreground-muted)",
              }}>
                Tip: Use blank lines to separate paragraphs. Each paragraph becomes a separate block in Notion.
              </p>
            </div>
          </div>
        </div>
      )}

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
              <AutoResizeTextarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Start writing...

You can write as much as you want here.
The editor will expand as you type."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey && newNoteTitle.trim()) {
                    handleCreateNote();
                  }
                }}
                style={{
                  width: "100%",
                  minHeight: "150px",
                  padding: "16px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  lineHeight: 1.8,
                }}
              />
              <p style={{ marginTop: "8px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                ⌘+Enter to create • Editor expands as you type
              </p>
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

      {/* Share Note Modal */}
      {showShareModal && selectedPage && (
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
              maxWidth: "450px",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Share2 style={{ width: "20px", height: "20px", color: "var(--accent)" }} />
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
                  Share Note
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareEmail("");
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

            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
              Share &quot;{selectedPage.title}&quot; with others
            </p>

            {/* Copy Link Section */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                Notion Link
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={selectedPage.url}
                  readOnly
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    color: "var(--foreground-muted)",
                    fontSize: "13px",
                  }}
                />
                <button
                  onClick={handleCopyShareLink}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: shareCopied ? "rgba(34, 197, 94, 0.2)" : "var(--accent)",
                    color: shareCopied ? "#22c55e" : "var(--background)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  {shareCopied ? (
                    <>
                      <CheckCircle style={{ width: "16px", height: "16px" }} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy style={{ width: "16px", height: "16px" }} />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "8px" }}>
                Note: Make sure to enable sharing in Notion for this page
              </p>
            </div>

            {/* Email Share Section */}
            <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                Share via Email
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email address..."
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "14px",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleShareViaEmail()}
                />
                <button
                  onClick={handleShareViaEmail}
                  disabled={!shareEmail.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: shareEmail.trim() ? "var(--foreground)" : "var(--foreground-muted)",
                    border: "none",
                    cursor: shareEmail.trim() ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: shareEmail.trim() ? 1 : 0.5,
                  }}
                >
                  Send
                </button>
              </div>
            </div>

            {/* Open in Notion */}
            <div style={{ marginTop: "20px", borderTop: "1px solid var(--glass-border)", paddingTop: "20px" }}>
              <a
                href={selectedPage.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "var(--foreground-muted)",
                  textDecoration: "none",
                  fontSize: "14px",
                  transition: "all 0.15s",
                }}
              >
                <ExternalLink style={{ width: "16px", height: "16px" }} />
                Open in Notion to manage sharing permissions
              </a>
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
