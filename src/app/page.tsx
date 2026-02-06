"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MultiSourceSearch } from "@/components/MultiSourceSearch";
import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    name: "Intelligence",
    tools: [
      {
        id: "curate",
        name: "Curate",
        description: "Curated intelligence",
        icon: Sparkles,
        href: "/tools/curate",
        color: "#8b5cf6",
      },
      {
        id: "l3d",
        name: "L3D",
        description: "Advanced analytics",
        icon: TrendingUp,
        href: "/tools/l3d",
        color: "#10b981",
      },
      {
        id: "deep",
        name: "Deep Search",
        description: "Deep web search",
        icon: Search,
        href: "/tools/deep-search",
        color: "#6366f1",
      },
      {
        id: "dark",
        name: "Dark Search",
        description: "Dark web search",
        icon: Lock,
        href: "/tools/dark-search",
        color: "#dc2626",
      },
      {
        id: "image-lookup",
        name: "Image Lookup",
        description: "Reverse image search",
        icon: Image,
        href: "/tools/image-lookup",
        color: "#a78bfa",
      },
      {
        id: "contact-finder",
        name: "Contact Finder",
        description: "Find contact info",
        icon: UserSearch,
        href: "/tools/contact-finder",
        color: "#6366f1",
      },
      {
        id: "relationship-intel",
        name: "Relationships",
        description: "Contact insights",
        icon: Network,
        href: "/tools/relationship-intel",
        color: "#14b8a6",
      },
      {
        id: "mission",
        name: "Mission",
        description: "Task management",
        icon: Target,
        href: "/tools/mission",
        color: "#f59e0b",
      },
      {
        id: "investors",
        name: "Investors",
        description: "Fundraising pipeline",
        icon: TrendingDown,
        href: "/tools/investors",
        color: "#3b82f6",
      },
      {
        id: "business-info",
        name: "Business Info",
        description: "Company research",
        icon: Building2,
        href: "/tools/business-info",
        color: "#8b5cf6",
      },
      {
        id: "corporate-info",
        name: "Corporate",
        description: "Corporate insights",
        icon: Briefcase,
        href: "/tools/company-politics",
        color: "#10b981",
      },
    ],
  },
  {
    name: "Productivity",
    tools: [
      { id: "emails", name: "Emails", description: "Email management", icon: Mail, href: "/tools/emails", color: "#3b82f6" },
      { id: "calendar", name: "Calendar", description: "Schedule & events", icon: Calendar, href: "/tools/calendar", color: "#10b981" },
      { id: "contacts", name: "Contacts", description: "Contact database", icon: Users, href: "/tools/contacts", color: "#8b5cf6" },
      { id: "people", name: "People", description: "Manage contacts", icon: Users, href: "/tools/people", color: "#06b6d4" },
      { id: "recommendations", name: "Recommendations", description: "Track suggestions", icon: Handshake, href: "/tools/recommendations", color: "#ec4899" },
      { id: "news", name: "News", description: "News aggregation", icon: Newspaper, href: "/tools/news", color: "#64748b" },
      { id: "inoreader", name: "RSS", description: "Feed reader", icon: BookOpen, href: "/tools/inoreader", color: "#10b981" },
      { id: "raindrop", name: "Bookmarks", description: "Bookmark manager", icon: Droplets, href: "/tools/raindrop", color: "#06b6d4" },
      { id: "market", name: "Market", description: "Market data", icon: DollarSign, href: "/tools/market", color: "#3b82f6" },
      { id: "notes", name: "Notes", description: "Note taking", icon: StickyNote, href: "/tools/notes", color: "#a78bfa" },
      { id: "files", name: "Files", description: "File storage", icon: FolderOpen, href: "/tools/files", color: "#6366f1" },
      { id: "spotify", name: "Spotify", description: "Music streaming", icon: Music, href: "/tools/spotify", color: "#1DB954" },
      { id: "accounts", name: "Accounts", description: "Account access", icon: Globe, href: "/tools/accounts", color: "#64748b" },
      { id: "trending", name: "Trending", description: "What's trending", icon: TrendingIcon, href: "/tools/trending", color: "#14b8a6" },
      { id: "visual-rosters", name: "Rosters", description: "Team rosters", icon: BarChart3, href: "/tools/visual-rosters", color: "#3b82f6" },
    ],
  },
];

