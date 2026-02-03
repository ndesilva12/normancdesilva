"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  StickyNote,
  Mail,
  Calendar,
  Users,
  FolderOpen,
  Droplets,
  Music,
  Newspaper,
  DollarSign,
  BookOpen,
  Briefcase,
  Building2,
  Image,
  BarChart3,
  UserSearch,
  Globe,
  TrendingUp,
} from "lucide-react";

interface GlanceData {
  emailCount: number;
  todayEventCount: number;
  loading: boolean;
}

const QUICK_TOOLS = [
  // Row 1: Communication & Organization (8 tools)
  { id: "emails", name: "Emails", icon: Mail, href: "/tools/emails", color: "#3b82f6" },
  { id: "calendar", name: "Calendar", icon: Calendar, href: "/tools/calendar", color: "#10b981" },
  { id: "contacts", name: "Contacts", icon: Users, href: "/tools/contacts", color: "#f59e0b" },
  { id: "files", name: "Files", icon: FolderOpen, href: "/tools/files", color: "#8b5cf6" },
  { id: "notes", name: "Notes", icon: StickyNote, href: "/tools/notes", color: "#ec4899" },
  { id: "notion-browser", name: "Notion", icon: StickyNote, href: "/tools/notion-browser", color: "#6366f1" },
  { id: "raindrop", name: "Bookmarks", icon: Droplets, href: "/tools/raindrop", color: "#06b6d4" },
  { id: "spotify", name: "Spotify", icon: Music, href: "/tools/spotify", color: "#10b981" },
  
  // Row 2: Data & Business Tools (10 tools)
  { id: "news", name: "News", icon: Newspaper, href: "/tools/news", color: "#f59e0b" },
  { id: "market", name: "Market", icon: DollarSign, href: "/tools/market", color: "#ef4444" },
  { id: "inoreader", name: "RSS", icon: BookOpen, href: "/tools/inoreader", color: "#10b981" },
  { id: "trending", name: "Trending", icon: TrendingUp, href: "/tools/trending", color: "#f59e0b" },
  { id: "business-info", name: "Business Info", icon: Building2, href: "/tools/business-info", color: "#8b5cf6" },
  { id: "visual-rosters", name: "Rosters", icon: BarChart3, href: "/tools/visual-rosters", color: "#3b82f6" },
  { id: "corporate-info", name: "Corporate", icon: Briefcase, href: "/tools/company-politics", color: "#10b981" },
  { id: "contact-finder", name: "Contact Finder", icon: UserSearch, href: "/tools/contact-finder", color: "#f59e0b" },
  { id: "image-lookup", name: "Image Lookup", icon: Image, href: "/tools/image-lookup", color: "#ec4899" },
  { id: "accounts", name: "Accounts", icon: Globe, href: "/tools/accounts", color: "#64748b" },
];

export function QuickAccessDock() {
  const [glanceData, setGlanceData] = useState<GlanceData>({
    emailCount: 0,
    todayEventCount: 0,
    loading: true,
  });

  useEffect(() => {
    // Load email count
    fetch("/api/gmail?limit=1")
      .then((res) => res.json())
      .then((data) => {
        setGlanceData((prev) => ({
          ...prev,
          emailCount: data.total || 0,
        }));
      })
      .catch(() => {});

    // Load today's event count
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayEvents = data.events?.filter((e: any) => {
          const eventStart = new Date(e.start);
          return eventStart >= today && eventStart < tomorrow;
        }) || [];

        setGlanceData((prev) => ({
          ...prev,
          todayEventCount: todayEvents.length,
          loading: false,
        }));
      })
      .catch(() => {
        setGlanceData((prev) => ({ ...prev, loading: false }));
      });
  }, []);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "8px",
        }}
      >
        {QUICK_TOOLS.map((tool) => (
          <QuickToolButton 
            key={tool.id} 
            tool={tool} 
            badge={
              tool.id === "emails" ? glanceData.emailCount :
              tool.id === "calendar" ? glanceData.todayEventCount :
              undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function QuickToolButton({ tool, badge }: { tool: typeof QUICK_TOOLS[0]; badge?: number }) {
  const Icon = tool.icon;
  const showBadge = badge !== undefined && badge > 0;

  return (
    <Link href={tool.href} style={{ textDecoration: "none" }}>
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 14px",
          cursor: "pointer",
          transition: "all 0.2s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = tool.color;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "var(--glass-border)";
        }}
      >
        <Icon style={{ width: "18px", height: "18px", color: tool.color, flexShrink: 0 }} />
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tool.name}
        </span>
        {showBadge && (
          <div
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              minWidth: "18px",
              height: "18px",
              borderRadius: "9px",
              backgroundColor: "var(--accent)",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 5px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            {badge > 99 ? "99+" : badge}
          </div>
        )}
      </div>
    </Link>
  );
}
