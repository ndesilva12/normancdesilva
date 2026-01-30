"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Mail,
  StickyNote,
  TrendingUp,
  Newspaper,
  BookOpen,
  BarChart3,
  Calendar,
  Users,
  Rss,
  Eye,
  EyeOff,
} from "lucide-react";
import { Header } from "@/components/Header";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { FilesPreview } from "@/components/FilesPreview";
import { EmailsPreview } from "@/components/EmailsPreview";
import { ContactsPreview } from "@/components/ContactsPreview";
import { NotesPreview } from "@/components/NotesPreview";
import { StocksPreview } from "@/components/StocksPreview";
import { CalendarPreview } from "@/components/CalendarPreview";
import { NewsPreview } from "@/components/NewsPreview";
import { RaindropPreview } from "@/components/RaindropPreview";
import { TrendingPreview } from "@/components/TrendingPreview";
import { InoreaderPreview } from "@/components/InoreaderPreview";
import { RemindersBanner } from "@/components/RemindersBanner";
import { useSettings } from "@/contexts/SettingsContext";

// Widget configuration - order matters for grid display
const WIDGETS = [
  { id: "news", title: "News", icon: Newspaper, href: "/tools/news" },
  { id: "trending", title: "Trending", icon: TrendingUp, href: "/tools/trending" },
  { id: "calendar", title: "Calendar", icon: Calendar, href: "/tools/calendar" },
  { id: "emails", title: "Emails", icon: Mail, href: "/tools/emails" },
  { id: "contacts", title: "Contacts", icon: Users, href: "/tools/contacts" },
  { id: "files", title: "Files", icon: FolderOpen, href: "/tools/files" },
  { id: "notes", title: "Notes", icon: StickyNote, href: "/tools/notes" },
  { id: "stocks", title: "Market", icon: BarChart3, href: "/tools/market" },
  { id: "raindrop", title: "Reading List", icon: BookOpen, href: "/tools/raindrop" },
  { id: "inoreader", title: "RSS Reader", icon: Rss, href: "/tools/inoreader" },
];

// Mobile Date/Time Banner
function MobileDateTimeBanner() {
  const { formatTime, formatDate } = useSettings();
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dateTime) return null;

  const formattedDateStr = formatDate(dateTime, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const formattedTimeStr = formatTime(dateTime);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "16px 0",
        marginBottom: "8px",
      }}
    >
      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
        {formattedDateStr}
      </span>
      <span style={{ fontSize: "15px", fontWeight: 400, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
        {formattedTimeStr}
      </span>
    </div>
  );
}

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [widgetsVisible, setWidgetsVisible] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const renderWidgetContent = (id: string) => {
    switch (id) {
      case "files":
        return <FilesPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={handleConnectGoogle} />;
      case "emails":
        return <EmailsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={handleConnectGoogle} />;
      case "contacts":
        return <ContactsPreview isGoogleConnected={isGoogleConnected} onConnectGoogle={handleConnectGoogle} />;
      case "notes":
        return <NotesPreview />;
      case "stocks":
        return <StocksPreview />;
      case "calendar":
        return <CalendarPreview />;
      case "news":
        return <NewsPreview />;
      case "raindrop":
        return <RaindropPreview />;
      case "trending":
        return <TrendingPreview />;
      case "inoreader":
        return <InoreaderPreview />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: isMobile ? "12px" : "24px" }}>
      <Header />
      
      <div style={{ maxWidth: isMobile ? "100%" : "1400px", margin: "0 auto", paddingTop: "64px" }}>
        <RemindersBanner />

        {isMobile && <MobileDateTimeBanner />}

        {/* Search Bar */}
        <div style={{ marginBottom: "24px" }}>
          <MultiSourceSearch />
        </div>

      {/* Widget Navigation Bar - Permanent, Icons Link to Tool Pages */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: isMobile ? "8px" : "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        {/* Show/Hide Toggle */}
        <button
          onClick={() => setWidgetsVisible(!widgetsVisible)}
          title={widgetsVisible ? "Hide widgets" : "Show widgets"}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? "4px" : "6px",
            padding: isMobile ? "12px" : "16px 20px",
            minWidth: isMobile ? "70px" : "90px",
            minHeight: isMobile ? "70px" : "80px",
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid var(--glass-border)",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {widgetsVisible ? (
            <EyeOff style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "var(--accent)" }} />
          ) : (
            <Eye style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "var(--accent)" }} />
          )}
          <span style={{ fontSize: isMobile ? "11px" : "12px", fontWeight: 500, color: "var(--foreground)" }}>
            {widgetsVisible ? "Hide" : "Show"}
          </span>
        </button>

        {/* Widget Icons - Navigate to Tool Pages */}
        {WIDGETS.map((widget) => {
          const Icon = widget.icon;
          return (
            <Link
              key={widget.id}
              href={widget.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? "4px" : "6px",
                padding: isMobile ? "12px" : "16px 20px",
                minWidth: isMobile ? "70px" : "90px",
                minHeight: isMobile ? "70px" : "80px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Icon style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "var(--accent)" }} />
              <span style={{ fontSize: isMobile ? "11px" : "12px", fontWeight: 500, color: "var(--foreground)", textAlign: "center" }}>
                {widget.title}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Widgets Grid - Always Visible (unless toggled off) */}
      {widgetsVisible && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            gridAutoRows: "364px",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          {WIDGETS.map((widget) => (
            <div
              key={widget.id}
              className="glass"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {renderWidgetContent(widget.id)}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
