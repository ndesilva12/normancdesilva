"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Search, MessageSquare, Settings, Bell } from "lucide-react";
import { Reminders } from "@/components/Actions";

export function TopNav() {
  const pathname = usePathname();
  const [showReminders, setShowReminders] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "linear-gradient(180deg, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.7) 50%, rgba(10, 10, 10, 0) 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          height: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--foreground)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          Norman C. de Silva
        </Link>

        {/* Main Nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <NavLink href="/" icon={Search} label="Home" active={isActive("/")} />
          <NavLink href="/jimmy" icon={MessageSquare} label="Jimmy" active={isActive("/jimmy")} />
          <button
            onClick={() => setShowReminders(!showReminders)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              color: showReminders ? "var(--foreground)" : "var(--muted)",
              background: showReminders ? "var(--glass-bg)" : "transparent",
              border: showReminders ? "1px solid var(--glass-border)" : "1px solid transparent",
              textDecoration: "none",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              if (!showReminders) {
                e.currentTarget.style.color = "var(--foreground)";
                e.currentTarget.style.background = "var(--glass-bg)";
              }
            }}
            onMouseLeave={(e) => {
              if (!showReminders) {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <Bell style={{ width: "18px", height: "18px" }} />
            <span>Reminders</span>
          </button>
          <NavLink href="/settings" icon={Settings} label="Settings" active={isActive("/settings")} />
        </div>
        
        {/* Reminders Modal */}
        {showReminders && (
          <div
            style={{
              position: "fixed",
              top: "64px",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: "40px",
            }}
            onClick={() => setShowReminders(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "90%",
                maxWidth: "600px",
              }}
            >
              <Reminders defaultCollapsed={false} compact={false} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: 600,
        color: active ? "var(--foreground)" : "var(--muted)",
        background: active ? "var(--glass-bg)" : "transparent",
        border: active ? "1px solid var(--glass-border)" : "1px solid transparent",
        textDecoration: "none",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--foreground)";
          e.currentTarget.style.background = "var(--glass-bg)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon style={{ width: "18px", height: "18px" }} />
      <span>{label}</span>
    </Link>
  );
}
