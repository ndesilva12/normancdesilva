"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { DashboardQuickLinks } from "@/components/home/DashboardQuickLinks";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  TrendingUp,
  Search,
  Lock,
  Mail,
  Calendar,
  Users,
  FolderOpen,
  StickyNote,
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
  TrendingUp as TrendingIcon,
  Network,
  Target,
  TrendingDown,
  Handshake,
} from "lucide-react";

const TOOL_CATEGORIES = [
  {
    name: "Intel",
    tools: [
      {
        id: "curate",
        name: "Curate",
        icon: Sparkles,
        href: "/tools/curate",
        color: "#8b5cf6",
      },
      {
        id: "l3d",
        name: "L3D",
        icon: TrendingUp,
        href: "/tools/l3d",
        color: "#10b981",
      },
      {
        id: "deep",
        name: "Deep Search",
        icon: Search,
        href: "/tools/deep-search",
        color: "#6366f1",
      },
      {
        id: "dark",
        name: "Dark Search",
        icon: Lock,
        href: "/tools/dark-search",
        color: "#dc2626",
      },
      {
        id: "image-lookup",
        name: "Image Lookup",
        icon: Image,
        href: "/tools/image-lookup",
        color: "#a78bfa",
      },
      {
        id: "contact-finder",
        name: "Contact Finder",
        icon: UserSearch,
        href: "/tools/contact-finder",
        color: "#6366f1",
      },
      {
        id: "relationship-intel",
        name: "Relationships",
        icon: Network,
        href: "/tools/relationship-intel",
        color: "#14b8a6",
      },
      {
        id: "mission",
        name: "Mission",
        icon: Target,
        href: "/tools/mission",
        color: "#f59e0b",
      },
      {
        id: "investors",
        name: "Investors",
        icon: TrendingDown,
        href: "/tools/investors",
        color: "#3b82f6",
      },
      {
        id: "business-info",
        name: "Business Info",
        icon: Building2,
        href: "/tools/business-info",
        color: "#8b5cf6",
      },
      {
        id: "corporate-info",
        name: "Corporate",
        icon: Briefcase,
        href: "/tools/company-politics",
        color: "#10b981",
      },
    ],
  },
  {
    name: "Basics",
    tools: [
      { id: "emails", name: "Emails", icon: Mail, href: "/tools/emails", color: "#3b82f6" },
      { id: "calendar", name: "Calendar", icon: Calendar, href: "/tools/calendar", color: "#10b981" },
      { id: "contacts", name: "Contacts", icon: Users, href: "/tools/contacts", color: "#8b5cf6" },
      { id: "people", name: "People", icon: Users, href: "/tools/people", color: "#06b6d4" },
      { id: "recommendations", name: "Recommendations", icon: Handshake, href: "/tools/recommendations", color: "#ec4899" },
      { id: "news", name: "News", icon: Newspaper, href: "/tools/news", color: "#64748b" },
      { id: "inoreader", name: "RSS", icon: BookOpen, href: "/tools/inoreader", color: "#10b981" },
      { id: "raindrop", name: "Bookmarks", icon: Droplets, href: "/tools/raindrop", color: "#06b6d4" },
      { id: "market", name: "Market", icon: DollarSign, href: "/tools/market", color: "#3b82f6" },
      { id: "notes", name: "Notes", icon: StickyNote, href: "/tools/notes", color: "#a78bfa" },
      { id: "files", name: "Files", icon: FolderOpen, href: "/tools/files", color: "#6366f1" },
      { id: "spotify", name: "Spotify", icon: Music, href: "/tools/spotify", color: "#1DB954" },
      { id: "accounts", name: "Accounts", icon: Globe, href: "/tools/accounts", color: "#64748b" },
      { id: "trending", name: "Trending", icon: TrendingIcon, href: "/tools/trending", color: "#14b8a6" },
      { id: "visual-rosters", name: "Rosters", icon: BarChart3, href: "/tools/visual-rosters", color: "#3b82f6" },
    ],
  },
];

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          {/* Search */}
          <div style={{ marginBottom: "32px" }}>
            <MultiSourceSearch 
              onResultsChange={(hasResults) => {
                setHasSearchResults(hasResults);
              }}
            />
          </div>

          {/* Hide dashboard when search results are active */}
          {!hasSearchResults && (
            <>
              {/* Dashboard Quick Links */}
              <DashboardQuickLinks />

              {/* All Tools - Unified Presentation */}
              <div>
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                    marginBottom: "32px",
                  }}
                >
                  TOOLS
                </h2>

                {TOOL_CATEGORIES.map((category) => (
                  <div key={category.name} style={{ marginBottom: "32px" }}>
                    <h3
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--muted)",
                        marginBottom: "12px",
                        opacity: 0.7,
                      }}
                    >
                      {category.name}
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      {category.tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <div
                            key={tool.id}
                            className="card"
                            style={{
                              padding: "12px 14px",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              position: "relative",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                            onClick={() => router.push(tool.href)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateX(2px)";
                              e.currentTarget.style.borderColor = tool.color;
                              const overlay = e.currentTarget.querySelector(".tool-overlay") as HTMLElement;
                              if (overlay) overlay.style.opacity = "0.05";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateX(0)";
                              e.currentTarget.style.borderColor = "var(--glass-border)";
                              const overlay = e.currentTarget.querySelector(".tool-overlay") as HTMLElement;
                              if (overlay) overlay.style.opacity = "0";
                            }}
                          >
                            <div
                              className="tool-overlay"
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: tool.color,
                                opacity: 0,
                                transition: "opacity 0.2s",
                                pointerEvents: "none",
                              }}
                            />
                            <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                  background: `${tool.color}20`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Icon style={{ width: "16px", height: "16px", color: tool.color }} />
                              </div>
                            </div>
                            <h3
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "var(--foreground)",
                                margin: 0,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {tool.name}
                            </h3>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function MobileDateTimeBanner() {
  const [dateTime, setDateTime] = useState({ date: "", time: "" });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setDateTime({
        date: now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        marginBottom: "20px",
        padding: "12px 16px",
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
        {dateTime.date}
      </span>
      <span style={{ fontSize: "14px", color: "var(--muted)" }}>
        {dateTime.time}
      </span>
    </div>
  );
}
