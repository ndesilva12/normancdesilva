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
  Eye,
  EyeOff,
  Users,
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
import { RemindersBanner } from "@/components/RemindersBanner";
import { useSettings } from "@/contexts/SettingsContext";

// Widget configuration
const WIDGETS = [
  { id: "files", title: "Files", icon: FolderOpen, href: "/tools/files" },
  { id: "emails", title: "Emails", icon: Mail, href: "/tools/emails" },
  { id: "contacts", title: "Contacts", icon: Users, href: "/tools/contacts" },
  { id: "notes", title: "Notes", icon: StickyNote, href: "/tools/notes" },
  { id: "stocks", title: "Market", icon: BarChart3, href: "/tools/market" },
  { id: "calendar", title: "Calendar", icon: Calendar, href: "/tools/calendar" },
  { id: "news", title: "News", icon: Newspaper, href: "/tools/news" },
  { id: "trending", title: "Trending", icon: TrendingUp, href: "/tools/trending" },
  { id: "raindrop", title: "Reading List", icon: BookOpen, href: "/tools/raindrop" },
];

export default function Home() {
  const { formatTime, formatDate } = useSettings();
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [widgetsVisible, setWidgetsVisible] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    setDateTime(new Date());
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const renderWidgetPreview = (widgetId: string) => {
    switch (widgetId) {
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
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: isMobile ? "12px" : "24px" }}>
      <Header />
      <RemindersBanner />

      {/* Date/Time Banner (Mobile) */}
      {isMobile && dateTime && (
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
            {formatDate(dateTime, { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <span style={{ fontSize: "15px", fontWeight: 400, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
            {formatTime(dateTime)}
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: "24px" }}>
        <MultiSourceSearch />
      </div>

      {/* Hide/Show All Widgets Toggle */}
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setWidgetsVisible(!widgetsVisible)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--glass-border)",
            color: "var(--foreground)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
        >
          {widgetsVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          {widgetsVisible ? "Hide All Widgets" : "Show All Widgets"}
        </button>
      </div>

      {/* Widgets Grid */}
      {widgetsVisible && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            gridAutoRows: "minmax(300px, auto)",
          }}
        >
          {WIDGETS.map((widget) => {
            const Icon = widget.icon;
            
            return (
              <Link
                key={widget.id}
                href={widget.href}
                style={{
                  display: "block",
                  padding: "20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--glass-border)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textDecoration: "none",
                  color: "inherit",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Widget Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <Icon style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      margin: 0,
                    }}
                  >
                    {widget.title}
                  </h3>
                </div>

                {/* Widget Preview */}
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--foreground-muted)",
                    maxHeight: "280px",
                    overflow: "hidden",
                  }}
                >
                  {renderWidgetPreview(widget.id)}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
