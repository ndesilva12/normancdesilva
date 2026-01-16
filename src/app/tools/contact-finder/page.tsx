"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  User,
  Target,
  Loader2,
  Mail,
  Phone,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  FileText,
  AlertCircle,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  History,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  SearchType,
  AISource,
  SearchResult,
  ContactResult,
  ContactMethod,
  AI_CONFIGS,
  CONTACT_FINDER_DISCLAIMER,
} from "@/lib/contact-finder";

// Icon mapping for contact types
const CONTACT_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  phone: Phone,
  x: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  website: Globe,
  form: FileText,
  other: Globe,
};

// Confidence color mapping
const CONFIDENCE_COLORS: Record<string, string> = {
  high: "#22c55e",
  medium: "#eab308",
  low: "#f97316",
  speculative: "#ef4444",
};

// Contact Method Card Component
function ContactMethodCard({ contact }: { contact: ContactMethod }) {
  const [copied, setCopied] = useState(false);
  const Icon = CONTACT_ICONS[contact.type] || Globe;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contact.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getContactLink = () => {
    switch (contact.type) {
      case "email":
        return `mailto:${contact.value}`;
      case "phone":
        return `tel:${contact.value}`;
      case "x":
        return contact.value.startsWith("http") ? contact.value : `https://x.com/${contact.value.replace("@", "")}`;
      case "instagram":
        return contact.value.startsWith("http") ? contact.value : `https://instagram.com/${contact.value.replace("@", "")}`;
      case "facebook":
        return contact.value.startsWith("http") ? contact.value : `https://facebook.com/${contact.value}`;
      case "linkedin":
        return contact.value.startsWith("http") ? contact.value : `https://linkedin.com/in/${contact.value}`;
      case "website":
      case "form":
        return contact.value.startsWith("http") ? contact.value : `https://${contact.value}`;
      default:
        return contact.value.startsWith("http") ? contact.value : undefined;
    }
  };

  const link = getContactLink();

  return (
    <div
      className="glass"
      style={{
        padding: "12px 16px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--foreground-muted)",
            }}
          >
            {contact.type}
          </span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: `${CONFIDENCE_COLORS[contact.confidence]}20`,
              color: CONFIDENCE_COLORS[contact.confidence],
              fontWeight: 500,
            }}
          >
            {contact.confidence}
          </span>
        </div>

        <div style={{ fontSize: "14px", color: "var(--foreground)", wordBreak: "break-all" }}>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              {contact.value}
            </a>
          ) : (
            contact.value
          )}
        </div>

        {contact.source && (
          <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>
            Source: {contact.source}
          </div>
        )}

        {contact.notes && (
          <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px", fontStyle: "italic" }}>
            {contact.notes}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
        <button
          onClick={handleCopy}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: copied ? "#22c55e" : "var(--foreground-muted)",
          }}
          title="Copy"
        >
          {copied ? <Check style={{ width: "14px", height: "14px" }} /> : <Copy style={{ width: "14px", height: "14px" }} />}
        </button>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--foreground-muted)",
            }}
            title="Open"
          >
            <ExternalLink style={{ width: "14px", height: "14px" }} />
          </a>
        )}
      </div>
    </div>
  );
}

