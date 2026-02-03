"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import Link from "next/link";
import {
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
  TrendingUp,
} from "lucide-react";

const PRODUCTIVITY_TOOLS = [
  // Communication & Organization
  { id: "emails", name: "Emails", icon: Mail, href: "/tools/emails", color: "#3b82f6", category: "Communication" },
  { id: "calendar", name: "Calendar", icon: Calendar, href: "/tools/calendar", color: "#10b981", category: "Communication" },
  { id: "contacts", name: "Contacts", icon: Users, href: "/tools/contacts", color: "#f59e0b", category: "Communication" },
  { id: "files", name: "Files", icon: FolderOpen, href: "/tools/files", color: "#8b5cf6", category: "Communication" },
  { id: "notes", name: "Notes", icon: StickyNote, href: "/tools/notes", color: "#ec4899", category: "Communication" },
  
  // Data & Research
  { id: "news", name: "News", icon: Newspaper, href: "/tools/news", color: "#f59e0b", category: "Data" },
  { id: "market", name: "Market", icon: DollarSign, href: "/tools/market", color: "#ef4444", category: "Data" },
  { id: "raindrop", name: "Bookmarks", icon: Droplets, href: "/tools/raindrop", color: "#06b6d4", category: "Data" },
  { id: "inoreader", name: "RSS Reader", icon: BookOpen, href: "/tools/inoreader", color: "#10b981", category: "Data" },
  { id: "trending", name: "Trending", icon: TrendingUp, href: "/tools/trending", color: "#f59e0b", category: "Data" },
  
  // Business Tools
  { id: "business-info", name: "Business Info", icon: Building2, href: "/tools/business-info", color: "#8b5cf6", category: "Business" },
  { id: "visual-rosters", name: "Visual Rosters", icon: BarChart3, href: "/tools/visual-rosters", color: "#3b82f6", category: "Business" },
  { id: "corporate-info", name: "Corporate Info", icon: Briefcase, href: "/tools/company-politics", color: "#10b981", category: "Business" },
  { id: "contact-finder", name: "Contact Finder", icon: UserSearch, href: "/tools/contact-finder", color: "#f59e0b", category: "Business" },
  { id: "image-lookup", name: "Image Lookup", icon: Image, href: "/tools/image-lookup", color: "#ec4899", category: "Business" },
  
  // Other
  { id: "accounts", name: "Accounts", icon: Globe, href: "/tools/accounts", color: "#64748b", category: "Other" },
  { id: "spotify", name: "Spotify", icon: Music, href: "/tools/spotify", color: "#10b981", category: "Other" },
  { id: "notion-browser", name: "Notion Browser", icon: StickyNote, href: "/tools/notion-browser", color: "#6366f1", category: "Other" },
];

const CATEGORIES = ["Communication", "Data", "Business", "Other"];

export default function ProductivityPage() {
  return (
    <>
      <TopNav />
      <BottomNav />

      <div
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          paddingBottom: "24px",
          padding: "64px 24px 24px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "var(--foreground)",
                marginBottom: "8px",
              }}
            >
              Productivity Tools
            </h1>
            <p style={{ fontSize: "16px", color: "var(--muted)" }}>
              Everything you need to stay organized and productive
            </p>
          </div>

          {CATEGORIES.map((category) => (
            <div key={category} style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  marginBottom: "16px",
                }}
              >
                {category}
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {PRODUCTIVITY_TOOLS.filter((t) => t.category === category).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ToolCard({ tool }: { tool: typeof PRODUCTIVITY_TOOLS[0] }) {
  const Icon = tool.icon;

  return (
    <Link href={tool.href} style={{ textDecoration: "none" }}>
      <div
        className="card"
        style={{
          padding: "20px",
          cursor: "pointer",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
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
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: `${tool.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon style={{ width: "20px", height: "20px", color: tool.color }} />
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              {tool.name}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
}
