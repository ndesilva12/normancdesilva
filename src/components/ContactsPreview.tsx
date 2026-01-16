"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { GoogleContact } from "@/lib/google-services";

interface ContactsPreviewProps {
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
}

export function ContactsPreview({ isGoogleConnected, onConnectGoogle }: ContactsPreviewProps) {
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isGoogleConnected) {
      fetchContacts();
    }
  }, [isGoogleConnected]);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/contacts?limit=6");
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

  const getInitials = (name: string): string => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="glass" style={{ borderRadius: "12px", overflow: "hidden" }}>
      {/* Header - clickable to navigate to full page */}
      <Link
        href="/tools/contacts"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
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
      <div style={{ padding: "12px 16px", minHeight: "120px" }}>
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
        ) : loading ? (
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
            No contacts found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {contacts.slice(0, 5).map((contact) => {
              const name = getContactName(contact);
              const email = getContactEmail(contact);
              const phone = getContactPhone(contact);
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
                  {photo ? (
                    <img
                      src={photo}
                      alt={name}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--background)",
                      }}
                    >
                      {getInitials(name)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      color: "var(--foreground)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {name}
                    </div>
                    <div style={{
                      fontSize: "11px",
                      color: "var(--foreground-muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {email || phone || "No contact info"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