// Contact Result Card Component
function ContactResultCard({ result, index }: { result: ContactResult; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div
      className="glass"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            backgroundColor: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User style={{ width: "20px", height: "20px", color: "var(--background)" }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>{result.name}</div>
          {(result.title || result.organization) && (
            <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "2px" }}>
              {result.title}
              {result.title && result.organization && " • "}
              {result.organization}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "12px",
              color: "var(--foreground-muted)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            {result.contacts.length} contact{result.contacts.length !== 1 ? "s" : ""}
          </span>
          {expanded ? (
            <ChevronUp style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
          ) : (
            <ChevronDown style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: "0 20px 20px 20px" }}>
          {/* Contact Methods */}
          {result.contacts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {result.contacts.map((contact, i) => (
                <ContactMethodCard key={i} contact={contact} />
              ))}
            </div>
          )}

          {/* Reasoning */}
          {result.reasoning && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                Research Methodology
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--foreground)",
                  lineHeight: 1.6,
                  padding: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "8px",
                }}
              >
                {result.reasoning}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {result.additionalNotes && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "6px" }}>
                Additional Notes
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--foreground)",
                  lineHeight: 1.6,
                  padding: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "8px",
                  fontStyle: "italic",
                }}
              >
                {result.additionalNotes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Search History Item Component
function SearchHistoryItem({
  search,
  onSelect,
  onDelete,
  isSelected,
}: {
  search: SearchResult;
  onSelect: () => void;
  onDelete: () => void;
  isSelected: boolean;
}) {
  const date = new Date(search.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const formattedTime = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "8px",
        backgroundColor: isSelected ? "rgba(var(--accent-rgb), 0.1)" : "transparent",
        border: isSelected ? "1px solid var(--accent)" : "1px solid transparent",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onClick={onSelect}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            backgroundColor: search.searchType === "individual" ? "rgba(59, 130, 246, 0.1)" : "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {search.searchType === "individual" ? (
            <User style={{ width: "14px", height: "14px", color: "#3b82f6" }} />
          ) : (
            <Target style={{ width: "14px", height: "14px", color: "#ef4444" }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {search.query}
          </div>
          <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "2px" }}>
            {formattedDate} at {formattedTime} • {AI_CONFIGS[search.aiSource].name}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "4px",
            backgroundColor: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--foreground-muted)",
            opacity: 0.5,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          title="Delete"
        >
          <Trash2 style={{ width: "14px", height: "14px" }} />
        </button>
      </div>
    </div>
  );
}

