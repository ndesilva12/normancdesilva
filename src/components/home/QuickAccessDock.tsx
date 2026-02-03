"use client";

import Link from "next/link";
import {
  StickyNote,
  Mail,
  Calendar,
  Users,
  FolderOpen,
  Droplets,
  Music,
  Newspaper,
  MoreHorizontal,
} from "lucide-react";

const QUICK_TOOLS = [
  { id: "notes", name: "Notion", icon: StickyNote, href: "/productivity/notion", color: "var(--foreground)" },
  { id: "inbox", name: "Inbox", icon: Mail, href: "/productivity/inbox", color: "var(--accent)" },
  { id: "calendar", name: "Calendar", icon: Calendar, href: "/productivity/calendar", color: "var(--success)" },
  { id: "contacts", name: "Contacts", icon: Users, href: "/productivity/contacts", color: "var(--warning)" },
  { id: "files", name: "Files", icon: FolderOpen, href: "/productivity/files", color: "#3b82f6" },
  { id: "bookmarks", name: "Bookmarks", icon: Droplets, href: "/productivity/bookmarks", color: "#06b6d4" },
  { id: "spotify", name: "Spotify", icon: Music, href: "/productivity/spotify", color: "#10b981" },
  { id: "news", name: "News", icon: Newspaper, href: "/productivity/news", color: "#f59e0b" },
];

export function QuickAccessDock() {
  return (
    <div>
      <div
        style={{
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted)",
          }}
        >
          Quick Access
        </h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {QUICK_TOOLS.map((tool) => (
          <QuickToolButton key={tool.id} tool={tool} />
        ))}
        <MoreButton />
      </div>
    </div>
  );
}

function QuickToolButton({ tool }: { tool: typeof QUICK_TOOLS[0] }) {
  const Icon = tool.icon;

  return (
    <Link href={tool.href} style={{ textDecoration: "none" }}>
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          cursor: "pointer",
          transition: "all 0.2s",
          minWidth: "120px",
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
        <Icon style={{ width: "18px", height: "18px", color: tool.color }} />
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--foreground)",
          }}
        >
          {tool.name}
        </span>
      </div>
    </Link>
  );
}

function MoreButton() {
  return (
    <Link href="/productivity" style={{ textDecoration: "none" }}>
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          cursor: "pointer",
          transition: "all 0.2s",
          minWidth: "120px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.borderColor = "var(--muted)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "var(--glass-border)";
        }}
      >
        <MoreHorizontal style={{ width: "18px", height: "18px", color: "var(--muted)" }} />
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--muted)",
          }}
        >
          More Tools
        </span>
      </div>
    </Link>
  );
}
