"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { IntelToolsBar } from "@/components/home/IntelToolsBar";
import { QuickAccessDock } from "@/components/home/QuickAccessDock";
import { DashboardQuickLinks } from "@/components/home/DashboardQuickLinks";
import { RemindersBanner } from "@/components/RemindersBanner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Import all preview components
import { EmailsPreview } from "@/components/EmailsPreview";
import { CalendarPreview } from "@/components/CalendarPreview";
import { ContactsPreview } from "@/components/ContactsPreview";
import { FilesPreview } from "@/components/FilesPreview";
import { NotesPreview } from "@/components/NotesPreview";
import { RaindropPreview } from "@/components/RaindropPreview";
import { NewsPreview } from "@/components/NewsPreview";
import { InoreaderPreview } from "@/components/InoreaderPreview";
import { TrendingPreview } from "@/components/TrendingPreview";
import { StocksPreview } from "@/components/StocksPreview";
import { SpotifyPreview } from "@/components/SpotifyPreview";
import { AccountsPreview } from "@/components/AccountsPreview";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTool, setSelectedTool] = useState<{
    id: string;
    url: string;
    color: string;
    name: string;
  } | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Check Google connection status
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => setIsGoogleConnected(data.isConnected))
      .catch(() => setIsGoogleConnected(false));
  }, []);

  const handleToolClick = (toolId: string, toolUrl: string, toolColor: string, toolName: string) => {
    setSelectedTool({ id: toolId, url: toolUrl, color: toolColor, name: toolName });
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const renderPreview = () => {
    if (!selectedTool) {
      return (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          <p style={{ fontSize: "15px" }}>Click a tool above to preview it here</p>
        </div>
      );
    }

    switch (selectedTool.id) {
      case "emails":
        return <EmailsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={handleConnectGoogle} />;
      case "calendar":
        return <CalendarPreview />;
      case "contacts":
        return <ContactsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={handleConnectGoogle} />;
      case "files":
        return <FilesPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={handleConnectGoogle} />;
      case "notes":
      case "notion-browser":
        return <NotesPreview />;
      case "raindrop":
        return <RaindropPreview />;
      case "news":
        return <NewsPreview />;
      case "inoreader":
        return <InoreaderPreview />;
      case "trending":
        return <TrendingPreview />;
      case "market":
        return <StocksPreview />;
      case "spotify":
        return <SpotifyPreview />;
      case "accounts":
        return <AccountsPreview />;
      default:
        return (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            <p style={{ fontSize: "15px", marginBottom: "20px" }}>
              Preview not available for this tool yet
            </p>
            <button
              onClick={() => router.push(selectedTool.url)}
              style={{
                padding: "10px 24px",
                background: selectedTool.color,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Open Full Tool
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />

      <div
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          paddingBottom: isMobile ? "88px" : "24px",
          padding: isMobile ? "64px 12px 88px 12px" : "64px 24px 24px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Reminders */}
          <RemindersBanner />

          {/* Date/Time (mobile only) */}
          {isMobile && <MobileDateTimeBanner />}

          {/* Search */}
          <div style={{ marginBottom: "32px" }}>
            <MultiSourceSearch />
          </div>

          {/* Dashboard Quick Links */}
          <DashboardQuickLinks />

          {/* Intel Tools Bar */}
          <IntelToolsBar onToolClick={handleToolClick} />

          {/* Quick Access Dock */}
          <QuickAccessDock onToolClick={handleToolClick} />

          {/* Preview Section */}
          <div
            style={{
              marginTop: "32px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid var(--glass-border)",
              position: "relative",
            }}
          >
            {/* Colored top border */}
            <div
              style={{
                height: "3px",
                background: selectedTool?.color || "var(--accent)",
                transition: "background 0.3s",
              }}
            />

            {/* Preview header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--foreground)",
                    marginBottom: "4px",
                  }}
                >
                  {selectedTool?.name || "Preview"}
                </h2>
                <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                  {selectedTool ? "Quick glance at this tool" : "Select a tool to preview"}
                </p>
              </div>
              {selectedTool && (
                <button
                  onClick={() => router.push(selectedTool.url)}
                  style={{
                    padding: "8px 16px",
                    background: selectedTool.color,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Open Full Tool →
                </button>
              )}
            </div>

            {/* Preview content */}
            <div style={{ padding: "24px", minHeight: "400px" }}>
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileDateTimeBanner() {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) return null;

  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "12px 16px",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "8px",
        border: "1px solid var(--glass-border)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px" }}>
        {dateTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
      </div>
      <div style={{ fontSize: "13px", color: "var(--muted)" }}>
        {dateTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}