export default function ContactFinderPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("individual");
  const [aiSource, setAiSource] = useState<AISource>("grok");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    if (!user) return;
    const storageKey = `contact-finder-history-${user.uid}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch {
        setSearchHistory([]);
      }
    }
  }, [user]);

  // Save search history to localStorage
  const saveHistory = (history: SearchResult[]) => {
    if (!user) return;
    const storageKey = `contact-finder-history-${user.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(history));
    setSearchHistory(history);
  };

  // Run search
  const handleSearch = async () => {
    if (!query.trim() || !user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contact-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          searchType,
          aiSource,
          userId: user.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setCurrentResult(data);

      // Add to history (most recent first, limit to 50)
      const newHistory = [data, ...searchHistory.filter((s) => s.id !== data.id)].slice(0, 50);
      saveHistory(newHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Delete from history
  const handleDeleteHistory = (id: string) => {
    const newHistory = searchHistory.filter((s) => s.id !== id);
    saveHistory(newHistory);
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
  };

  // Select from history
  const handleSelectHistory = (search: SearchResult) => {
    setCurrentResult(search);
    setQuery(search.query);
    setSearchType(search.searchType);
    setAiSource(search.aiSource);
    if (isMobile) setShowHistory(false);
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="glass" style={{ padding: "40px", borderRadius: "16px", textAlign: "center", maxWidth: "400px" }}>
          <AlertCircle style={{ width: "48px", height: "48px", color: "var(--accent)", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            Sign In Required
          </h2>
          <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
            Please sign in to use Contact Finder and save your search history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
              <Search style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
              <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>Contact Finder</h1>
            </div>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
              Find publicly available contact information
            </p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: showHistory ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
              color: showHistory ? "var(--background)" : "var(--foreground-muted)",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <History style={{ width: "14px", height: "14px" }} />
            <span className="hidden sm:inline">History</span>
            {searchHistory.length > 0 && (
              <span
                style={{
                  backgroundColor: showHistory ? "var(--background)" : "var(--accent)",
                  color: showHistory ? "var(--accent)" : "var(--background)",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {searchHistory.length}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: "flex", gap: "20px", flexDirection: isMobile ? "column" : "row" }}>
          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Search Form */}
            <div className="glass" style={{ borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
              {/* Search Type Toggle */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px", display: "block" }}>
                  Search Type
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setSearchType("individual")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      backgroundColor: searchType === "individual" ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      border: searchType === "individual" ? "1px solid #3b82f6" : "1px solid transparent",
                      color: searchType === "individual" ? "#3b82f6" : "var(--foreground-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <User style={{ width: "18px", height: "18px" }} />
                    <span style={{ fontWeight: 500 }}>Individual</span>
                  </button>
                  <button
                    onClick={() => setSearchType("target")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      backgroundColor: searchType === "target" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      border: searchType === "target" ? "1px solid #ef4444" : "1px solid transparent",
                      color: searchType === "target" ? "#ef4444" : "var(--foreground-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <Target style={{ width: "18px", height: "18px" }} />
                    <span style={{ fontWeight: 500 }}>Target</span>
                  </button>
                </div>
                <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "8px" }}>
                  {searchType === "individual"
                    ? "Search for contact info of a specific person"
                    : "Find contacts to achieve a goal (e.g., \"Walmart HR\" or \"get refund from Amazon\")"}
                </p>
              </div>

              {/* AI Source Selector */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px", display: "block" }}>
                  AI Source
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {(Object.keys(AI_CONFIGS) as AISource[]).map((source) => (
                    <button
                      key={source}
                      onClick={() => setAiSource(source)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        backgroundColor: aiSource === source ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
                        border: "none",
                        color: aiSource === source ? "var(--background)" : "var(--foreground-muted)",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500,
                        transition: "all 0.15s",
                      }}
                    >
                      <Sparkles style={{ width: "14px", height: "14px" }} />
                      {AI_CONFIGS[source].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Input */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px", display: "block" }}>
                  {searchType === "individual" ? "Person to Find" : "Target / Goal"}
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchType === "individual"
                      ? "e.g., John Smith, CEO of Acme Corp"
                      : "e.g., Walmart human resources executives, or: I want a refund for my purchase at Whole Foods"
                  }
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    resize: "vertical",
                    minHeight: "80px",
                    outline: "none",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 20px",
                  borderRadius: "10px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !query.trim() ? 0.6 : 1,
                  transition: "all 0.15s",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search style={{ width: "18px", height: "18px" }} />
                    Find Contacts
                  </>
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div
                className="glass"
                style={{
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444", flexShrink: 0 }} />
                  <div style={{ fontSize: "14px", color: "#ef4444" }}>{error}</div>
                </div>
              </div>
            )}

            {/* Results */}
            {currentResult && (
              <div>
                {/* Summary */}
                <div className="glass" style={{ borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Check style={{ width: "18px", height: "18px", color: "#22c55e" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                        Search Complete
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                        {currentResult.summary}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  {currentResult.results.map((result, index) => (
                    <ContactResultCard key={index} result={result} index={index} />
                  ))}
                </div>

                {/* Disclaimer */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(234, 179, 8, 0.1)",
                    border: "1px solid rgba(234, 179, 8, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <AlertCircle style={{ width: "16px", height: "16px", color: "#eab308", flexShrink: 0, marginTop: "2px" }} />
                    <p style={{ fontSize: "12px", color: "#eab308", lineHeight: 1.5, margin: 0 }}>
                      {CONTACT_FINDER_DISCLAIMER}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div
              className="glass"
              style={{
                width: isMobile ? "100%" : "320px",
                flexShrink: 0,
                borderRadius: "16px",
                padding: "16px",
                maxHeight: isMobile ? "400px" : "calc(100vh - 140px)",
                overflowY: "auto",
                position: isMobile ? "relative" : "sticky",
                top: isMobile ? "auto" : "100px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Clock style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>Search History</span>
              </div>

              {searchHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--foreground-muted)", fontSize: "13px" }}>
                  No searches yet. Your search history will appear here.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {searchHistory.map((search) => (
                    <SearchHistoryItem
                      key={search.id}
                      search={search}
                      onSelect={() => handleSelectHistory(search)}
                      onDelete={() => handleDeleteHistory(search.id)}
                      isSelected={currentResult?.id === search.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
