"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Network,
  ArrowLeft,
  Search as SearchIcon,
  Filter,
  RefreshCw,
  Mail,
  Calendar as CalendarIcon,
  Loader2,
  ChevronDown,
  Tag,
  User
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { IntelToolNav } from "@/components/IntelToolNav";
import { RemindersBanner } from "@/components/RemindersBanner";
import { Contact, Project } from "@/types/relationship-intel";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "lastContact" | "interactionCount">("lastContact");
  const [showTagFilter, setShowTagFilter] = useState(false);

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [contacts, searchQuery, selectedTags, sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load project info
      const projectRes = await fetch(`/api/relationship-intel/projects/list`);
      const projectData = await projectRes.json();
      const foundProject = projectData.projects.find((p: Project) => p.id === projectId);
      setProject(foundProject || null);

      // Load contacts
      const contactsRes = await fetch(
        `/api/relationship-intel/projects/${projectId}/contacts?sortBy=${sortBy}`
      );
      const contactsData = await contactsRes.json();
      setContacts(contactsData.contacts || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...contacts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.company && c.company.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(c =>
        selectedTags.some(tag => c.tags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "lastContact":
          return new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime();
        case "interactionCount":
          return b.interactionCount - a.interactionCount;
        default:
          return 0;
      }
    });

    setFilteredContacts(filtered);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // TODO: Implement sync endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)); // Placeholder
      loadData();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)" }}>
        <Header />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "64px" }}>
          <Loader2 style={{ width: "32px", height: "32px", color: "#14b8a6", animation: "spin 1s linear infinite" }} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)", width: "100%" }}>
      <Header />
      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
          <RemindersBanner />
          <IntelToolNav current="relationship-intel" />

          {/* Back Button */}
          <Link href="/tools/relationship-intel" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", color: "var(--foreground-muted)", textDecoration: "none" }}>
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Projects
          </Link>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <Network style={{ width: "28px", height: "28px", color: "#14b8a6" }} />
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                  {project?.name || projectId}
                </h1>
              </div>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                {filteredContacts.length} contacts
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: syncing ? "rgba(20, 184, 166, 0.3)" : "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: syncing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw style={{ width: "16px", height: "16px", animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {syncing ? "Syncing..." : "Sync"}
            </button>
          </div>

          {/* Filters */}
          <div style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <SearchIcon style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or company..."
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Tag Filter */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowTagFilter(!showTagFilter)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: selectedTags.length > 0 ? "rgba(20, 184, 166, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: selectedTags.length > 0 ? "1px solid #14b8a6" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: selectedTags.length > 0 ? "#14b8a6" : "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Filter style={{ width: "16px", height: "16px" }} />
                Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                <ChevronDown style={{ width: "14px", height: "14px" }} />
              </button>

              {showTagFilter && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  background: "#0f0f0f",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "12px",
                  minWidth: "200px",
                  zIndex: 10,
                }}>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "8px 12px",
                        background: selectedTags.includes(tag) ? "rgba(20, 184, 166, 0.2)" : "transparent",
                        border: "none",
                        borderRadius: "6px",
                        color: selectedTags.includes(tag) ? "#14b8a6" : "var(--foreground-muted)",
                        fontSize: "14px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <Tag style={{ width: "14px", height: "14px" }} />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: "10px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "var(--foreground)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="lastContact">Last Contact</option>
              <option value="name">Name (A-Z)</option>
              <option value="interactionCount">Interactions</option>
            </select>
          </div>

          {/* Contacts List */}
          {filteredContacts.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "64px 24px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
            }}>
              <User style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No contacts yet
              </h3>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                Sync your emails and calendar to populate contacts
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredContacts.map((contact) => (
                <Link
                  key={contact.email}
                  href={`/tools/relationship-intel/${projectId}/${encodeURIComponent(contact.email)}`}
                  style={{ textDecoration: "none" }}
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                      <div style={{ flex: "1 1 300px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                          {contact.name}
                        </h3>
                        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "8px" }}>
                          {contact.email}
                        </p>
                        {contact.company && (
                          <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                            {contact.company}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: 700, color: "#14b8a6" }}>
                            {contact.interactionCount}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                            interactions
                          </div>
                        </div>

                        <div style={{ textAlign: "center", minWidth: "120px" }}>
                          <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                            Last contact
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
                            {new Date(contact.lastContact).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {contact.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                        {contact.tags.map(tag => (
                          <span
                            key={tag}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 12px",
                              background: "rgba(20, 184, 166, 0.15)",
                              border: "1px solid rgba(20, 184, 166, 0.3)",
                              borderRadius: "12px",
                              fontSize: "12px",
                              color: "#14b8a6",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
