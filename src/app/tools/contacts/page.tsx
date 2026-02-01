"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Loader2, RefreshCw, Search, Mail, Phone, ExternalLink } from "lucide-react";
import { GoogleContact } from "@/lib/google-services";
import { Header } from "@/components/Header";
import { RemindersBanner } from "@/components/RemindersBanner";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEmailClick = (e: React.MouseEvent, email: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/tools/emails?compose=${encodeURIComponent(email)}`);
  };

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  const checkConnectionAndFetch = async () => {
    try {
      const statusResponse = await fetch("/api/auth/google/status");
      const status = await statusResponse.json();
      setIsConnected(status.connected);

      if (status.connected) {
        fetchContacts();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchContacts = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = query
        ? `/api/contacts?limit=100&q=${encodeURIComponent(query)}`
        : "/api/contacts?limit=100";
      const response = await fetch(url);
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

  const handleConnect = async () => {
    try {
      const returnUrl = encodeURIComponent("/tools/contacts");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts(searchQuery);
  };

  const getContactName = (contact: GoogleContact): string => {
    return contact.names?.[0]?.displayName || contact.emailAddresses?.[0]?.value || "Unknown";
  };

  const getContactEmail = (contact: GoogleContact): string | undefined => {
    return contact.emailAddresses?.[0]?.value;
  };

  const getContactPhone = (contact: GoogleContact): string | undefined => {
    return contact.phoneNumbers?.[0]?.value;
  };

  const getContactPhoto = (contact: GoogleContact): string | undefined => {
    return contact.photos?.[0]?.url;
  };

  const getContactOrg = (contact: GoogleContact): string | undefined => {
    const org = contact.organizations?.[0];
    if (org?.name && org?.title) {
      return `${org.title} at ${org.name}`;
    }
    return org?.name || org?.title;
  };

  const getInitials = (name: string): string => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />
      <main style={{ flex: 1, width: "100%", paddingTop: "64px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
          <RemindersBanner />
          {/* Page Header */}
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
                <Users style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--foreground)" }}>Contacts</h1>
              </div>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                Your Google Contacts
              </p>
            </div>
            {isConnected && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <a
                  href="https://contacts.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    border: "1px solid var(--glass-border)",
                    textDecoration: "none",
                    fontSize: "13px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "var(--foreground-muted)";
                  }}
                >
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                  Open in Google Contacts
                </a>
                <button
                  onClick={() => fetchContacts()}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
            )}
          </div>

          {/* Search Bar */}
        {isConnected && (
          <form onSubmit={handleSearch} style={{ marginBottom: "20px" }}>
            <div
              className="glass"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                borderRadius: "10px",
                padding: "10px 14px",
              }}
            >
              <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  color: "var(--foreground)",
                }}
              />
            </div>
          </form>
        )}

        {/* Content */}
        <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
          {!isConnected ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Users style={{ width: "48px", height: "48px", color: "var(--accent)", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Connect Google Contacts
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                Access your Google Contacts
              </p>
              <button
                onClick={handleConnect}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Connect Google
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
              <p>{error}</p>
              <button
                onClick={() => fetchContacts()}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "var(--foreground)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          ) : contacts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--foreground-muted)" }}>
              No contacts found
            </div>
          ) : (
            <div>
              {contacts.map((contact, index) => {
                const name = getContactName(contact);
                const email = getContactEmail(contact);
                const phone = getContactPhone(contact);
                const photo = getContactPhoto(contact);
                const org = getContactOrg(contact);

                return (
                  <div
                    key={contact.resourceName}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "16px 20px",
                      borderBottom: index < contacts.length - 1 ? "1px solid var(--glass-border)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={name}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          backgroundColor: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "var(--background)",
                        }}
                      >
                        {getInitials(name)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "15px",
                        color: "var(--foreground)",
                        fontWeight: 500,
                      }}>
                        {name}
                      </div>
                      {org && (
                        <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                          {org}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                        {email && (
                          <button
                            onClick={(e) => handleEmailClick(e, email)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              color: "var(--accent)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                            title={`Compose email to ${email}`}
                          >
                            <Mail style={{ width: "12px", height: "12px" }} />
                            {email}
                          </button>
                        )}
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              color: "var(--foreground-muted)",
                              textDecoration: "none",
                            }}
                          >
                            <Phone style={{ width: "12px", height: "12px" }} />
                            {phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
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
