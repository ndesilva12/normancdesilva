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
  Wallet,
  Droplets,
  Music,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
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
import { AccountsPreview } from "@/components/AccountsPreview";
import { RemindersBanner } from "@/components/RemindersBanner";
import { LayoutEditor } from "@/components/LayoutEditor";
import { DraggableWidget, useDragState } from "@/components/DraggableWidget";
import { useLayout, WidgetConfig } from "@/contexts/LayoutContext";
import { useSettings } from "@/contexts/SettingsContext";

// Widget metadata
const WIDGET_META: Record<string, { title: string; icon: React.ComponentType<any>; href: string }> = {
  news: { title: "News", icon: Newspaper, href: "/tools/news" },
  trending: { title: "Trending", icon: TrendingUp, href: "/tools/trending" },
  calendar: { title: "Calendar", icon: Calendar, href: "/tools/calendar" },
  emails: { title: "Emails", icon: Mail, href: "/tools/emails" },
  contacts: { title: "Contacts", icon: Users, href: "/tools/contacts" },
  files: { title: "Files", icon: FolderOpen, href: "/tools/files" },
  notes: { title: "Notes", icon: StickyNote, href: "/tools/notes" },
  stocks: { title: "Market", icon: BarChart3, href: "/tools/market" },
  reading: { title: "Reading", icon: BookOpen, href: "/tools/reading" },
  accounts: { title: "Accounts", icon: Wallet, href: "/tools/accounts" },
  raindrop: { title: "Raindrop", icon: Droplets, href: "/tools/raindrop" },
  inoreader: { title: "Feeds", icon: Rss, href: "/tools/inoreader" },
};

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
  const { isEditMode, layout, reorderWidgets } = useLayout();
  const [isMobile, setIsMobile] = useState(false);
  const [widgetsVisible, setWidgetsVisible] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const previewWidgets = layout.previewWidgets;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Check Google auth status
    fetch("/api/auth/google/status")
      .then(res => res.json())
      .then(data => setIsGoogleConnected(data.authenticated))
      .catch(() => setIsGoogleConnected(false));
  }, []);

  const handleConnectGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  // Drag-and-drop now handled in LayoutEditor
  const handlePreviewDrop = () => {
    // No-op
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
      case "accounts":
        return <AccountsPreview />;
      default:
        return null;
    }
  };

  const renderWidget = (widget: WidgetConfig, index: number) => {
    const meta = WIDGET_META[widget.id];
    if (!meta || !widget.visible) return null;

    return (
      <Card key={widget.id} accentColor="cyan" className="overflow-hidden p-0">
        {renderWidgetContent(widget.id)}
      </Card>
    );
  };

  // Filter visible widgets
  const visibleWidgets = (previewWidgets || []).filter(w => w.visible);

  return (
    <div style={{ minHeight: "100vh", padding: isMobile ? "12px" : "24px" }}>
      <Header />
      
      <div style={{ maxWidth: isMobile ? "100%" : "1400px", margin: "0 auto", paddingTop: "64px" }}>
        <RemindersBanner />

        {isMobile && <MobileDateTimeBanner />}

        {/* Search Bar */}
        <Section gradientColor="cyan" className="mb-6">
          <MultiSourceSearch />
        </Section>

        {/* Layout Editor */}
        {isEditMode && <LayoutEditor />}

        {/* Widget Navigation Bar - Permanent, Icons Link to Tool Pages */}
        <Section gradientColor="purple" className="mb-4">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: isMobile ? "8px" : "12px",
            flexWrap: "wrap",
          }}
        >
          {/* Curate Button - Special Featured Tool */}
          <Link
            href="/tools/curate"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? "4px" : "6px",
              padding: isMobile ? "12px" : "16px 20px",
              minWidth: isMobile ? "70px" : "90px",
              minHeight: isMobile ? "70px" : "80px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(102, 126, 234, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
            }}
          >
            <Sparkles style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "#ffffff" }} />
            <span style={{ fontSize: isMobile ? "11px" : "12px", fontWeight: 600, color: "#ffffff" }}>
              Curate
            </span>
          </Link>

          {/* Last 30 Days Button - Special Featured Tool */}
          <Link
            href="/tools/last30days"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? "4px" : "6px",
              padding: isMobile ? "12px" : "16px 20px",
              minWidth: isMobile ? "70px" : "90px",
              minHeight: isMobile ? "70px" : "80px",
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
            }}
          >
            <Calendar style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", color: "#ffffff" }} />
            <span style={{ fontSize: isMobile ? "11px" : "12px", fontWeight: 600, color: "#ffffff" }}>
              L3D
            </span>
          </Link>

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

          {/* Widget Icons - Only Visible Widgets */}
          {visibleWidgets.map((widget) => {
            const meta = WIDGET_META[widget.id];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <Link
                key={widget.id}
                href={meta.href}
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
                  {meta.title}
                </span>
              </Link>
            );
          })}
        </div>
        </Section>

        {/* Widgets Grid */}
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
            {isEditMode ? (
              // Edit mode: show all widgets with drag handles
              (previewWidgets || []).map((widget, index) => renderWidget(widget, index))
            ) : (
              // Normal mode: show only visible widgets without drag handles
              visibleWidgets.map((widget) => {
                const meta = WIDGET_META[widget.id];
                if (!meta) return null;
                return (
                  <Card key={widget.id} accentColor="cyan" className="overflow-hidden p-0">
                    {renderWidgetContent(widget.id)}
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
