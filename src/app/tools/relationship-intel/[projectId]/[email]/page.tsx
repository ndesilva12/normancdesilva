"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Calendar as CalendarIcon,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  Building2,
  User as UserIcon,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { IntelToolNav } from "@/components/IntelToolNav";
import { RemindersBanner } from "@/components/RemindersBanner";
import { Contact, Interaction } from "@/types/relationship-intel";

export default function ContactDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const email = decodeURIComponent(params.email as string);

  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInteractions, setExpandedInteractions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [projectId, email]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/relationship-intel/projects/${projectId}/contacts/${encodeURIComponent(email)}`
      );
      const data = await response.json();
      setContact(data.contact);
      setInteractions(data.interactions || []);
    } catch (error) {
      console.error("Failed to load contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInteraction = (id: string) => {
    setExpandedInteractions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getExternalLink = (interaction: Interaction) => {
    if (interaction.type === "email" && interaction.threadId) {
      return `https://mail.superhuman.com/normancdesilva/gmail/${interaction.threadId}`;
    } else if (interaction.type === "event" && interaction.eventId) {
      return `https://calendar.google.com/calendar/u/0/r/eventedit/${interaction.eventId}`;
    }
    return null;
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

  if (!contact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)" }}>
        <Header />
        <main style={{ flex: 1, paddingTop: "64px", padding: "64px 24px" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "16px" }}>
              Contact not found
            </h1>
            <Link href={`/tools/relationship-intel/${projectId}`} style={{ color: "#14b8a6", textDecoration: "none" }}>
              ← Back to contacts
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)", width: "100%" }}>
      <Header />
      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>
          <RemindersBanner />
          <IntelToolNav current="relationship-intel" />

          {/* Back Button */}
          <Link
            href={`/tools/relationship-intel/${projectId}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", color: "var(--foreground-muted)", textDecoration: "none" }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Contacts
          </Link>

          {/* Contact Header */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", marginBottom: "24px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                {contact.name.charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>
                  {contact.name}
                </h1>
                <p style={{ fontSize: "16px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
                  {contact.email}
                </p>
                {contact.company && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Building2 style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                    <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>{contact.company}</span>
                  </div>
                )}

                {/* Tags */}
                {contact.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {contact.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 14px",
                          background: "rgba(20, 184, 166, 0.15)",
                          border: "1px solid rgba(20, 184, 166, 0.3)",
                          borderRadius: "12px",
                          fontSize: "13px",
                          color: "#14b8a6",
                        }}
                      >
                        <Tag style={{ width: "12px", height: "12px" }} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                  Total Interactions
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#14b8a6" }}>
                  {contact.interactionCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                  First Contact
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
                  {new Date(contact.firstContact).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                  Last Contact
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
                  {new Date(contact.lastContact).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Interactions Timeline */}
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", marginBottom: "16px" }}>
              Interaction History
            </h2>

            {interactions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                }}
              >
                <Clock style={{ width: "40px", height: "40px", color: "var(--foreground-muted)", margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                  No interactions found
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {interactions.map((interaction) => {
                  const isExpanded = expandedInteractions.has(interaction.id);
                  const externalLink = getExternalLink(interaction);

                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        onClick={() => toggleInteraction(interaction.id)}
                        style={{
                          padding: "20px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            background: interaction.type === "email"
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(16, 185, 129, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {interaction.type === "email" ? (
                            <Mail style={{ width: "20px", height: "20px", color: "#3b82f6" }} />
                          ) : (
                            <CalendarIcon style={{ width: "20px", height: "20px", color: "#10b981" }} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: interaction.type === "email" ? "#3b82f6" : "#10b981",
                                textTransform: "uppercase",
                              }}
                            >
                              {interaction.type}
                            </span>
                            <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                              {new Date(interaction.date).toLocaleString()}
                            </span>
                          </div>

                          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                            {interaction.subject}
                          </h3>

                          <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: "1.5" }}>
                            {interaction.summary}
                          </p>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {externalLink && (
                            <a
                              href={externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: "8px",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "6px",
                                color: "var(--foreground-muted)",
                                display: "flex",
                                alignItems: "center",
                                textDecoration: "none",
                              }}
                              title={interaction.type === "email" ? "Open in Superhuman" : "Open in Google Calendar"}
                            >
                              <ExternalLink style={{ width: "16px", height: "16px" }} />
                            </a>
                          )}

                          {isExpanded ? (
                            <ChevronUp style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                          ) : (
                            <ChevronDown style={{ width: "20px", height: "20px", color: "var(--foreground-muted)" }} />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && interaction.content && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                              padding: "20px",
                              background: "rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            <h4 style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px", textTransform: "uppercase" }}>
                              Full Content
                            </h4>
                            <div
                              style={{
                                fontSize: "14px",
                                color: "var(--foreground)",
                                lineHeight: "1.6",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {interaction.content}
                            </div>

                            {interaction.type === "event" && interaction.attendees && interaction.attendees.length > 0 && (
                              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                <h5 style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px" }}>
                                  Attendees
                                </h5>
                                <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                                  {interaction.attendees.join(", ")}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
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