function DashboardContent() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [displayCategories, setDisplayCategories] = useState(TOOL_CATEGORIES);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || undefined;
  const initialSource = (searchParams?.get("source") === "news" ? "news" : undefined) as any;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load tool settings from localStorage and apply visibility/ordering
  const loadToolConfig = useCallback(() => {
    const storedConfig = localStorage.getItem('tools-config-global');
    if (storedConfig) {
      try {
        const toolsConfig = JSON.parse(storedConfig);

        // Apply visibility and ordering to categories
        const updatedCategories = TOOL_CATEGORIES.map(category => ({
          ...category,
          tools: category.tools
            .filter(tool => {
              const config = toolsConfig[category.name]?.find((t: any) => t.id === tool.id);
              return config ? config.visible : true;
            })
            .map(tool => {
              const config = toolsConfig[category.name]?.find((t: any) => t.id === tool.id);
              return config ? { ...tool, name: config.name, color: config.color } : tool;
            })
            .sort((a, b) => {
              const configA = toolsConfig[category.name]?.find((t: any) => t.id === a.id);
              const configB = toolsConfig[category.name]?.find((t: any) => t.id === b.id);
              const orderA = configA?.order ?? TOOL_CATEGORIES.find(c => c.name === category.name)?.tools.findIndex(t => t.id === a.id) ?? 0;
              const orderB = configB?.order ?? TOOL_CATEGORIES.find(c => c.name === category.name)?.tools.findIndex(t => t.id === b.id) ?? 0;
              return orderA - orderB;
            })
        }));

        setDisplayCategories(updatedCategories);
      } catch (e) {
        console.error("Failed to load tool config", e);
      }
    }
  }, []);

  // Load config on mount
  useEffect(() => {
    loadToolConfig();
  }, [loadToolConfig]);

  // Reload config when window gains focus (user returns from settings)
  useEffect(() => {
    const handleFocus = () => loadToolConfig();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadToolConfig]);

  // Listen for custom storage events from settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tools-config-global') {
        loadToolConfig();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadToolConfig]);

  return (
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
            initialQuery={initialQuery}
            initialSource={initialSource}
            onResultsChange={(hasResults) => {
              setHasSearchResults(hasResults);
            }}
          />
        </div>

        {/* Hide dashboard when search results are active */}
        {!hasSearchResults && (
          <>
            {/* All Tools - Unified Presentation */}
            <div>
              {displayCategories.map((category) => (
                <div key={category.name} style={{ marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--muted)",
                      marginBottom: "12px",
                    }}
                  >
                    {category.name}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))",
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
                            padding: "14px 16px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            position: "relative",
                            overflow: "hidden",
                          }}
                          onClick={() => router.push(tool.href)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.borderColor = tool.color;
                            const overlay = e.currentTarget.querySelector(".tool-overlay") as HTMLElement;
                            if (overlay) overlay.style.opacity = "0.08";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
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
                          <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  background: `${tool.color}20`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Icon style={{ width: "18px", height: "18px", color: tool.color }} />
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    color: "var(--foreground)",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {tool.name}
                                </div>
                                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                                  {tool.description}
                                </div>
                              </div>
                            </div>
                          </div>
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
  );
}

export default function Home() {
  return (
    <>
      <TopNav />
      <BottomNav />
      <Suspense fallback={<div style={{ minHeight: "100vh", paddingTop: "64px" }} />}>
        <DashboardContent />
      </Suspense>
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
