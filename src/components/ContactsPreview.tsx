"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Loader2, ExternalLink, RefreshCw, Search, Mail, Phone, Building } from "lucide-react";

interface Contact {
  resourceName: string;
  names?: { displayName: string; givenName?: string; familyName?: string }[];
  emailAddresses?: { value: string; type?: string }[];
  phoneNumbers?: { value: string; type?: string }[];
  photos?: { url: string }[];
  organizations?: { name: string; title?: string }[];
}

interface ContactsPreviewProps {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
}

export function ContactsPreview({ isGoogleConnected, onConnectGoogle }: ContactsPreviewProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (isGoogleConnected) {
      fetchContacts();
    }
  }, [isGoogleConnected]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Re-fetch when search changes
  useEffect(() => {
    if (isGoogleConnected) {
      fetchContacts(debouncedSearch);
    }
  }, [debouncedSearch, isGoogleConnected]);

  const fetchContacts = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (query) {
        params.set("q", query);
      }
      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    await fetch("/api/auth/google/status", { method: "POST" });
    onConnectGoogle();
  };

  const handleEmailClick = (e: React.MouseEvent, email: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tools/emails?compose=${encodeURIComponent(email)}`);
  };

  const getContactName = (contact: Contact) => {
    return contact.names?.[0]?.displayName || "Unknown";
  };

  const getContactEmail = (contact: Contact) => {
    return contact.emailAddresses?.[0]?.value;
  };

  const getContactPhone = (contact: Contact) => {
    return contact.phoneNumbers?.[0]?.value;
  };

  const getContactOrg = (contact: Contact) => {
    return contact.organizations?.[0]?.name;
  };

  const getContactPhoto = (contact: Contact) => {
    return contact.photos?.[0]?.url;
  };

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header - clickable to navigate to full page */}
      <Link
        href="/tools/contacts"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "18px 16px",
          borderBottom: "1px solid var(--glass-border)",
          textDecoration: "none",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        <Users style={{ width: "18px", height: "18px", color: "var(--accent)" }} />
        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", flex: 1 }}>
          Contacts
        </span>
        <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
      </Link>

      {/* Content */}
      <div style={{ padding: "12px 16px", flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        {!isGoogleConnected ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--foreground-muted)", fontSize: "13px", marginBottom: "12px" }}>
              Connect Google to see your contacts
            </p>
            <button
              onClick={onConnectGoogle}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "var(--accent)",
                color: "var(--background)",
                border: "none",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Connect Google
            </button>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                marginBottom: "12px",
              }}
            >
              <Search style={{ width: "14px", height: "14px", color: "var(--foreground-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--foreground)",
                  fontSize: "13px",
                }}
              />
            </div>

            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 0" }}>
                <Loader2 style={{ width: "20px", height: "20px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>
                <button
                  onClick={handleReconnect}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw style={{ width: "14px", height: "14px" }} />
                  Reconnect Google
                </button>
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ color: "var(--foreground-muted)", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>
                {searchQuery ? "No contacts found" : "No contacts yet"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {contacts.map((contact) => {
                  const email = getContactEmail(contact);
                  const phone = getContactPhone(contact);
                  const org = getContactOrg(contact);
                  const photo = getContactPhoto(contact);

                  return (
                    <div
                      key={contact.resourceName}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px",
                        borderRadius: "6px",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Avatar */}
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(var(--accent-rgb), 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Users style={{ width: "16px", height: "16px", color: "var(--accent)" }} />
                        </div>
                      )}

                      {/* Contact Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {getContactName(contact)}
                        </div>
                        {org && (
                          <div style={{ fontSize: "11px", color: "var(--foreground-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Building style={{ width: "10px", height: "10px" }} />
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{org}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                        {email && (
                          <button
                            onClick={(e) => handleEmailClick(e, email)}
                            title={`Email ${email}`}
                            style={{
                              padding: "6px",
                              borderRadius: "4px",
                              border: "none",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(var(--accent-rgb), 0.2)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <Mail style={{ width: "14px", height: "14px", color: "var(--accent)" }} />
                          </button>
                        )}
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            title={`Call ${phone}`}
                            style={{
                              padding: "6px",
                              borderRadius: "4px",
                              border: "none",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background 0.15s",
                              textDecoration: "none",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34, 197, 94, 0.2)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <Phone style={{ width: "14px", height: "14px", color: "#22c55e" }} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
